import { supabase } from './supabase-client.js';

// This page is the landing target for the Supabase "reset password" email link.
// Supabase appends a recovery token to the URL; supabase-js parses it, establishes
// a short-lived recovery session, and fires a PASSWORD_RECOVERY event. We then let
// the user set a new password via updateUser().
//
// It deliberately does NOT include auth-gate.js — that guard would bounce an
// unauthenticated visitor away before the recovery token can be exchanged.

const form = document.getElementById('reset-form');
const statusEl = document.getElementById('reset-status');
const messageEl = document.getElementById('reset-message');
const submitBtn = document.getElementById('reset-submit');

let ready = false;

function showForm() {
  if (ready) return;
  ready = true;
  statusEl.hidden = true;
  form.hidden = false;
  form.elements.password.focus();
}

function fail(text) {
  form.hidden = true;
  statusEl.hidden = false;
  statusEl.dataset.kind = 'err';
  statusEl.textContent = text;
}

function setMessage(text, kind) {
  messageEl.textContent = text || '';
  messageEl.dataset.kind = kind || '';
}

// The recovery event fires once supabase-js finishes parsing the URL token.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') showForm();
  else if (session) showForm(); // token already exchanged into a session
});

// Establish the recovery session from the URL. Handles both the implicit flow
// (#access_token=… in the hash, auto-detected) and the PKCE flow (?code=…).
(async () => {
  try {
    const code = new URL(location.href).searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      showForm();
    } else {
      // Give detectSessionInUrl a moment to finish before giving up.
      setTimeout(() => {
        if (!ready) {
          fail('This page needs a valid reset link. Open the "Reset password" link from your email, or request a new one from the sign-in page.');
        }
      }, 1500);
    }
  } catch (err) {
    fail(err?.message || 'Your reset link is invalid or has expired. Request a new one from the sign-in page.');
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!ready) return;

  const password = form.elements.password.value;
  const confirm = form.elements.confirm.value;

  if (password.length < 8) { setMessage('Password must be at least 8 characters.', 'err'); return; }
  if (password !== confirm) { setMessage("Passwords don't match.", 'err'); return; }

  submitBtn.disabled = true;
  setMessage('Updating…');
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setMessage('Password updated! Taking you to the app…', 'ok');
    setTimeout(() => location.replace('index.html'), 1200);
  } catch (err) {
    setMessage(err?.message || 'Could not update password. Try opening the reset link again.', 'err');
    submitBtn.disabled = false;
  }
});
