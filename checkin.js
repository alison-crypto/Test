// checkin.js — the 📏 Weekly tab on the Health page: scale + tape + photos,
// one check-in a week, with the change vs last week and since the start.
// Data lives only in Supabase (body_scans, body_measures, progress_photos and
// the private body-photos bucket, all owner-only). No personal numbers here.
import { supabase, getSession } from './supabase-client.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const weekOf = (d) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); };

// [key, label, unit, decimals, better: 'down' | 'up' | null]
const SCALE = [
  ['weight_lb', 'Weight', 'lb', 1, null],
  ['body_fat_pct', 'Body fat', '%', 1, 'down'],
  ['muscle_lb', 'Muscle', 'lb', 1, 'up'],
  ['fat_free_lb', 'Fat-free mass', 'lb', 1, 'up'],
  ['visceral', 'Visceral fat', '', 0, 'down'],
  ['subq_fat_pct', 'Subcutaneous fat', '%', 1, 'down'],
  ['water_pct', 'Body water', '%', 1, null],
];
const TAPE = [
  ['waist', 'Waist', 'down'], ['hips', 'Butt / hips', null], ['chest', 'Chest', 'up'],
  ['shoulders', 'Shoulders', 'up'], ['neck', 'Neck', null],
  ['bicep_l', 'Bicep L', 'up'], ['bicep_r', 'Bicep R', 'up'],
  ['forearm_l', 'Forearm L', null], ['forearm_r', 'Forearm R', null],
  ['thigh_l', 'Thigh L', null], ['thigh_r', 'Thigh R', null],
  ['calf_l', 'Calf L', null], ['calf_r', 'Calf R', null],
];
const POSES = [
  ['front', 'Front'], ['side_r', 'Side (R)'], ['back', 'Back'], ['side_l', 'Side (L)'],
  ['front_flex', 'Front flex'], ['side_r_flex', 'Side flex (R)'], ['back_flex', 'Back flex'], ['side_l_flex', 'Side flex (L)'],
];
const CORE_POSES = ['front', 'side_r', 'back', 'side_l'];
const BUCKET = 'body-photos';

let uid = null;
let scans = [], tapes = [], photos = [], notes = [];
let comparePose = 'front';

