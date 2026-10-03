// labs.js — the Labs page. Every result lives in Supabase (lab_results +
// lab_notes, readable only by the signed-in owner) — never in this file,
// because the app's static files are public. New reports: send the PDF to
// Claude, who adds the rows; this page then shows the latest value, where it
// sits in the reference range, the change since last time, and the history.
import { supabase, getSession } from './supabase-client.js';
import { GUIDE, NEXT_TIME } from './labs-guide.js';

const root = document.getElementById('labs-root');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const num = (v) => (v == null ? null : Number(v));
const PANELS = ['Blood count', 'Iron & B12', 'Blood sugar', 'Kidney & minerals', 'Liver', 'Cholesterol', 'Hormones & thyroid', 'Infection screening'];

// What each test is, in plain words (general info — no personal data here)
const INFO = {
  wbc: 'Infection-fighting cells. Low or high can mean illness or overtraining.',
  rbc: 'Red cells carry oxygen to your muscles.',
  hgb: 'The oxygen-carrying protein — key for endurance.',
  hct: 'Share of your blood that is red cells.',
  mcv: 'Size of red cells; small = possible iron lack, large = possible B12/folate lack.',
  mch: 'Hemoglobin per red cell.', mchc: 'Hemoglobin concentration in red cells.', rdw: 'How varied red cell sizes are.',
  plt: 'Clotting cells.', neut: 'Bacteria-fighting white cells.', lymph: 'Virus-fighting white cells.',
  mono: 'Clean-up white cells.', eos: 'Allergy / parasite white cells.', baso: 'Rare white cells.', ig: 'Young white cells — should be ~0.',
  b12: 'Needed for nerves and red blood cells.',
  ferritin: 'Iron stores. Athletes want > 50–100 for endurance work.',
  glucose: 'Blood sugar after fasting.', a1c: 'Average blood sugar over ~3 months.',
  na: 'Main electrolyte — hydration balance.', k: 'Electrolyte for muscle and heart function.',
  creat: 'Muscle waste product cleared by kidneys — runs higher with more muscle.', egfr: 'Kidney filtering estimate (from creatinine).',
  ca: 'Bones, muscle contraction.', alb: 'Main blood protein — nutrition and liver.',
  bili: 'Breakdown of old red cells, cleared by the liver.', alp: 'Liver / bone enzyme.', ggt: 'Liver enzyme — rises with alcohol.',
  alt: 'Liver enzyme; also leaks from muscle after hard training.', ast: 'Liver + muscle enzyme; rises for 2–3 days after hard workouts.',
  tc: 'All cholesterol.', ldl: 'Carries cholesterol into artery walls — lower is better long-term.',
  hdl: 'Takes cholesterol away — higher is better; exercise raises it.', ratio: 'Total ÷ HDL — lower is better.',
  nonhdl: 'All the "bad" cholesterol types together.', tg: 'Blood fats — sugar and alcohol raise them.',
  tsh: 'Thyroid control hormone — energy and metabolism.',
  testo: 'Main male hormone — recovery, muscle, mood. Highest early morning; sleep loss and calorie cuts lower it.',
  hpylori: 'Stomach bacteria that can cause ulcers.',
  hbsab: 'Hepatitis B immunity (≥ 10 = protected).', hbsag: 'Active hepatitis B infection.', hbcab: 'Past or current hepatitis B infection.',
};

function status(r) {
  const v = num(r.value), lo = num(r.ref_low), hi = num(r.ref_high);
  if (v == null) return /negative|non-reactive/i.test(r.value_text || '') ? ['ok', 'Normal'] : ['info', '—'];
  if (lo != null && v < lo) return ['low', 'Low'];
  if (hi != null && v > hi) return ['high', 'High'];
  // within 5% of a limit → worth a look next time
  const span = lo != null && hi != null ? hi - lo : Math.abs((hi ?? lo) || 1);
  if ((hi != null && hi - v <= span * 0.05) || (lo != null && v - lo <= span * 0.05)) return ['near', 'Near limit'];
  return ['ok', 'Normal'];
}
function rangeBar(r) {
  const v = num(r.value), lo = num(r.ref_low), hi = num(r.ref_high);
  if (v == null || (lo == null && hi == null)) return '';
  const a = lo != null ? lo : 0, b = hi != null ? hi : lo * 2.2;
  const min = Math.min(a, v) - (b - a) * 0.15, max = Math.max(b, v) + (b - a) * 0.15;
  const pct = (x) => ((x - min) / (max - min)) * 100;
  return `<div class="lab-bar"><span class="lab-band" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"></span><span class="lab-dot" style="left:${pct(v)}%"></span></div>`;
}
const refText = (r) => r.ref_text || (r.ref_low != null && r.ref_high != null ? `${r.ref_low}–${r.ref_high}` : r.ref_high != null ? `< ${r.ref_high}` : r.ref_low != null ? `> ${r.ref_low}` : '');
const valText = (r) => (r.value != null ? `${Number(r.value)}${r.unit ? ' ' + r.unit : ''}` : r.value_text || '—');

