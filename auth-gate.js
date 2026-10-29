import { supabase, getSessionState, hasStoredSession, AUTH_STORAGE_KEY } from './supabase-client.js';
import { initSync } from './sync.js';

const AUTH_PAGE = 'auth.html';

function currentPageIsAuth() {
  return location.pathname.endsWith('/' + AUTH_PAGE) || location.pathname.endsWith(AUTH_PAGE);
}

function redirectToAuth() {
  const ret = encodeURIComponent(location.pathname + location.search);
  location.replace(`${AUTH_PAGE}?return=${ret}`);
}

function onBody(fn) {
  if (document.body) fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

function mountSignOutButton(email) {
  if (document.getElementById('rtc-auth-pill')) return;
  const pill = document.createElement('button');
  pill.id = 'rtc-auth-pill';
  pill.type = 'button';
  pill.className = 'rtc-auth-pill';
  pill.title = email || 'Signed in';
  pill.textContent = 'Sign out';
  pill.addEventListener('click', async () => {
    if (!confirm('Sign out of this device?')) return;
    // Local sign-out must not wait on the server (it can hang for minutes
    // during an outage): give the library 3 s, then clear the login ourselves.
    const r = await Promise.race([
      supabase.auth.signOut({ scope: 'local' }).catch((e) => ({ error: e })),
      new Promise((res) => setTimeout(() => res({ error: 'timeout' }), 3000)),
    ]);
    if (r && r.error) {
      try { localStorage.removeItem(AUTH_STORAGE_KEY); localStorage.removeItem(AUTH_STORAGE_KEY + '-code-verifier'); } catch {}
    }
    location.replace(AUTH_PAGE);
  });
  document.body.appendChild(pill);
}

// Shown instead of kicking you to the sign-in page when the server can't be
// reached (no signal, or the free Supabase project is paused / waking up).
function showBanner(text) {
  onBody(() => {
    let b = document.getElementById('rtc-offline-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'rtc-offline-banner';
      b.className = 'rtc-offline-banner';
      b.setAttribute('role', 'status');
      document.body.prepend(b);
    }
    b.textContent = text;
  });
}
function hideBanner() {
  const b = document.getElementById('rtc-offline-banner');
  if (b) b.remove();
}
const OFFLINE_TEXT = "Can't reach the sync server right now — no signal, or it's waking up. Keep using the app: changes are saved on this phone and sync when it's back.";

let started = false;
function start(session) {
  if (started) return;
  started = true;
  hideBanner();
  // Pages that showed "can't reach the server" reload on this.
  try { window.dispatchEvent(new CustomEvent('rtc-auth-ready')); } catch {}
  window.RTC_AUTH = { user: session.user, supabase };
  onBody(() => mountSignOutButton(session.user.email));
  // Ask the browser not to evict this app's storage (photos only live here).
  try { navigator.storage?.persist?.(); } catch {}

  // Kick off sync in the background so page rendering isn't blocked.
  initSync(session.user.id).catch((e) => console.warn('[sync] init failed', e?.message || e));

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && !currentPageIsAuth()) redirectToAuth();
  });
}

let retryTimer = null;
let checking = false;
async function check() {
  if (checking || started) return;
  checking = true;
  try { await checkOnce(); } finally { checking = false; }
}
async function checkOnce() {
  // The login library quietly retries for up to ~50 s when the server doesn't
  // answer — say what's going on instead of showing nothing.
  const slow = (!started && hasStoredSession())
    ? setTimeout(() => { if (!started) showBanner('Reconnecting to the sync server… you can keep using the app.'); }, 5000)
    : null;
  let state;
  try { state = await getSessionState(); } finally { clearTimeout(slow); }
  const { session, unreachable } = state;
  if (session) {
    clearInterval(retryTimer);
    retryTimer = null;
    window.removeEventListener('online', check);
    hideBanner();
    start(session);
    return;
  }
  if (unreachable) {
    // Still signed in on this phone — stay on the page and keep trying.
    showBanner(OFFLINE_TEXT);
    if (!retryTimer) {
      retryTimer = setInterval(check, 60000);
      window.addEventListener('online', check);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    }
    return;
  }
  if (!currentPageIsAuth()) redirectToAuth();
}

window.addEventListener('rtc-sync-owner-mismatch', () => {
  showBanner('Sync is paused on this phone: its saved data belongs to a different account. Sign out and sign in with your usual email.');
});

check();
