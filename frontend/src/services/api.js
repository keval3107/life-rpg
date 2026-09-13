const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("life_rpg_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

  getDashboard: () => request("/dashboard"),
  getQuests: () => request("/quests"),
  createQuest: (body) => request("/quests", { method: "POST", body: JSON.stringify(body) }),
  updateQuest: (id, body) => request(`/quests/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteQuest: (id) => request(`/quests/${id}`, { method: "DELETE" }),
  completeQuest: (id) => request(`/quests/${id}/complete`, { method: "POST" }),
  getTimer: (id) => request(`/quests/${id}/timer`),
  timerAction: (id, action) => request(`/quests/${id}/timer/${action}`, { method: "POST" }),

  getRecycleBin: () => request("/recycle-bin"),
  restoreQuest: (id) => request(`/recycle-bin/${id}/restore`, { method: "POST" }),
  permanentlyDeleteQuest: (id) => request(`/recycle-bin/${id}`, { method: "DELETE" }),

  getRewards: () => request("/rewards"),
  buyReward: (id) => request(`/rewards/${id}/buy`, { method: "POST" }),
};
