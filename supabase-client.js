import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

export const AUTH_STORAGE_KEY = 'rtc_supabase_auth_v1';

// Gateway / "project paused" codes. Supabase answers 540 while a free project
// is paused, and 5xx/52x while it is waking up. supabase-js only treats
// 502/503/504 as "network trouble" — anything else that fails a token refresh
// makes it DELETE the saved session and fire SIGNED_OUT. Turning these into a
// network error (TypeError) makes auth-js retry later and keep the session, so
// a sleeping server no longer logs you out.
// (A plain 500 is left alone so real server errors still show their message.)
const SERVER_DOWN = new Set([502, 503, 504, 520, 521, 522, 523, 524, 530, 540, 544, 546]);

async function guardedFetch(input, init = {}) {
  const url = String((input && input.url) || input);
  // With no usable session supabase-js sends data requests as the anonymous
  // role, which RLS answers with empty lists — sync would read that as
  // "everything was deleted". Never send those.
  if (url.includes('/rest/v1/')) {
    const auth = new Headers(init.headers || (input && input.headers) || {}).get('Authorization');
    if (!auth || auth === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`) {
      throw new TypeError('No signed-in session; data request skipped');
    }
  }
  const res = await fetch(input, init);
  if (SERVER_DOWN.has(res.status)) {
    const e = new TypeError(`Server unavailable (HTTP ${res.status})`);
    e.status = res.status;
    throw e;
  }
  return res;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: guardedFetch },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    storageKey: AUTH_STORAGE_KEY,
  },
});

// A login is saved on this device (it may still need refreshing).
export function hasStoredSession() {
  try { return !!JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || 'null')?.refresh_token; }
  catch { return false; }
}

// The error means "couldn't reach the server", not "you're signed out".
export function isUnreachable(err) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (!err) return false;
  return err.name === 'AuthRetryableFetchError' || err instanceof TypeError
    || err.status === 0 || err.status >= 500
    || /failed to fetch|load failed|networkerror|server unavailable|no signed-in session/i.test(String(err.message || ''));
}

// { session, unreachable } — unreachable = a login is saved on this phone but
// the server can't be reached right now (offline, paused, waking up).
// timeoutMs: give up waiting (the library retries for up to ~50 s when the
// server doesn't answer) and report "unreachable" if a login is saved.
export async function getSessionState({ timeoutMs = 0 } = {}) {
  if (timeoutMs) {
    let t;
    const timeout = new Promise((res) => { t = setTimeout(() => res({ session: null, unreachable: hasStoredSession() }), timeoutMs); });
    try { return await Promise.race([getSessionState(), timeout]); } finally { clearTimeout(t); }
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (data && data.session) return { session: data.session, unreachable: false };
    return { session: null, unreachable: hasStoredSession() && (isUnreachable(error) || (typeof navigator !== 'undefined' && navigator.onLine === false)) };
  } catch {
    return { session: null, unreachable: hasStoredSession() };
  }
}

// Card shown by data pages when the server can't be reached.
export function serverDownHTML() {
  return '<section class="rp-card"><p class="rp-muted">Can\u2019t reach the server right now (no signal, or it\u2019s waking up after a quiet spell). Your data is safe. <button type="button" class="race-preset-btn" onclick="location.reload()">Try again</button></p><p class="rp-muted">This page refreshes by itself once the connection is back.</p></section>';
}
// Run fn once the login is confirmed (auth-gate fires it), or the phone comes
// back online, or the app returns to the screen — whichever happens first.
export function onReconnect(fn) {
  let done = false;
  const go = () => { if (done) return; done = true; fn(); };
  window.addEventListener('rtc-auth-ready', go, { once: true });
  window.addEventListener('online', go, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') go(); });
}
// What a data page shows when a query fails: the outage card (and reload when
// back) for connection problems, the real message for anything else.
export function loadErrorHTML(err) {
  if (isUnreachable(err)) { onReconnect(() => location.reload()); return serverDownHTML(); }
  const msg = String(err?.message || err || 'Unknown error').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<section class="rp-card"><p class="rp-muted">Couldn\u2019t load this: ${msg}</p></section>`;
}

export async function getSession() {
  return (await getSessionState()).session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}