// latest row per week, newest week first
function byWeek(rows, key) {
  const m = new Map();
  rows.forEach((r) => { const w = weekOf(r[key]); if (!m.has(w) || r[key] > m.get(w)[key]) m.set(w, r); });
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([w, r]) => ({ w, r }));
}
const fmtIn = (v) => { const n = Number(v); const whole = Math.floor(n), frac = n - whole; const f = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[Math.round(frac * 4) / 4]; return frac && f ? `${whole}${f}` : String(+n.toFixed(2)); };
function delta(v, prev, dec, better, unit) {
  if (prev == null || v == null) return '<td class="ci-d">—</td>';
  const d = Number(v) - Number(prev);
  if (Math.abs(d) < 1e-9) return '<td class="ci-d">0</td>';
  const cls = !better ? '' : (better === 'up') === (d > 0) ? 'pg-good' : 'pg-bad';
  const txt = unit === 'in' ? `${d > 0 ? '+' : '−'}${fmtIn(Math.abs(d))}` : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(dec)}`;
  return `<td class="ci-d ${cls}">${esc(txt)}</td>`;
}
const weekLabel = (w) => { const P = window.RACE_PLAN; const wk = P && P.weekFor ? P.weekFor(new Date(w + "T12:00:00")) : null; return wk && wk.n ? `Week ${wk.n}` : `Week of ${fmtDate(w)}`; };

function table(title, rows, defs, getVal, unitOf, dec) {
  if (!rows.length) return '';
  const cur = rows[0], prev = rows[1], first = rows[rows.length - 1];
  return `<section class="rp-card"><h2>${esc(title)}</h2>
    <p class="rp-muted">${esc(weekLabel(cur.w))} · ${esc(fmtDate(cur.date))}${prev ? ` · vs ${esc(fmtDate(prev.date))}` : ''}${rows.length > 2 ? ` · start ${esc(fmtDate(first.date))}` : ''}</p>
    <div class="ci-scroll"><table class="ci-tbl"><thead><tr><th></th><th>Now</th><th>Δ last</th>${rows.length > 2 ? '<th>Δ start</th>' : ''}</tr></thead><tbody>
    ${defs.map((d) => {
      const v = getVal(cur.r, d[0]); if (v == null) return '';
      const u = unitOf(d), dc = dec(d), better = d[d.length - 1];
      return `<tr><th>${esc(d[1])}</th><td><b>${esc(u === 'in' ? fmtIn(v) : Number(v).toFixed(dc))}</b><small> ${esc(u)}</small></td>
        ${delta(v, prev ? getVal(prev.r, d[0]) : null, dc, better, u)}
        ${rows.length > 2 ? delta(v, getVal(first.r, d[0]), dc, better, u) : ''}</tr>`;
    }).join('')}
    </tbody></table></div></section>`;
}

function history() {
  const weeks = [...new Set([...scans.map((s) => weekOf(s.measured)), ...tapes.map((t) => weekOf(t.measured)), ...photos.map((p) => weekOf(p.taken))])].sort().reverse();
  if (!weeks.length) return '';
  return `<details class="rp-card"><summary><b>Every check-in (${weeks.length} weeks)</b></summary>
    ${weeks.map((w) => {
      const s = byWeek(scans, 'measured').find((x) => x.w === w), t = byWeek(tapes, 'measured').find((x) => x.w === w);
      const ph = photos.filter((p) => weekOf(p.taken) === w).length;
      return `<div class="lab-report"><b>${esc(weekLabel(w))}</b> · ${s ? `${esc(s.r.weight_lb)} lb · ${esc(s.r.body_fat_pct)}% fat` : 'no scale'} · ${t ? `waist ${esc(fmtIn(t.r.waist))} in` : 'no tape'} · ${ph ? `${ph} photos` : 'no photos'}</div>`;
    }).join('')}</details>`;
}

function checklist() {
  const w = weekOf(iso(new Date()));
  const s = scans.some((x) => weekOf(x.measured) === w);
  const t = tapes.some((x) => weekOf(x.measured) === w);
  const got = new Set(photos.filter((p) => weekOf(p.taken) === w).map((p) => p.pose));
  const core = CORE_POSES.filter((p) => got.has(p)).length;
  const item = (ok, label, hint) => `<li class="${ok ? 'ci-ok' : ''}"><span>${ok ? '✅' : '⬜️'}</span><div><b>${esc(label)}</b><i>${esc(hint)}</i></div></li>`;
  return `<section class="rp-card"><h2>This week’s check-in · ${esc(weekLabel(w))}</h2>
    <ul class="ci-check">
      ${item(s, 'Scale', 'Same day each week, on waking, after the bathroom, before food or drink. Send Claude the screenshot.')}
      ${item(t, 'Tape — 13 sites', 'Same morning, tape snug not tight, relaxed muscles. Waist at the belly button, breathe out normally.')}
      ${item(core === 4, `Photos — ${core}/4 core${got.size > core ? ` (+${got.size - core} flex)` : ''}`, 'Same spot, same light, same shorts, phone at belly height. Front, both sides, back; flexes optional.')}
    </ul></section>`;
}

function tapeForm() {
  const last = tapes[0] || {};
  return `<details class="rp-card" id="ci-tape-card"><summary><b>✏️ Log tape measurements</b></summary>
    <form id="ci-tape" class="ci-form">
      <label class="ci-date">Date <input type="date" name="measured" value="${esc(iso(new Date()))}" required></label>
      <div class="ci-fields">${TAPE.map(([k, label]) => `<label>${esc(label)}<input name="${k}" inputmode="decimal" placeholder="${last[k] != null ? esc(fmtIn(last[k])) : 'in'}"></label>`).join('')}</div>
      <p class="rp-muted">Inches. You can type ½ ¼ ¾ or decimals (e.g. 39.25). Leave a box empty to skip it.</p>
      <button type="submit" class="race-preset-btn ci-save">Save tape</button><span class="ci-msg" id="ci-tape-msg"></span>
    </form></details>`;
}

function photoBlock() {
  const dates = [...new Set(photos.map((p) => p.taken))].sort();
  const latest = dates[dates.length - 1], first = dates[0];
  return `<section class="rp-card"><h2>📸 Progress photos</h2>
    ${dates.length ? `<div class="ci-poses">${POSES.filter(([k]) => photos.some((p) => p.pose === k)).map(([k, l]) => `<button type="button" class="race-preset-btn ${k === comparePose ? 'active' : ''}" data-pose="${k}">${esc(l)}</button>`).join('')}</div>
      <div class="ci-compare" id="ci-compare">${dates.length > 1 ? `<figure data-path-date="${esc(first)}"></figure><figure data-path-date="${esc(latest)}"></figure>` : `<figure data-path-date="${esc(latest)}"></figure>`}</div>` : '<p class="rp-muted">No photos yet — add this week’s below. They’re stored privately in your account.</p>'}
    <details class="ci-up"${photos.some((p) => weekOf(p.taken) === weekOf(iso(new Date()))) ? '' : ' open'}><summary><b>＋ Add this week’s photos</b></summary>
      <label class="ci-date">Date <input type="date" id="ci-photo-date" value="${esc(iso(new Date()))}"></label>
      <div class="ci-fields">${POSES.map(([k, l]) => `<label class="ci-file">${esc(l)}<input type="file" accept="image/*" data-upload="${k}"><span class="ci-msg" data-msg="${k}"></span></label>`).join('')}</div>
      <p class="rp-muted">Photos are shrunk on your phone first, then saved to your private folder — only you can see them.</p>
    </details></section>`;
}

async function fillCompare() {
  const box = document.getElementById('ci-compare'); if (!box) return;
  const figs = [...box.querySelectorAll('figure')];
  const want = figs.map((f) => photos.find((p) => p.taken === f.dataset.pathDate && p.pose === comparePose));
  const paths = want.filter(Boolean).map((p) => p.path);
  const { data } = paths.length ? await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600) : { data: [] };
  figs.forEach((f, i) => {
    const p = want[i]; const u = p && (data || []).find((x) => x.path === p.path);
    f.innerHTML = p && u && u.signedUrl ? `<img src="${esc(u.signedUrl)}" alt="${esc(comparePose)} ${esc(p.taken)}" loading="lazy"><figcaption>${esc(weekLabel(weekOf(p.taken)))} · ${esc(fmtDate(p.taken))}</figcaption>` : `<div class="ci-none">No ${esc(comparePose.replace('_', ' '))} photo</div><figcaption>${esc(fmtDate(f.dataset.pathDate))}</figcaption>`;
  });
}

function parseIn(s) {
  s = String(s || '').trim().replace(',', '.'); if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([¼½¾]|1\/4|1\/2|3\/4)?$/); if (!m) return NaN;
  return Number(m[1]) + ({ '¼': 0.25, '1/4': 0.25, '½': 0.5, '1/2': 0.5, '¾': 0.75, '3/4': 0.75 }[m[2]] || 0);
}

async function compress(file, maxDim = 1400, quality = 0.85) {
  const img = await createImageBitmap(file);
  const k = Math.min(1, maxDim / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', quality));
}

function render() {
  const host = document.getElementById('checkin-root');
  const note = notes[0];
  const sw = byWeek(scans, 'measured').map((x) => ({ ...x, date: x.r.measured }));
  const tw = byWeek(tapes, 'measured').map((x) => ({ ...x, date: x.r.measured }));
  host.innerHTML = `
    ${checklist()}
    ${note ? `<section class="rp-card lab-summary"><div class="rp-eyebrow">Claude’s read · ${esc(fmtDate(note.noted))}</div><h2>${esc(note.title || '')}</h2><div class="lab-text">${esc(note.summary)}</div></section>` : ''}
    ${table('⚖️ Scale · week over week', sw, SCALE, (r, k) => r[k], (d) => d[2], (d) => d[3])}
    ${table('📏 Tape · week over week', tw, TAPE, (r, k) => r[k], () => 'in', () => 2)}
    ${!sw.length && !tw.length ? '<section class="rp-card"><p class="rp-muted">No check-ins yet.</p></section>' : ''}
    ${photoBlock()}
    ${tapeForm()}
    ${history()}`;
  fillCompare();
}

async function load() {
  const [s, t, p, n] = await Promise.all([
    supabase.from('body_scans').select('*').order('measured', { ascending: false }),
    supabase.from('body_measures').select('*').order('measured', { ascending: false }),
    supabase.from('progress_photos').select('taken,pose,path').order('taken', { ascending: false }),
    supabase.from('progress_notes').select('kind,noted,title,summary').eq('kind', 'checkin').order('noted', { ascending: false }),
  ]);
  scans = s.data || []; tapes = t.data || []; photos = p.data || []; notes = n.data || [];
  if (!photos.some((x) => x.pose === comparePose) && photos.length) comparePose = photos[0].pose;
  render();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pose]'); if (!b) return;
  comparePose = b.dataset.pose;
  document.querySelectorAll('[data-pose]').forEach((x) => x.classList.toggle('active', x === b));
  fillCompare();
});

document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'ci-tape') return;
  e.preventDefault();
  const f = new FormData(e.target), msg = document.getElementById('ci-tape-msg');
  const row = { user_id: uid, measured: f.get('measured'), updated_at: new Date().toISOString() };
  let n = 0;
  for (const [k, label] of TAPE) {
    const v = parseIn(f.get(k));
    if (Number.isNaN(v)) { msg.textContent = `Check ${label}`; return; }
    if (v != null) { row[k] = v; n++; }
  }
  if (!n) { msg.textContent = 'Enter at least one measurement'; return; }
  msg.textContent = 'Saving…';
  const { error } = await supabase.from('body_measures').upsert(row, { onConflict: 'user_id,measured' });
  if (error) { msg.textContent = 'Could not save — try again'; return; }
  await load();
});

document.addEventListener('change', async (e) => {
  const inp = e.target.closest('[data-upload]'); if (!inp || !inp.files || !inp.files[0]) return;
  const pose = inp.dataset.upload, msg = document.querySelector(`[data-msg="${pose}"]`);
  const taken = document.getElementById('ci-photo-date').value || iso(new Date());
  try {
    msg.textContent = 'Shrinking…';
    const blob = await compress(inp.files[0]);
    msg.textContent = 'Uploading…';
    const path = `${uid}/${taken}/${pose}.jpg`;
    const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (up.error) throw up.error;
    const { error } = await supabase.from('progress_photos').upsert({ user_id: uid, taken, pose, path }, { onConflict: 'user_id,taken,pose' });
    if (error) throw error;
    msg.textContent = '✅';
    const i = photos.findIndex((p) => p.taken === taken && p.pose === pose);
    if (i < 0) photos.unshift({ taken, pose, path });
    comparePose = pose;
    render();
    const d = document.querySelector('.ci-up'); if (d) d.open = true;
  } catch {
    msg.textContent = 'Failed — try again';
  }
});

(async () => {
  const host = document.getElementById('checkin-root'); if (!host) return;
  const session = await getSession().catch(() => null);
  if (!session) { host.innerHTML = '<section class="rp-card"><p class="rp-muted">Sign in to see your data.</p></section>'; return; }
  uid = session.user.id;
  await load();
})();
