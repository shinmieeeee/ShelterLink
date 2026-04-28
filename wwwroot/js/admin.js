/* =============================================
   ShelterLink – Admin Login Script
   ============================================= */

(function () {
  // ── DOM refs ──────────────────────────────────
  const form        = document.getElementById("adminLoginForm");
  const usernameEl  = document.getElementById("adminUsername");
  const passwordEl  = document.getElementById("adminPassword");
  const togglePwBtn = document.getElementById("togglePw");
  const eyeIcon     = document.getElementById("eyeIcon");
  const rememberMe  = document.getElementById("rememberMe");
  const signInBtn   = document.getElementById("signInBtn");
  const errorMsg    = document.getElementById("errorMsg");
  const toast       = document.getElementById("toast");
  const usernameErr = document.getElementById("usernameError");
  const passwordErr = document.getElementById("passwordError");

  // ── Hardcoded admin credentials (replace with real auth later) ──
  const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123",
  };

  // ── Restore remembered username ───────────────
  const savedUsername = localStorage.getItem("sl_admin_remember");
  if (savedUsername) {
    usernameEl.value = savedUsername;
    rememberMe.checked = true;
  }

  // ── Toggle password visibility ────────────────
  togglePwBtn.addEventListener("click", () => {
    const isPassword = passwordEl.type === "password";
    passwordEl.type = isPassword ? "text" : "password";
    eyeIcon.textContent = isPassword ? "🙈" : "👁️";
  });

  // ── Clear inline errors on input ─────────────
  usernameEl.addEventListener("input", () => {
    usernameErr.textContent = "";
    errorMsg.textContent = "";
  });

  passwordEl.addEventListener("input", () => {
    passwordErr.textContent = "";
    errorMsg.textContent = "";
  });

  // ── Validate fields ───────────────────────────
  function validate() {
    let valid = true;

    if (!usernameEl.value.trim()) {
      usernameErr.textContent = "Username is required.";
      valid = false;
    }

    if (!passwordEl.value) {
      passwordErr.textContent = "Password is required.";
      valid = false;
    }

    return valid;
  }

  // ── Show toast notification ───────────────────
  function showToast(msg, type = "success") {
    toast.textContent = msg;
    toast.className = `toast toast--${type} toast--visible`;
    setTimeout(() => {
      toast.className = "toast";
    }, 3000);
  }

  // ── Set loading state ─────────────────────────
  function setLoading(loading) {
    signInBtn.disabled = loading;
    signInBtn.querySelector(".btn-label").textContent = loading
      ? "Signing in…"
      : "Sign In";
  }

  // ── Form submit ───────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    if (!validate()) return;

    setLoading(true);

    // Simulate async auth (swap this with a real API call)
    await new Promise((r) => setTimeout(r, 900));

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      // Handle Remember Me
      if (rememberMe.checked) {
        localStorage.setItem("sl_admin_remember", username);
      } else {
        localStorage.removeItem("sl_admin_remember");
      }

      // Store session flag
      sessionStorage.setItem("sl_admin_logged_in", "true");
      sessionStorage.setItem("sl_admin_user", username);

      showToast("Login successful! Redirecting…", "success");

      setTimeout(() => {
        // TODO: replace with actual admin dashboard path
        window.location.href = "dashboard.html";
      }, 1200);
    } else {
      setLoading(false);
      errorMsg.textContent = "Invalid username or password.";
      showToast("Login failed.", "error");
      passwordEl.value = "";
      passwordEl.focus();
    }
  });
})();