// ---- reference guide: every marker, goal range, your latest value, how to move it ----
function goalStatus(m, r) {
  if (m.nolab) return ['info', 'Track yourself'];
  if (!r || r.value == null) return ['none', 'Not tested yet'];
  const v = Number(r.value), [lo, hi] = m.goal;
  if (lo != null && v < lo) return ['near', 'Below goal'];
  if (hi != null && v > hi) return ['near', 'Above goal'];
  return ['ok', 'In goal'];
}
function guideHTML(byKey) {
  const groups = [...new Set(GUIDE.map((m) => m.group))];
  const next = NEXT_TIME.map((k) => GUIDE.find((m) => m.key === k)).filter((m) => !byKey[m.key]).map((m) => m.name);
  return `<section class="rp-card lab-guide" id="guide">
    <h2>📋 Marker guide</h2>
    <p class="rp-muted">Every marker worth knowing for an active man in his 30s training hard — what it means, the lab’s normal range, the goal range to aim for, your latest result, and how to move it. Tap a group.</p>
    ${next.length ? `<p class="lab-next">Ask for next time: <b>${next.map(esc).join(' · ')}</b></p>` : ''}
    ${groups.map((g) => {
      const ms = GUIDE.filter((m) => m.group === g);
      const st = ms.map((m) => goalStatus(m, byKey[m.key] && byKey[m.key][0])[0]);
      const cnt = (c) => st.filter((x) => x === c).length;
      return `<details class="lab-g">
        <summary><b>${esc(g)}</b><span>${[cnt('ok') && `${cnt('ok')} in goal`, cnt('near') && `${cnt('near')} to improve`, cnt('none') && `${cnt('none')} not tested`, cnt('info') && `${cnt('info')} to track yourself`].filter(Boolean).join(' · ')}</span></summary>
        ${ms.map((m) => {
          const r = byKey[m.key] && byKey[m.key][0]; const [cls, lbl] = goalStatus(m, r);
          return `<div class="lab-gm">
            <div class="lab-top"><span class="lab-name">${esc(m.name)}${m.optional ? ' <small>(optional)</small>' : ''}</span>${r && r.value != null ? `<span class="lab-val">${esc(Number(r.value))} ${esc(m.unit)}</span>` : ''}<span class="lab-chip lab-${cls}">${lbl}</span></div>
            <div class="lab-ranges"><span>Lab normal <b>${esc(m.lab)}</b></span><span>Goal <b>${esc(m.goalTxt)}</b></span><span>${esc(m.unit)}</span></div>
            <div class="lab-info">${esc(m.what)}</div>
            ${m.up && m.up !== '—' ? `<div class="lab-how"><b>▲ To raise:</b> ${esc(m.up)}</div>` : ''}
            ${m.down && m.down !== '—' ? `<div class="lab-how"><b>▼ To lower:</b> ${esc(m.down)}</div>` : ''}
          </div>`;
        }).join('')}
      </details>`;
    }).join('')}
    <p class="rp-muted lab-foot">Goal ranges are practical targets for health and training, not diagnoses — a result just outside a goal is a nudge, not a problem.</p>
  </section>`;
}

