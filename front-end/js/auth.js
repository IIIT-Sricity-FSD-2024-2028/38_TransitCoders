document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTheme();
});

// GLOBAL AUTH API
window.Auth = {
  login: (email, password) => {
    // This is used by some legacy modules; handleLogin is the primary form handler
    console.log("Auth.login called for:", email);
    // For simplicity in this demo, redirected logic usually handles the heavy lifting
    // but we can provide a helper to verify credentials if needed.
    return JSON.parse(sessionStorage.getItem('user')); 
  },
  logout: () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("st_session");
    localStorage.removeItem("userRole");
    // Redirect to landing page
    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const path = (window.location.pathname.includes('/auth/') || isRoot) ? "index.html" : "../index.html";
    window.location.href = path;
  },
  currentUser: () => {
    try {
      return JSON.parse(sessionStorage.getItem("user"));
    } catch (e) { return null; }
  },
  isSuperUser: () => {
    const u = Auth.currentUser();
    return u && (u.role === 'super_user' || u.role === 'admin');
  },
  hasPermission: (key) => {
    const u = Auth.currentUser();
    let userRoleStr = (u && u.role) ? u.role : localStorage.getItem('userRole');
    if (!userRoleStr) return false;
    
    // Normalize role string to match ID format (e.g. "Super User" -> "super_user")
    let roleId = userRoleStr.toLowerCase().replace(/ /g, '_');
    
    // Support customer which isn't in RBAC DB explicitly for dashboard basics
    if (roleId === 'customer') {
      // Allow customers to view own shipments if that permission is checked manually
      if (key === 'view_own_shipment_only') return true; 
      return false;
    }

    // Failsafe: Super User always has complete access regardless of DB state
    if (roleId === 'super_user') return true;

    if (!window.AppState || typeof window.AppState.getState !== 'function') return false;
    
    const state = window.AppState.getState();
    if (!state.roles || !Array.isArray(state.roles)) return false;
    
    const roleDef = state.roles.find(r => r.id === roleId);
    if (!roleDef) return false;
    
    return !!roleDef.permissions[key];
  }
};

function initAuth() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const themeToggle = document.querySelector(".theme-switch");

  initPasswordToggles();

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleLogin(loginForm);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleRegister(registerForm);
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
}

function initPasswordToggles() {
  const toggles = document.querySelectorAll("[data-toggle-password]");
  if (!toggles.length) return;

  toggles.forEach((toggleBtn) => {
    const targetSelector = toggleBtn.getAttribute("data-toggle-password");
    const targetInput = targetSelector
      ? document.querySelector(targetSelector)
      : null;
    const icon = toggleBtn.querySelector("i");
    if (!targetInput) return;

    toggleBtn.addEventListener("click", () => {
      const showing = targetInput.type === "text";
      targetInput.type = showing ? "password" : "text";
      if (icon) {
        icon.classList.toggle("fa-eye", !showing);
        icon.classList.toggle("fa-eye-slash", showing);
      }
      toggleBtn.setAttribute(
        "aria-label",
        showing ? "Show password" : "Hide password",
      );
      toggleBtn.setAttribute("aria-pressed", showing ? "false" : "true");
    });
  });
}

