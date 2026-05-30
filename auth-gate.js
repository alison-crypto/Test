import { supabase, getSession } from './supabase-client.js';
import { initSync } from './sync.js';

const AUTH_PAGE = 'auth.html';

function currentPageIsAuth() {
  return location.pathname.endsWith('/' + AUTH_PAGE) || location.pathname.endsWith(AUTH_PAGE);
}

function redirectToAuth() {
  const ret = encodeURIComponent(location.pathname + location.search);
  location.replace(`${AUTH_PAGE}?return=${ret}`);
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
    await supabase.auth.signOut();
    location.replace(AUTH_PAGE);
  });
  document.body.appendChild(pill);
}

(async () => {
  const session = await getSession();
  if (!session) {
    if (!currentPageIsAuth()) redirectToAuth();
    return;
  }
  window.RTC_AUTH = { user: session.user, supabase };
  if (document.body) mountSignOutButton(session.user.email);
  else document.addEventListener('DOMContentLoaded', () => mountSignOutButton(session.user.email));

  // Kick off sync in the background so page rendering isn't blocked.
  // The first pull will land slightly after the page renders; pages re-read
  // localStorage on user interaction, so newer data will surface naturally.
  initSync(session.user.id).catch((e) => console.warn('[sync] init failed', e?.message || e));

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && !currentPageIsAuth()) location.replace(AUTH_PAGE);
  });
})();
