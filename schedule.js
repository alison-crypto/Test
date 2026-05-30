const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const dayLabel = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const today = dayMap[new Date().getDay()];
const STORAGE_KEY = 'rtc_schedule_day_v1';

let currentDay;
try {
  currentDay = localStorage.getItem(STORAGE_KEY) || today;
} catch (e) {
  currentDay = today;
}

function switchDay(day) {
  currentDay = day;
  try {
    localStorage.setItem(STORAGE_KEY, day);
  } catch (e) {}
  document.querySelectorAll('.day-page').forEach((p) =>
    p.classList.toggle('active', p.dataset.day === day)
  );
  document.querySelectorAll('.day-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.day === day)
  );
}

document.querySelectorAll('.day-btn').forEach((b) => {
  b.addEventListener('click', () => switchDay(b.dataset.day));
});

switchDay(currentDay);

// ============================================================
// ICS export — adds the day's events to the iOS / system calendar
// ============================================================

function parseTime(s) {
  const m = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { h, min };
}

function nextOccurrence(dayCode) {
  const target = dayMap.indexOf(dayCode);
  const now = new Date();
  const delta = (target - now.getDay() + 7) % 7;
  const d = new Date(now);
  d.setDate(now.getDate() + delta);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtLocal(date, h, m) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(h).padStart(2, '0');
  const mn = String(m).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${mn}00`;
}

function fmtStamp() {
  // DTSTAMP must be UTC
  const d = new Date();
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r?\n/g, '\\n');
}

function buildEventsForDay(dayCode) {
  const date = nextOccurrence(dayCode);
  const page = document.querySelector(`.day-page[data-day="${dayCode}"]`);
  if (!page) return { date, events: [] };

  const raw = [];
  page.querySelectorAll('.t-row').forEach((row) => {
    if (row.classList.contains('sleep')) return;
    const b = row.querySelector('.t-act b');
    const summary = b ? b.textContent.trim() : '';
    if (!summary || /^free\b/i.test(summary)) return;

    const timeEl = row.querySelector('.t-time');
    if (!timeEl) return;
    const t = parseTime(timeEl.textContent);
    if (!t) return;

    const det = row.querySelector('.t-det');
    raw.push({
      summary,
      detail: det ? det.textContent.trim() : '',
      hour: t.h,
      min: t.min,
    });
  });

  // Merge consecutive rows that share the same summary into one block
  const merged = [];
  raw.forEach((ev) => {
    const last = merged[merged.length - 1];
    const startMin = ev.hour * 60 + ev.min;
    const endMin = startMin + 60;
    if (last && last.summary === ev.summary && last.endMin === startMin) {
      last.endMin = endMin;
      if (ev.detail && !last.detail.includes(ev.detail)) {
        last.detail = last.detail ? last.detail + ' · ' + ev.detail : ev.detail;
      }
    } else {
      merged.push({
        summary: ev.summary,
        detail: ev.detail,
        startMin,
        endMin,
      });
    }
  });

  return { date, events: merged };
}

function exportDayICS(dayCode) {
  const { date, events } = buildEventsForDay(dayCode);
  if (events.length === 0) {
    alert('Nothing to export for this day.');
    return;
  }

  const dateStr = fmtLocal(date, 0, 0).slice(0, 8);
  const stamp = fmtStamp();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RTC Assistant//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((ev, i) => {
    const sh = Math.floor(ev.startMin / 60);
    const sm = ev.startMin % 60;
    const eh = Math.floor(ev.endMin / 60);
    const em = ev.endMin % 60;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:rtc-sched-${dayCode}-${dateStr}-${i}@rtc-assistant`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${fmtLocal(date, sh, sm)}`);
    lines.push(`DTEND:${fmtLocal(date, eh, em)}`);
    lines.push(`SUMMARY:${icsEscape(ev.summary)}`);
    if (ev.detail) lines.push(`DESCRIPTION:${icsEscape(ev.detail)}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');

  const ics = lines.join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schedule-${dayCode}-${dateStr}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

// Inject an "Add to Calendar" button into each day page
document.querySelectorAll('.day-page').forEach((page) => {
  const dayCode = page.dataset.day;
  const wrap = document.createElement('div');
  wrap.className = 'sched-export';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sched-export-btn';
  btn.textContent = `📅 Add ${dayLabel[dayCode] || dayCode} to Calendar`;
  btn.addEventListener('click', () => exportDayICS(dayCode));
  const hint = document.createElement('div');
  hint.className = 'sched-export-hint';
  hint.textContent = 'Adds next occurrence as 1-hour blocks. Sleep + free time skipped. Re-import to update.';
  wrap.appendChild(btn);
  wrap.appendChild(hint);
  page.appendChild(wrap);
});
