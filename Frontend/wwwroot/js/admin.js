(function () {
  const form        = document.getElementById("adminLoginForm");
  const usernameEl  = document.getElementById("adminUsername");
  const passwordEl  = document.getElementById("adminPassword");
  const togglePwBtn = document.getElementById("togglePw");
  const eyeIcon     = document.getElementById("eyeIcon");
  const rememberMe  = { checked: false }; 
  const signInBtn   = document.getElementById("signInBtn");
  const errorMsg    = document.getElementById("errorMsg");
  const toast       = document.getElementById("toast");
  const usernameErr = document.getElementById("usernameError");
  const passwordErr = document.getElementById("passwordError");

  // Restore remembered username
  const savedUsername = localStorage.getItem("sl_admin_remember");
  if (savedUsername) {
    usernameEl.value = savedUsername;
    rememberMe.checked = true;
  }

  // Toggle password visibility
  togglePwBtn.addEventListener("click", () => {
    const isPassword = passwordEl.type === "password";
    passwordEl.type = isPassword ? "text" : "password";
    eyeIcon.textContent = isPassword ? "🙈" : "👁️";
  });

  usernameEl.addEventListener("input", () => { usernameErr.textContent = ""; errorMsg.textContent = ""; });
  passwordEl.addEventListener("input", () => { passwordErr.textContent = ""; errorMsg.textContent = ""; });

  function validate() {
    let valid = true;
    if (!usernameEl.value.trim()) { usernameErr.textContent = "Username is required."; valid = false; }
    if (!passwordEl.value)        { passwordErr.textContent = "Password is required."; valid = false; }
    return valid;
  }

  function showToast(msg, type = "success") {
    toast.textContent = msg;
    toast.className = `toast toast--${type} toast--visible`;
    setTimeout(() => { toast.className = "toast"; }, 3000);
  }

  function setLoading(loading) {
    signInBtn.disabled = loading;
    signInBtn.querySelector(".btn-label").textContent = loading ? "Signing in…" : "Sign In";
  }

  // ✅ Form submit — now uses real API
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: usernameEl.value.trim(),
          password: passwordEl.value
        }),
      });

      const data = await response.json();

      // ✅ Check login success AND role is Admin
      if (response.ok && data.success && data.user.role === 'Admin') {
        if (rememberMe.checked) {
          localStorage.setItem("sl_admin_remember", usernameEl.value.trim());
        } else {
          localStorage.removeItem("sl_admin_remember");
        }

        // Save user to storage
        const userJson = JSON.stringify(data.user);
        sessionStorage.setItem('shelterlink_user', userJson);
        localStorage.setItem('shelterlink_user', userJson);

        showToast("Login successful! Redirecting…", "success");
        setTimeout(() => {
          window.location.href = "/html/admin-dashboard.html"; // ✅ correct path
        }, 1200);

      } else {
        // Not admin or wrong credentials
        setLoading(false);
        errorMsg.textContent = "Invalid username or password.";
        showToast("Login failed.", "error");
        passwordEl.value = "";
        passwordEl.focus();
      }

    } catch (err) {
      setLoading(false);
      errorMsg.textContent = "Could not connect. Please try again.";
      showToast("Connection error.", "error");
    }
  });
})();