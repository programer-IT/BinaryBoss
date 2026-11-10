/* ==========================================================
   BINARYBOSS - auth.js
   Register, Login, Logout, at navbar behavior.
   ========================================================== */

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,16}$/;
const AVATARS = ["🤖", "👾", "🚀", "🦊", "🐉", "🦅", "⚡", "🧠", "🎮", "🔥"];

/* ---------- Validation ---------- */
function validateUsername(username) {
  if (!username) return "Please enter a username.";
  if (!USERNAME_REGEX.test(username)) {
    return "Username must be 3-16 characters: letters, numbers, or underscore only.";
  }
  return "";
}

function validatePassword(password) {
  if (!password) return "Please enter a password.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password.length > 64) return "Password is too long (max 64 characters).";
  return "";
}

/* ---------- Core auth functions ---------- */
async function registerUser(username, password, confirmPassword) {
  username = (username || "").trim();

  const error = validateUsername(username) || validatePassword(password);
  if (error) return { ok: false, error };
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const users = getUsers();
  const taken = users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
  if (taken) return { ok: false, error: "That username is already taken." };

  const user = {
    id: generateId("user"),
    username: username,
    passwordHash: await hashPassword(password, username.toLowerCase()),
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    totalScore: 0,
    highestScore: 0,
    gamesPlayed: 0,
    dateRegistered: new Date().toISOString(),
  };

  users.push(user);
  if (!saveUsers(users)) {
    return {
      ok: false,
      error: "Could not save your account. Is browser storage blocked?",
    };
  }
  setCurrentUser(user.id);
  return { ok: true, user };
}

async function loginUser(username, password) {
  username = (username || "").trim();
  if (!username || !password) {
    return { ok: false, error: "Please enter your username and password." };
  }

  const user = getUsers().find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
  const hash = await hashPassword(password, username.toLowerCase());

  if (!user || user.passwordHash !== hash) {
    return { ok: false, error: "Invalid username or password." };
  }
  setCurrentUser(user.id);
  return { ok: true, user };
}

function logout() {
  clearCurrentUser();
  window.location.href = "login.html";
}

/* ---------- Form helpers ---------- */
function showError(message) {
  const box = document.getElementById("formError");
  if (!box) return;
  box.textContent = message;
  box.classList.add("show");
}

function clearError() {
  const box = document.getElementById("formError");
  if (!box) return;
  box.textContent = "";
  box.classList.remove("show");
}

function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;
  redirectIfLoggedIn();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Creating account...";

    const result = await registerUser(
      document.getElementById("username").value,
      document.getElementById("password").value,
      document.getElementById("confirmPassword").value,
    );

    if (result.ok) {
      window.location.href = "dashboard.html";
    } else {
      showError(result.error);
      btn.disabled = false;
      btn.textContent = "Create Account";
    }
  });
}

function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  redirectIfLoggedIn();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Logging in...";

    const result = await loginUser(
      document.getElementById("username").value,
      document.getElementById("password").value,
    );

    if (result.ok) {
      window.location.href = "dashboard.html";
    } else {
      showError(result.error);
      btn.disabled = false;
      btn.textContent = "Login";
    }
  });
}

/* ---------- Navbar ---------- */
function updateNavState() {
  const loggedIn = !!getCurrentUser();
  document.querySelectorAll('[data-auth="guest"]').forEach((el) => {
    el.hidden = loggedIn;
  });
  document.querySelectorAll('[data-auth="user"]').forEach((el) => {
    el.hidden = !loggedIn;
  });
}

function initLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
}

function initNavToggle() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  updateNavState();
  initLogoutButtons();
  initRegisterForm();
  initLoginForm();
});
