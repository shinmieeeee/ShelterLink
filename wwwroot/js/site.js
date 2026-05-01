<<<<<<< HEAD
/* =============================================
   ShelterLink – Login Page JavaScript
   ============================================= */

   const form        = document.getElementById('loginForm');
   const usernameEl  = document.getElementById('username');
   const passwordEl  = document.getElementById('password');
   const togglePwBtn = document.getElementById('togglePw');
   const eyeIcon     = document.getElementById('eyeIcon');
   const signInBtn   = document.getElementById('signInBtn');
   const btnLoader   = document.getElementById('btnLoader');
   const toast       = document.getElementById('toast');
   const usernameErr = document.getElementById('usernameError');
   const passwordErr = document.getElementById('passwordError');
   
   // ── Toggle password visibility ──
   togglePwBtn.addEventListener('click', () => {
     const isPw = passwordEl.type === 'password';
     passwordEl.type = isPw ? 'text' : 'password';
     eyeIcon.textContent = isPw ? '🙈' : '👁️';
   });
   
   // ── Live validation clear ──
   usernameEl.addEventListener('input', () => clearError(usernameEl, usernameErr));
   passwordEl.addEventListener('input', () => clearError(passwordEl, passwordErr));
   
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
   
     const username = usernameEl.value.trim();
     const password = passwordEl.value;
   
     let valid = true;
     if (!username) { showError(usernameEl, usernameErr, 'Please enter your username.'); valid = false; }
     if (!password) { showError(passwordEl, passwordErr, 'Please enter your password.'); valid = false; }
     else if (password.length < 6) { showError(passwordEl, passwordErr, 'Password must be at least 6 characters.'); valid = false; }
     if (!valid) return;
   
     signInBtn.disabled = true;
     signInBtn.querySelector('.btn-label').textContent = 'Signing in…';
     btnLoader.hidden = false;
     hideToast();
   
     try {
       const response = await fetch('/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: username, password }),
       });
   
       const data = await response.json();
   
       if (response.ok && data.success) {
         // Save user to both storage types
         const userJson = JSON.stringify(data.user);
         sessionStorage.setItem('shelterlink_user', userJson);
         localStorage.setItem('shelterlink_user', userJson);
   
         showToast('🐾 Welcome back! Redirecting…', 'success');
         setTimeout(() => {
           window.location.href = '/html/dashboard.html';
         }, 1000);
       } else {
         showToast(data.message || 'Invalid email or password.', 'error');
         signInBtn.disabled = false;
         signInBtn.querySelector('.btn-label').textContent = 'Sign In';
         btnLoader.hidden = true;
       }
   
     } catch (err) {
       showToast('🐾 Could not connect. Please try again.', 'error');
       signInBtn.disabled = false;
       signInBtn.querySelector('.btn-label').textContent = 'Sign In';
       btnLoader.hidden = true;
     }
   });
   
=======
﻿/* =============================================
   ShelterLink – Login Page JavaScript
   ============================================= */

const form        = document.getElementById('loginForm');
const usernameEl  = document.getElementById('username');
const passwordEl  = document.getElementById('password');
const togglePwBtn = document.getElementById('togglePw');
const eyeIcon     = document.getElementById('eyeIcon');
const signInBtn   = document.getElementById('signInBtn');
const btnLoader   = document.getElementById('btnLoader');
const toast       = document.getElementById('toast');
const usernameErr = document.getElementById('usernameError');
const passwordErr = document.getElementById('passwordError');

// ── Toggle password visibility ──
togglePwBtn.addEventListener('click', () => {
  const isPw = passwordEl.type === 'password';
  passwordEl.type = isPw ? 'text' : 'password';
  eyeIcon.textContent = isPw ? '🙈' : '👁️';
});

// ── Live validation clear ──
usernameEl.addEventListener('input', () => clearError(usernameEl, usernameErr));
passwordEl.addEventListener('input', () => clearError(passwordEl, passwordErr));

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

  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  let valid = true;
  if (!username) { showError(usernameEl, usernameErr, 'Please enter your email.'); valid = false; }
  if (!password) { showError(passwordEl, passwordErr, 'Please enter your password.'); valid = false; }
  else if (password.length < 6) { showError(passwordEl, passwordErr, 'Password must be at least 6 characters.'); valid = false; }
  if (!valid) return;

  signInBtn.disabled = true;
  signInBtn.querySelector('.btn-label').textContent = 'Signing in…';
  btnLoader.hidden = false;
  hideToast();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Save user object for dashboard
      const userJson = JSON.stringify(data.user);
      sessionStorage.setItem('shelterlink_user', userJson);
      localStorage.setItem('shelterlink_user', userJson);

      showToast('🐾 Welcome back! Redirecting…', 'success');
      setTimeout(() => {
        window.location.href = data.redirectUrl || 'dashboard.html';
      }, 1000);
    } else {
      showToast(data.message || 'Invalid email or password.', 'error');
      signInBtn.disabled = false;
      signInBtn.querySelector('.btn-label').textContent = 'Sign In';
      btnLoader.hidden = true;
    }

  } catch (err) {
    showToast('🐾 Could not connect. Please try again.', 'error');
    signInBtn.disabled = false;
    signInBtn.querySelector('.btn-label').textContent = 'Sign In';
    btnLoader.hidden = true;
  }
});
>>>>>>> 41a8b0b73edac4d73c5ccc71d04cf1ff7ab377fe