function render(rows, notes) {
  const byKey = {};
  rows.forEach((r) => (byKey[r.test_key] = byKey[r.test_key] || []).push(r));
  Object.values(byKey).forEach((a) => a.sort((x, y) => y.collected.localeCompare(x.collected)));
  if (!rows.length) { root.innerHTML = guideHTML(byKey) + '<section class="rp-card"><p class="rp-muted">No lab results yet. Send a lab PDF to Claude and it will appear here.</p></section>'; return; }
  const dates = [...new Set(rows.map((r) => r.collected))].sort().reverse();
  const latestNote = notes.find((n) => n.collected === dates[0]);

  // biggest moves between the last two results of the same test
  const changes = Object.values(byKey).filter((a) => a.length > 1 && a[0].value != null && a[1].value != null)
    .map((a) => { const now = Number(a[0].value), before = Number(a[1].value); return { r: a[0], before, now, pct: before ? ((now - before) / before) * 100 : 0, from: a[1].collected }; })
    .filter((c) => Math.abs(c.pct) >= 5).sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct));

  const panelHTML = (p) => {
    const keys = Object.keys(byKey).filter((k) => byKey[k][0].panel === p);
    if (!keys.length) return '';
    const flagged = keys.filter((k) => ['low', 'high', 'near'].includes(status(byKey[k][0])[0])).length;
    return `<details class="rp-card lab-panel" ${p === 'Infection screening' ? '' : 'open'}>
      <summary><b>${esc(p)}</b><span>${keys.length} test${keys.length === 1 ? '' : 's'}${flagged ? ` · ${flagged} to watch` : ' · all normal'}</span></summary>
      ${keys.map((k) => {
        const a = byKey[k], r = a[0]; const [cls, lbl] = status(r);
        const prev = a[1];
        const delta = prev && r.value != null && prev.value != null ? Number(r.value) - Number(prev.value) : null;
        return `<div class="lab-row">
          <div class="lab-top"><span class="lab-name">${esc(r.test)}</span><span class="lab-val">${esc(valText(r))}</span><span class="lab-chip lab-${cls}">${lbl}</span></div>
          ${rangeBar(r)}
          <div class="lab-meta">${refText(r) ? `Range ${esc(refText(r))}` : ''}${delta != null && delta !== 0 ? ` · ${delta > 0 ? '▲' : '▼'} ${esc(Math.abs(Math.round(delta * 100) / 100))} since ${esc(fmtDate(prev.collected))}` : prev && delta === 0 ? ` · same as ${esc(fmtDate(prev.collected))}` : ''}${r.note ? ` · ${esc(r.note)}` : ''}</div>
          ${INFO[k] ? `<div class="lab-info">${esc(INFO[k])}</div>` : ''}
          ${a.length > 1 ? `<div class="lab-hist">${a.map((x) => `<span>${esc(fmtDate(x.collected))}: <b>${esc(valText(x))}</b></span>`).join('')}</div>` : ''}
        </div>`;
      }).join('')}
    </details>`;
  };

  root.innerHTML = guideHTML(byKey) + `
    ${latestNote ? `<section class="rp-card lab-summary">
      <div class="rp-eyebrow">Latest · ${esc(fmtDate(latestNote.collected))}</div>
      <h2>${esc(latestNote.title || 'Latest report')}</h2>
      <div class="lab-text">${esc(latestNote.summary)}</div>
    </section>` : ''}
    ${changes.length ? `<section class="rp-card"><h2>Changes since last test</h2>
      ${changes.map((c) => `<div class="lab-change"><span>${esc(c.r.test)}</span><b>${esc(c.before)} → ${esc(c.now)} ${esc(c.r.unit || '')}</b><span class="lab-chip ${c.pct < 0 ? 'lab-near' : 'lab-ok'}">${c.pct > 0 ? '+' : ''}${Math.round(c.pct)}%</span></div>`).join('')}
    </section>` : ''}
    ${PANELS.map(panelHTML).join('')}
    <details class="rp-card"><summary><b>All reports (${dates.length})</b></summary>
      ${dates.map((d) => { const n = notes.find((x) => x.collected === d); const lab = rows.find((r) => r.collected === d).lab; return `<div class="lab-report"><b>${esc(fmtDate(d))}</b> · <span class="rp-muted">${esc(lab || '')}</span>${n ? `<div class="lab-text">${esc(n.title ? n.title + ' — ' : '')}${esc(n.summary)}</div>` : ''}</div>`; }).join('')}
    </details>
    <details class="rp-card"><summary><b>Before your next blood test</b></summary>
      <ul class="rp-rules">
        <li><b>7–9 AM</b>, after 10–12 h fasting (water is fine) — testosterone is highest early and drops through the morning.</li>
        <li><b>No hard training for 48 h</b> before (it raises AST/ALT and CK), a normal night’s sleep, no alcohol for 48 h, skip biotin/hair-skin vitamins for 2 days.</li>
        <li>Same lab and same time of day each time, so changes are real.</li>
        <li>Ask for: total testosterone <b>+ SHBG + free testosterone</b>, 25-OH vitamin D, ApoB, lipids, CBC, ferritin, liver. If testosterone comes back low twice: LH, FSH and prolactin.</li>
        <li><b>Once in your life: Lp(a)</b> — an inherited cholesterol particle that diet and exercise don’t change; Canadian guidelines recommend measuring it once.</li>
        <li>Liver enzymes up after training? Add <b>CK</b> (muscle enzyme): high CK + high AST with normal GGT = muscle from training, not liver.</li>
        <li>Doctor won’t order it? In BC you can buy it yourself at LifeLabs — the Hormone Health panel (total, free, bioavailable testosterone + SHBG) and a vitamin D test, no requisition needed.</li>
      </ul>
    </details>
    <p class="rp-muted lab-foot">General information to understand your results — not medical advice. Your doctor has the full picture. New report? Send the PDF to Claude: it's stored privately in your account, not in the app.</p>`;
}

(async () => {
  const session = await getSession().catch(() => null);
  if (!session) { root.innerHTML = '<section class="rp-card"><p class="rp-muted">Sign in to see your lab results.</p></section>'; return; }
  const [r, n] = await Promise.all([
    supabase.from('lab_results').select('collected,lab,panel,test_key,test,value,value_text,unit,ref_low,ref_high,ref_text,note').order('collected', { ascending: false }),
    supabase.from('lab_notes').select('collected,title,summary').order('collected', { ascending: false }),
  ]);
  if (r.error || n.error) { root.innerHTML = `<section class="rp-card"><p class="rp-muted">Couldn’t load results: ${esc((r.error || n.error).message)}</p></section>`; return; }
  render(r.data || [], n.data || []);
})();
