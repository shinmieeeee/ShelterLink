/* =============================================
   ShelterLink – Register Page JavaScript
   ============================================= */

const form             = document.getElementById('registerForm');
const usernameEl       = document.getElementById('username');
const emailEl          = document.getElementById('email');
const passwordEl       = document.getElementById('password');
const confirmPwEl      = document.getElementById('confirmPassword');
const ageEl            = document.getElementById('age');
const togglePwBtn      = document.getElementById('togglePw');
const toggleConfirmBtn = document.getElementById('toggleConfirmPw');
const eyeIcon          = document.getElementById('eyeIcon');
const eyeIconConfirm   = document.getElementById('eyeIconConfirm');
const createBtn        = document.getElementById('createBtn');
const toast            = document.getElementById('toast');
const usernameErr      = document.getElementById('usernameError');
const emailErr         = document.getElementById('emailError');
const passwordErr      = document.getElementById('passwordError');
const confirmPwErr     = document.getElementById('confirmPasswordError');
const ageErr           = document.getElementById('ageError');

// ── Toggle password visibility ──
togglePwBtn.addEventListener('click', () => {
  const isPw = passwordEl.type === 'password';
  passwordEl.type = isPw ? 'text' : 'password';
  eyeIcon.textContent = isPw ? '🙈' : '👁️';
});

toggleConfirmBtn.addEventListener('click', () => {
  const isPw = confirmPwEl.type === 'password';
  confirmPwEl.type = isPw ? 'text' : 'password';
  eyeIconConfirm.textContent = isPw ? '🙈' : '👁️';
});

// ── Live validation clear ──
usernameEl.addEventListener('input',  () => clearError(usernameEl,  usernameErr));
emailEl.addEventListener('input',     () => clearError(emailEl,     emailErr));
passwordEl.addEventListener('input',  () => clearError(passwordEl,  passwordErr));
confirmPwEl.addEventListener('input', () => clearError(confirmPwEl, confirmPwErr));
ageEl.addEventListener('input',       () => clearError(ageEl,       ageErr));

function clearError(input, errEl) {
  input.classList.remove('invalid');
  errEl.textContent = '';
  hideToast();
}

function showError(input, errEl, message) {
  input.classList.add('invalid');
  errEl.textContent = message;
}

function showToast(message, type = 'error') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
}

function hideToast() {
  toast.className = 'toast';
}

// ── Form submission ──
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username  = usernameEl.value.trim();
  const email     = emailEl.value.trim();
  const password  = passwordEl.value;
  const confirmPw = confirmPwEl.value;
  const age       = parseInt(ageEl.value, 10);

  let valid = true;

  if (!username) {
    showError(usernameEl, usernameErr, 'Please enter a username.');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(emailEl, emailErr, 'Please enter a valid email address.');
    valid = false;
  }
  if (!password || password.length < 6) {
    showError(passwordEl, passwordErr, 'Password must be at least 6 characters.');
    valid = false;
  }
  if (!confirmPw) {
    showError(confirmPwEl, confirmPwErr, 'Please confirm your password.');
    valid = false;
  } else if (password !== confirmPw) {
    showError(confirmPwEl, confirmPwErr, 'Passwords do not match.');
    valid = false;
  }
  if (!ageEl.value || isNaN(age) || age < 18) {
    showError(ageEl, ageErr, 'You must be at least 18 years old.');
    valid = false;
  }

  if (!valid) return;

  // Show loading state
createBtn.disabled = true;
createBtn.querySelector('.btn-label').textContent = 'Creating account…';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, age }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('🐾 Account created! Redirecting…', 'success');
      setTimeout(() => {
        window.location.href = data.redirectUrl || 'login.html';
      }, 1200);
    } else {
      showToast(data.message || 'Registration failed. Please try again.', 'error');
        createBtn.disabled = false;
        createBtn.querySelector('.btn-label').textContent = 'Create Account';
    }

  } catch (err) {
    showToast('🐾 Could not connect. Please try again.', 'error');
    createBtn.disabled = false;
    createBtn.querySelector('.btn-label').textContent = 'Create Account';
  }
});
