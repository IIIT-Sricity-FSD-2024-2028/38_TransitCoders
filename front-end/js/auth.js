/**
 * SwiftTrack Auth — wired to backend API (localhost:3001)
 * Replaces old mock/localStorage-based auth with real fetch() calls.
 */

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTheme();
});

// ─── Global Auth helper (used by dashboard guards) ───────────────────────────
window.Auth = {
  /** Returns the currently logged-in user from sessionStorage */
  currentUser: () => {
    try { return JSON.parse(sessionStorage.getItem("user")); }
    catch (_) { return null; }
  },
  isSuperUser: () => {
    const u = window.Auth.currentUser();
    return u && (u.role === 'super_user' || u.role === 'admin');
  },
  hasPermission: (key) => {
    const u = window.Auth.currentUser();
    if (!u) return false;
    if (u.role === 'super_user') return true; // super_user has all
    // RBAC check via AppState (roles are loaded from backend on first access)
    if (!window.AppState || typeof window.AppState.getState !== 'function') return false;
    const state = window.AppState.getState();
    if (!state.roles || !Array.isArray(state.roles)) return false;
    const roleId = (u.role || '').toLowerCase().replace(/ /g, '_');
    const roleDef = state.roles.find(r => r.id === roleId || r.roleId === roleId);
    return roleDef ? !!roleDef.permissions[key] : false;
  },
  logout: async () => {
    if (window.API) {
      await window.API.auth.logout();
    } else {
      // Fallback when api.js is not loaded — clear session manually
      localStorage.removeItem('x-auth-token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      localStorage.removeItem('userRole');
    }
    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const path = (window.location.pathname.includes('/auth/') || isRoot) ? "index.html" : "../index.html";
    window.location.href = path;
  },
};

function initAuth() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  initPasswordToggles();
  if (loginForm) loginForm.addEventListener("submit", e => { e.preventDefault(); handleLogin(loginForm); });
  if (registerForm) registerForm.addEventListener("submit", e => { e.preventDefault(); handleRegister(registerForm); });
}

function initPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach(btn => {
    const input = btn.getAttribute("data-toggle-password")
      ? document.querySelector(btn.getAttribute("data-toggle-password"))
      : null;
    const icon = btn.querySelector("i");
    if (!input) return;
    btn.addEventListener("click", () => {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      icon?.classList.toggle("fa-eye", !showing);
      icon?.classList.toggle("fa-eye-slash", showing);
    });
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function handleLogin(form) {
  const email = form.querySelector("#email").value.trim();
  const password = form.querySelector("#password").value;

  if (!email || !password) { showToast("Please fill in all fields", "error"); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("Please enter a valid email", "error"); return; }

  showToast("Signing in…", "info");

  try {
    // Hit real backend
    const result = await window.API.auth.login(email, password);
    const { token, user } = result.data || result;

    // Persist token + user
    window.API.Token.set(token);
    const userData = {
      id: user.id,
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hub_id: user.hubId || null,
      isActive: user.isActive,
    };
    localStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("user", JSON.stringify(userData));
    // st_session removed — sessionStorage('user') is the canonical session key
    localStorage.setItem("userRole", user.role);

    showToast("Login successful!", "success");

    const routeMap = {
      super_user:     "../super-user/dashboard.html",
      hub_manager:    "../hub-manager/dashboard.html",
      merchant:       "../merchant/merchant.html",
      customer:       "../customer/index.html",
      delivery_agent: "../delivery-agent/worklist.html",
    };
    setTimeout(() => { window.location.href = routeMap[user.role] || "../index.html"; }, 1500);

  } catch (err) {
    console.error("Backend login failed:", err);
    showToast(err?.message || "Login failed", "error");
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
async function handleRegister(form) {
  const firstName    = form.querySelector("#first-name").value.trim();
  const lastName     = form.querySelector("#last-name").value.trim();
  const email        = form.querySelector("#email").value.trim();
  const role         = form.querySelector("#role")?.value || "customer";
  const company      = form.querySelector("#company")?.value.trim() || "";
  const password     = form.querySelector("#password").value;
  const confirmPw    = form.querySelector("#confirm-password")?.value || "";
  const termsChecked = form.querySelector("#terms")?.checked;

  if (!firstName || !lastName || !email || !password) { showToast("Please fill in required fields", "error"); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("Please enter a valid email", "error"); return; }
  if (password !== confirmPw) { showToast("Passwords do not match", "error"); return; }
  if (termsChecked === false) { showToast("Please agree to terms & conditions", "error"); return; }

  showToast("Creating account…", "info");

  try {
    const payload = { name: `${firstName} ${lastName}`, email, password, role };
    if (company) payload.company = company;

    await window.API.auth.register(payload);

    const isCustomer = (role === "customer");
    if (isCustomer) {
      // Auto-login
      await handleLogin({ querySelector: (sel) => {
        if (sel === "#email") return { value: email };
        if (sel === "#password") return { value: password };
        return null;
      }});
    } else {
      showToast("Account created! Awaiting admin approval.", "success");
      setTimeout(() => { window.location.href = "login.html"; }, 2500);
    }
  } catch (err) {
    showToast(err.message || "Registration failed", "error");
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `.toast{position:fixed;bottom:24px;right:24px;padding:12px 24px;border-radius:8px;color:#fff;font-family:'Poppins',sans-serif;font-size:14px;z-index:10000;animation:slideIn .3s ease;box-shadow:0 4px 12px rgba(0,0,0,.15)}.toast-info{background:#3b82f6}.toast-success{background:#10b981}.toast-error{background:#ef4444}@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
    document.head.appendChild(style);
  }
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "all .3s"; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function initTheme() {
  const body = document.body;
  if (localStorage.getItem("theme") === "dark") body.classList.add("dark");
  document.querySelector(".theme-switch")?.addEventListener("click", () => {
    const dark = body.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  });
}
