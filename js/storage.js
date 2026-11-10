const BB_KEYS = {
  users: "bb_users",
  history: "bb_gameHistory",
  current: "bb_currentUser",
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Corrupted data in", key, "- using fallback.");
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Cannot write to LocalStorage:", e);
    return false;
  }
}

function getUsers() {
  const data = readJSON(BB_KEYS.users, []);
  if (!Array.isArray(data)) return [];
  return data.filter((u) => u && typeof u === "object" && u.id && u.username);
}

function saveUsers(users) {
  return writeJSON(BB_KEYS.users, users);
}

function getHistory() {
  const data = readJSON(BB_KEYS.history, []);
  if (!Array.isArray(data)) return [];
  return data.filter((g) => g && typeof g === "object" && g.id && g.userId);
}

function saveHistory(history) {
  return writeJSON(BB_KEYS.history, history);
}

function getUserHistory(userId) {
  return getHistory()
    .filter((g) => g.userId === userId)
    .sort((a, b) => new Date(b.datePlayed) - new Date(a.datePlayed));
}

function getCurrentUserId() {
  try {
    return localStorage.getItem(BB_KEYS.current);
  } catch (e) {
    return null;
  }
}

function setCurrentUser(userId) {
  try {
    localStorage.setItem(BB_KEYS.current, userId);
    return true;
  } catch (e) {
    return false;
  }
}

function clearCurrentUser() {
  try {
    localStorage.removeItem(BB_KEYS.current);
  } catch (e) {
    /* ignore */
  }
}

function getCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;
  const user = getUsers().find((u) => u.id === id);
  if (!user) {
    clearCurrentUser();
    return null;
  }
  return user;
}

function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function redirectIfLoggedIn() {
  if (getCurrentUser()) {
    window.location.href = "dashboard.html";
  }
}

function getSortedUsers() {
  return getUsers()
    .slice()
    .sort((a, b) => {
      const diff = (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0);
      if (diff !== 0) return diff;
      const hs = (Number(b.highestScore) || 0) - (Number(a.highestScore) || 0);
      if (hs !== 0) return hs;
      return new Date(a.dateRegistered) - new Date(b.dateRegistered);
    });
}

function getUserRank(userId) {
  const index = getSortedUsers().findIndex((u) => u.id === userId);
  return index === -1 ? null : index + 1;
}

function generateId(prefix) {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function hashPassword(password, salt) {
  const text = "binaryboss:" + salt + ":" + password;
  try {
    if (window.crypto && window.crypto.subtle) {
      const data = new TextEncoder().encode(text);
      const buffer = await crypto.subtle.digest("SHA-256", data);
      return (
        "sha256:" +
        Array.from(new Uint8Array(buffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    }
  } catch (e) {
    /* gagamitin ang fallback */
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return "simple:" + h.toString(16);
}
