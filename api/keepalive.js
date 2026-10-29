// Keeps the free-plan Supabase project from being auto-paused for inactivity.
//
// Vercel Cron calls GET /api/keepalive on the schedule in vercel.json. Each run
// makes a couple of tiny read-only queries through the Supabase REST API with
// the PUBLIC publishable key (the same one already shipped in
// supabase-config.js). Every table has owner-only Row Level Security, so an
// anonymous caller gets back an empty list: nothing is exposed and nothing is
// written. The point is only that Postgres runs a real query.
//
// CommonJS on purpose: this repo has no package.json, so .js here is CommonJS.
// Uses Node's built-in fetch (Node 18+; the project is on Node 24.x).

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://czckvzaidrewpsgesrqh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_nZCUXNo2ULdrdZV72wzoNA_X0Z5228m';

// Real tables from supabase/schema.sql. RLS returns [] to an anonymous caller.
const TABLES = ['kv_sync', 'recipe_book'];

async function ping(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=updated_at&limit=1`;
  try {
    const r = await fetch(url, {
      // New sb_publishable_ keys go on the apikey header ONLY. Sending them as
      // "Authorization: Bearer" makes Supabase reject the call as an invalid JWT.
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    return { table, status: r.status };
  } catch (err) {
    return { table, status: 0, error: String((err && err.message) || err) };
  }
}

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  // When CRON_SECRET is set in the Vercel project, Vercel Cron sends
  // "Authorization: Bearer <CRON_SECRET>"; anyone else gets 401.
  // Until it is set, the endpoint stays open (it only does a harmless read).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return send(res, 401, { ok: false, error: 'unauthorized' });
  }

  const checks = [];
  for (const table of TABLES) checks.push(await ping(table));

  // 200 = the query ran. 540 = project is paused (restore it in the dashboard).
  // 401/403 = Postgres refused the anon role. 0/5xx = unreachable.
  const ok = checks.every((c) => c.status >= 200 && c.status < 300);
  const paused = checks.some((c) => c.status === 540);
  console.log('[keepalive]', JSON.stringify({ ok, paused, checks }));

  return send(res, ok ? 200 : 502, { ok, paused, checks, at: new Date().toISOString() });
};
