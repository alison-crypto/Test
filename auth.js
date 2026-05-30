import { supabase, getSession } from './supabase-client.js';

const form = document.getElementById('auth-form');
const messageEl = document.getElementById('auth-message');
const submitBtn = document.getElementById('auth-submit');
const toggleBtn = document.getElementById('auth-toggle');

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
  submitBtn.textContent = mode === 'signin' ? 'Sign in' : 'Create account';
  toggleBtn.textContent = mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in';
  const pw = form.elements.password;
  pw.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
  setMessage('');
}

toggleBtn.addEventListener('click', () => setMode(mode === 'signin' ? 'signup' : 'signin'));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (!email || !password) return;

  submitBtn.disabled = true;
  setMessage('Working…');

  try {
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
    setMessage(err?.message || 'Sign-in failed. Try again.', 'err');
  } finally {
    submitBtn.disabled = false;
  }
});

(async () => {
  const session = await getSession();
  if (session) location.replace(getReturnUrl());
})();
