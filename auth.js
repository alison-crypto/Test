import { supabase, getSessionState, isUnreachable } from './supabase-client.js';

window.RTC_AUTH_READY = true;
// Clear the "couldn't load" note if this code arrived late on a slow connection.
{ const m = document.getElementById('auth-message'); if (m && m.dataset.kind === 'err') { m.textContent = ''; m.dataset.kind = ''; } }

const form = document.getElementById('auth-form');
const messageEl = document.getElementById('auth-message');
const submitBtn = document.getElementById('auth-submit');
const toggleBtn = document.getElementById('auth-toggle');
const forgotBtn = document.getElementById('auth-forgot');
const passwordField = document.getElementById('auth-password-field');
const passwordInput = form.elements.password;

// 'signin' | 'signup' | 'reset'
let mode = 'signin';

function getReturnUrl() {
  const params = new URLSearchParams(location.search);
  const ret = params.get('return');
  if (!ret) return 'index.html';
  try {
    // Same-site only: resolve it the way the browser will, then compare origins
    // (catches '//evil', '/\\evil' and tab/newline tricks like '/%09/evil').
    const u = new URL(decodeURIComponent(ret), location.href);
    if (u.origin === location.origin) return u.pathname + u.search + u.hash;
  } catch {}
  return 'index.html';
}

// Plain-English errors instead of "Load failed" / "Failed to fetch" / "{}".
function friendlyError(err) {
  if (navigator.onLine === false) return "You're offline. Connect to Wi-Fi or mobile data and try again.";
  if (isUnreachable(err)) return "The sign-in server isn't responding — it may be waking up after a quiet spell, which takes a minute or two. Wait a moment and tap Sign in again. Your data on this phone is safe.";
  if (err?.code === 'invalid_credentials' || /invalid login credentials/i.test(err?.message || '')) return 'Wrong email or password.';
  return err?.message || 'Something went wrong. Try again.';
}

function setMessage(text, kind) {
  messageEl.textContent = text || '';
  messageEl.dataset.kind = kind || '';
}

function setMode(next) {
  mode = next;
  const isReset = mode === 'reset';

  // In reset mode the password field is hidden — disable it so its `required`
  // attribute doesn't block the (email-only) form submission.
  passwordField.hidden = isReset;
  passwordInput.disabled = isReset;
  passwordInput.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';

  submitBtn.textContent = isReset ? 'Send reset link'
    : mode === 'signin' ? 'Sign in' : 'Create account';

  toggleBtn.textContent = isReset ? '‹ Back to sign in'
    : mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account';

  forgotBtn.hidden = mode !== 'signin';

  setMessage(isReset ? "Enter your account email and we'll send you a reset link." : '');
}

toggleBtn.addEventListener('click', () => {
  if (mode === 'reset') setMode('signin');
  else setMode(mode === 'signin' ? 'signup' : 'signin');
});

forgotBtn.addEventListener('click', () => setMode('reset'));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.elements.email.value.trim();
  if (!email) return;

  submitBtn.disabled = true;

  try {
    if (mode === 'reset') {
      setMessage('Sending…');
      const redirectTo = new URL('reset.html', location.href).href;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      // Deliberately generic so we don't reveal whether an account exists.
      setMessage('If an account exists for that email, a reset link is on its way. Check your inbox (and spam).', 'ok');
      return;
    }

    const password = form.elements.password.value;
    if (!password) return;
    setMessage('Working…');

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      location.replace(getReturnUrl());
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        location.replace(getReturnUrl());
      } else {
        setMessage('Account created. Check your email to confirm, then sign in.', 'ok');
        setMode('signin');
      }
    }
  } catch (err) {
    setMessage(friendlyError(err), 'err');
  } finally {
    submitBtn.disabled = false;
  }
});

// Already signed in → go back. Signed in but the server is asleep → wait for it
// and continue on its own, so you don't have to type the password again.
(async function check() {
  const { session, unreachable } = await getSessionState();
  if (session) { location.replace(getReturnUrl()); return; }
  if (unreachable) {
    setMessage("You're still signed in on this phone. Waiting for the server to wake up… (this page continues on its own)", 'ok');
    setTimeout(check, 15000);
  }
})();
