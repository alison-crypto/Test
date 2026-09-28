// health-ingest — receives Apple Health data and stores it for the app.
//
// Two senders are supported:
//   1. Health Auto Export (iOS app) REST API automation — its standard JSON:
//      { data: { metrics: [{ name, units, data: [...] }], workouts: [...] } }
//   2. The free iPhone Shortcut — { sleep, hrv, rhr } as raw sample lists
//      (or already-summed { date, sleep_h, rhr, hrv })
//   3. The free workout Shortcut — { session, hr, dist, kcal } for one
//      training session window chosen in the app
//
// Auth: the personal sync key created on the Race Plan page, sent as
// "Authorization: Bearer <key>" (or an "x-health-key" header). Only its
// SHA-256 hash is stored, so the key itself never sits in the database.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MAX_BYTES = 8 * 1024 * 1024;
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'object') return num((v as Record<string, unknown>).qty ?? (v as Record<string, unknown>).avg ?? (v as Record<string, unknown>).Avg);
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function pick(o: Record<string, unknown>, keys: string[]) { for (const k of keys) { const n = num(o[k]); if (n != null) return n; } return null; }
// "2026-10-13 06:12:00 -0700" / ISO → local calendar date "2026-10-13"
function dateOnly(v: unknown) { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v ?? '')); return m ? m[1] : null; }
// "2026-10-13 06:12:00 -0700" → ISO timestamp Postgres accepts
function ts(v: unknown) {
  const s = String(v ?? '').trim(); if (!s) return null;
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*([+-]\d{2}):?(\d{2})$/.exec(s);
  if (m) return `${m[1]}T${m[2].length === 5 ? m[2] + ':00' : m[2]}${m[3]}:${m[4]}`;
  const d = new Date(s); return isNaN(d.getTime()) ? null : d.toISOString();
}
// Every number in a value or a Shortcuts list ("55 count/min\n57 count/min")
function numbers(v: unknown): number[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.flatMap(numbers);
  if (typeof v === 'number') return Number.isFinite(v) ? [v] : [];
  return String(v).split(/[\n,;]+/).map((x) => parseFloat(x.replace(/[^0-9.\-]/g, ' ').trim().split(/\s+/)[0])).filter((n) => Number.isFinite(n));
}
// Sum a list of sleep-sample durations → hours. Accepts "1 hr 23 min",
// "45 min", "1:23:45", "3120 sec", or bare numbers (unit guessed from the total).
function sumHours(v: unknown): number | null {
  if (v == null) return null;
  const items = Array.isArray(v) ? v.map(String) : String(v).split(/\n+/);
  let secs = 0, bare = 0, any = false;
  for (const raw of items) {
    const t = raw.trim().toLowerCase(); if (!t) continue;
    const hms = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(t);
    if (hms) { secs += hms[3] != null ? +hms[1] * 3600 + +hms[2] * 60 + +hms[3] : +hms[1] * 3600 + +hms[2] * 60; any = true; continue; }
    const parts = [...t.matchAll(/([\d.]+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)\b/g)];
    if (parts.length) { for (const [, n, u] of parts) secs += +n * (u.startsWith('h') ? 3600 : u.startsWith('m') ? 60 : 1); any = true; continue; }
    const n = parseFloat(t); if (Number.isFinite(n)) { bare += n; any = true; }
  }
  if (bare) secs += bare > 2000 ? bare : bare > 30 ? bare * 60 : bare * 3600;
  return any && secs > 0 ? secs / 3600 : null;
}
// Sum distance samples ("0.02 km", "12 m", "0.01 mi") → km
function distanceKm(v: unknown): number | null {
  if (v == null) return null;
  const items = Array.isArray(v) ? v.map(String) : String(v).split(/\n+/);
  let km = 0;
  for (const raw of items) {
    const m = /([\d.]+)\s*([a-z]*)/i.exec(raw.trim()); if (!m) continue;
    const n = +m[1], u = m[2].toLowerCase();
    km += u.startsWith('mi') ? n * 1.609344 : u === 'm' ? n / 1000 : u === 'ft' ? n * 0.0003048 : u === 'yd' ? n * 0.0009144 : n;
  }
  return km || null;
}
// Sum energy samples ("0.8 kcal", "3 kJ", "0.5 Cal") → kcal
function energyKcal(v: unknown): number | null {
  if (v == null) return null;
  const items = Array.isArray(v) ? v.map(String) : String(v).split(/\n+/);
  let k = 0;
  for (const raw of items) { const m = /([\d.]+)\s*([a-z]*)/i.exec(raw.trim()); if (m) k += /^kj$/i.test(m[2]) ? +m[1] / 4.184 : +m[1]; }
  return k || null;
}
function vancouverToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(new Date()); }
const round = (n: number | null, p = 1) => (n == null ? null : Math.round(n * 10 ** p) / 10 ** p);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const auth = req.headers.get('authorization') || '';
  const key = (auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : req.headers.get('x-health-key') || '').trim();
  if (key.length < 20) return json({ error: 'missing sync key' }, 401);
  const { data: tok } = await db.from('health_tokens').select('user_id').eq('token_hash', await sha256(key)).maybeSingle();
  if (!tok) return json({ error: 'unknown sync key' }, 401);
  const userId = tok.user_id as string;

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return json({ error: 'payload too large — export fewer metrics (sleep, resting HR, HRV, workouts)' }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json({ error: 'invalid JSON' }, 400); }

  const daily = new Map<string, Record<string, unknown>>();
  const day = (d: string) => { if (!daily.has(d)) daily.set(d, {}); return daily.get(d)!; };
  const workouts: Record<string, unknown>[] = [];

  // (2) iPhone Shortcut payload. The Shortcut stays dumb: it sends the raw
  // Health sample lists (Shortcuts turns a list into newline-separated text)
  // and the adding-up happens here.
  if (!body.session && (body.sleep != null || body.sleep_h != null || body.rhr != null || body.hrv != null)) {
    const d = dateOnly(body.date) || vancouverToday();
    const r = day(d);
    const sleepH = body.sleep_h != null ? num(body.sleep_h) : sumHours(body.sleep);
    const hrvs = numbers(body.hrv); const rhrs = numbers(body.rhr);
    if (sleepH) r.sleep_h = round(sleepH, 2);
    if (hrvs.length) r.hrv = round(hrvs.reduce((a, b) => a + b, 0) / hrvs.length);
    if (rhrs.length) r.rhr = round(rhrs[0]);
    r.source = 'Shortcut';
  }

  // (3) Workout Shortcut, launched from the app with "localStart|localEnd|name|isoStart|isoEnd".
  // It sends back that text as `session` plus the raw Heart Rate, Walking +
  // Running Distance and Active Energy samples from inside the window.
  if (typeof body.session === 'string' && body.session.includes('|')) {
    const [, , name, isoStart, isoEnd] = body.session.split('|').map((x) => x.trim());
    const start = ts(isoStart), end = ts(isoEnd);
    if (start) {
      const hr = numbers(body.hr).filter((n) => n > 30 && n < 230);
      const km = distanceKm(body.dist);
      const kcal = energyKcal(body.kcal);
      workouts.push({
        user_id: userId, id: await sha256(`${name || 'Workout'}|${start}`), name: name || 'Workout', start_ts: start, end_ts: end,
        duration_s: end ? Math.round((Date.parse(end) - Date.parse(start)) / 1000) : null,
        distance_km: km ? round(km, 3) : null,
        avg_hr: hr.length ? round(hr.reduce((a, b) => a + b, 0) / hr.length) : null,
        max_hr: hr.length ? Math.max(...hr) : null,
        energy_kcal: kcal ? round(kcal, 0) : null,
        source: 'Shortcut', updated_at: new Date().toISOString(),
      });
    }
  }

  // (1) Health Auto Export payload
  const data = (body.data || {}) as Record<string, unknown>;
  for (const m of (data.metrics as Record<string, unknown>[] | undefined) || []) {
    const name = String(m.name || '');
    for (const p of (m.data as Record<string, unknown>[] | undefined) || []) {
      if (name === 'resting_heart_rate') { const d = dateOnly(p.date); const v = pick(p, ['qty', 'Avg']); if (d && v != null) day(d).rhr = round(v); }
      else if (name === 'heart_rate_variability') {
        // several readings a day → keep the average
        const d = dateOnly(p.date); const v = pick(p, ['qty', 'Avg']);
        if (d && v != null) { const r = day(d); const acc = (r._hrv as number[]) || []; acc.push(v); r._hrv = acc; }
      } else if (name === 'sleep_analysis') {
        // file the night under the morning you woke up
        const end = p.sleepEnd || p.inBedEnd || p.endDate;
        const d = dateOnly(end) || dateOnly(p.date);
        let h = pick(p, ['totalSleep', 'asleep']);
        if (!h) { const parts = ['core', 'deep', 'rem'].map((k) => num(p[k]) || 0); h = parts.reduce((a, b) => a + b, 0) || null; }
        if (d && h) {
          const r = day(d);
          r.sleep_h = round(((r.sleep_h as number) || 0) + h, 2);   // naps / split nights add up
          r.sleep_start = r.sleep_start || ts(p.sleepStart || p.inBedStart || p.startDate);
          r.sleep_end = ts(end) || r.sleep_end;
        }
      }
    }
  }
  for (const r of daily.values()) {
    if (r._hrv) { const a = r._hrv as number[]; r.hrv = round(a.reduce((x, y) => x + y, 0) / a.length); delete r._hrv; }
    if (!r.source) r.source = 'Health Auto Export';
  }

  for (const w of (data.workouts as Record<string, unknown>[] | undefined) || []) {
    const start = ts(w.start || w.startDate); if (!start) continue;
    const name = String(w.name || w.workoutType || 'Workout');
    const dist = w.distance as Record<string, unknown> | number | undefined;
    let km = num(dist);
    const units = typeof dist === 'object' && dist ? String(dist.units || '') : '';
    if (km != null && /mi/.test(units)) km *= 1.609344;
    if (km != null && /^m$/.test(units)) km /= 1000;
    const hr = (w.heartRate || {}) as Record<string, unknown>;
    let dur = num(w.duration);
    const end = ts(w.end || w.endDate);
    if (dur == null && end) dur = (Date.parse(end) - Date.parse(start)) / 1000;
    workouts.push({
      user_id: userId, id: await sha256(`${name}|${start}`), name, start_ts: start, end_ts: end,
      duration_s: round(dur, 0), distance_km: round(km, 3),
      avg_hr: round(num(hr.avg) ?? pick(w, ['avgHeartRate', 'heartRateAvg'])),
      max_hr: round(num(hr.max) ?? pick(w, ['maxHeartRate', 'heartRateMax'])),
      energy_kcal: round(pick(w, ['activeEnergyBurned', 'activeEnergy', 'totalEnergyBurned']), 0),
      source: 'Apple Watch', updated_at: new Date().toISOString(),
    });
  }

  // Upsert day by day with only the fields present, so a sleep-only export
  // never blanks out the resting HR that arrived earlier.
  let days = 0;
  for (const [date, r] of daily) {
    const row = { user_id: userId, date, ...r, updated_at: new Date().toISOString() };
    const { error } = await db.from('health_daily').upsert(row, { onConflict: 'user_id,date' });
    if (error) return json({ error: error.message }, 500);
    days++;
  }
  if (workouts.length) {
    const { error } = await db.from('health_workouts').upsert(workouts, { onConflict: 'user_id,id' });
    if (error) return json({ error: error.message }, 500);
  }
  await db.from('health_tokens').update({ last_used_at: new Date().toISOString() }).eq('user_id', userId);
  return json({ ok: true, days, workouts: workouts.length });
});
