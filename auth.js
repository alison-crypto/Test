import { supabase, getSession } from './supabase-client.js';

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
    const decoded = decodeURIComponent(ret);
    if (decoded.startsWith('/') || /^[a-z0-9_-]+\.html/i.test(decoded.replace(/^\//, ''))) return decoded;
  } catch {}
  return 'index.html';
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
    setMessage(err?.message || 'Something went wrong. Try again.', 'err');
  } finally {
    submitBtn.disabled = false;
  }
});

(async () => {
  const session = await getSession();
  if (session) location.replace(getReturnUrl());
})();