async function handleLogin(form) {
  const email = form.querySelector("#email").value.trim();
  const password = form.querySelector("#password").value;

  if (!email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  showToast("Signing in...", "info");

  setTimeout(() => {
    // Read directly from universal state to avoid browser caching issues on adapters
    let users = [];
    if (window.AppState && window.AppState.getState) {
        let stateObj = window.AppState.getState();
        // AUTO REPAIR: If user database is outdated, forcefully re-seed it so user doesn't have to clear storage manually!
        if (
          !stateObj.users ||
          !stateObj.users.find(u => u.email === 'hm_chennai@swifttrack.com') ||
          !stateObj.users.find(u => u.email === 'hm_karimnagar@swifttrack.com') ||
          !stateObj.users.find(u => u.email === 'hm_visakhapatnam@swifttrack.com') ||
          !stateObj.users.find(u => u.email === 'akhil.menon@swifttrack.com')
        ) {
           localStorage.removeItem(window.AppState.STORAGE_KEY);
           location.reload(); // Instantly reload to trigger fresh database seeding!
           return;
        }
        users = stateObj.users || [];
    } else if (window.mockData && window.mockData.users) {
        users = window.mockData.users; // Fallback
    }

    // First check if user exists at all with correct credentials
    const credMatch = users.find(
      (u) => String(u.email).toLowerCase() === String(email).toLowerCase() && u.password === password
    );

    if (!credMatch) {
      console.warn("Login Failed! Tried email:", email, "| Expected one of:", users.map(u => u.email).join(', '));
      showToast("Invalid credentials", "error");
      return;
    }

    // Check if account is pending approval
    if (!credMatch.active) {
      showToast("Your account is pending admin approval. Please wait.", "error");
      return;
    }

    const matchedUser = credMatch;

    showToast("Login successful!", "success");

    const userData = {
      user_id: matchedUser.user_id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      hub_id: matchedUser.hub_id || null,
      active: matchedUser.active,
    };

    // Keep both storages aligned because different role dashboards read different stores.
    localStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("st_session", JSON.stringify(userData));

    const normalizedRole = String(matchedUser.role || "").toLowerCase();
    localStorage.setItem("userRole", normalizedRole);

    const routeMap = {
      admin: "../hub-manager/dashboard.html",
      super_user: "../super-user/dashboard.html",
      "super-user": "../super-user/dashboard.html",
      superuser: "../super-user/dashboard.html",
      hub_manager: "../hub-manager/dashboard.html",
      merchant: "../merchant/merchant.html",
      customer: "../customer/dashboard.html",
      agent: "../delivery-agent/worklist.html",
      delivery_agent: "../delivery-agent/worklist.html",
      deliveryagent: "../delivery-agent/worklist.html"
    };

    const destination = routeMap[normalizedRole] || "../index.html";
    setTimeout(() => {
      window.location.href = destination;
    }, 1500);
  }, 1000);
}

async function handleRegister(form) {
  const firstName = form.querySelector("#first-name").value.trim();
  const lastName = form.querySelector("#last-name").value.trim();
  const email = form.querySelector("#email").value.trim();
  const role = form.querySelector("#role")?.value || 'customer';
  const company = form.querySelector("#company")?.value.trim() || "";
  const password = form.querySelector("#password").value;
  const confirmPassword = form.querySelector("#confirm-password")?.value || "";
  const terms = form.querySelector("#terms")?.checked;

  if (!firstName || !lastName || !email || !password) {
    showToast("Please fill in required fields", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match", "error");
    return;
  }

  if (terms === false) {
    showToast("Please agree to terms & conditions", "error");
    return;
  }

  // Check for existing user
  if (window.AppState && window.AppState.getState) {
    const stateObj = window.AppState.getState();
    const exists = stateObj.users.find(u => String(u.email).toLowerCase() === email.toLowerCase());
    if (exists) {
      showToast("Email already registered", "error");
      return;
    }
  }

  // Customers are auto-approved; all other roles need Super User approval
  const isCustomer = (role === 'customer');

  showToast("Creating account...", "info");

  setTimeout(() => {
    if (window.AppState && window.AppState.getState) {
      const stateObj = window.AppState.getState();
      const newUser = {
        user_id: 'U_' + Date.now().toString().slice(-6),
        name: `${firstName} ${lastName}`,
        email: email,
        password: password,
        role: role,
        active: isCustomer  // customers: true, others: false (pending)
      };
      if (company) newUser.company = company;

      stateObj.users.push(newUser);
      window.AppState.saveState(stateObj);

      if (isCustomer) {
        // Auto-login and redirect to customer dashboard
        const userData = {
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          hub_id: null,
          active: true
        };
        localStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("st_session", JSON.stringify(userData));
        localStorage.setItem("userRole", "customer");

        showToast("Account created! Redirecting...", "success");
        setTimeout(() => (window.location.href = "../customer/dashboard.html"), 1500);
      } else {
        // Needs approval
        showToast("Account created! Awaiting admin approval.", "success");
        setTimeout(() => (window.location.href = "login.html"), 2500);
      }
    }
  }, 1000);
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
            .toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 12px 24px;
                border-radius: 8px;
                color: white;
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .toast-info { background: #3b82f6; }
            .toast-success { background: #10b981; }
            .toast-error { background: #ef4444; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function initTheme() {
  const body = document.body;
  const savedTheme = localStorage.getItem("theme");
  const themeLabels = document.querySelectorAll(".theme-switch span");
  const sunIcons = document.querySelectorAll(".icon-light");
  const moonIcons = document.querySelectorAll(".icon-dark");

  if (savedTheme === "dark") {
    body.classList.add("dark");
    themeLabels.forEach((label) => (label.textContent = "Dark"));
    sunIcons.forEach((icon) => (icon.style.display = "none"));
    moonIcons.forEach((icon) => (icon.style.display = "inline-block"));
  } else {
    body.classList.remove("dark");
    themeLabels.forEach((label) => (label.textContent = "Light"));
    sunIcons.forEach((icon) => (icon.style.display = "inline-block"));
    moonIcons.forEach((icon) => (icon.style.display = "none"));
  }
}

function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.toggle("dark");
  const themeLabels = document.querySelectorAll(".theme-switch span");
  const sunIcons = document.querySelectorAll(".icon-light");
  const moonIcons = document.querySelectorAll(".icon-dark");

  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeLabels.forEach(
    (label) => (label.textContent = isDark ? "Dark" : "Light"),
  );

  sunIcons.forEach(
    (icon) => (icon.style.display = isDark ? "none" : "inline-block"),
  );
  moonIcons.forEach(
    (icon) => (icon.style.display = isDark ? "inline-block" : "none"),
  );
}
