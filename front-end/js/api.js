/**
 * SwiftTrack API Client
 * Single source of truth for all HTTP calls to the backend.
 * Base URL: http://localhost:3001
 *
 * Usage:
 *   const users = await API.users.getAll();
 *   const token = await API.auth.login(email, password);
 */

const API_BASE = 'http://localhost:3001';

// ─── Token helpers ──────────────────────────────────────────────────────────
const Token = {
  get: () => localStorage.getItem('x-auth-token'),
  set: (t) => localStorage.setItem('x-auth-token', t),
  clear: () => localStorage.removeItem('x-auth-token'),
};

// ─── Core fetch wrapper ─────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Token.get();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['x-auth-token'] = token;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json.error || json.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json; // { success, data, message }
}

// ─── API Modules ────────────────────────────────────────────────────────────
window.API = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    async login(email, password) {
      // Backend auth login endpoint
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return res; // { token }
    },
    async register(data) {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res;
    },
    async logout() {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch (_) { /* ignore */ }
      Token.clear();
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('st_session');
      localStorage.removeItem('userRole');
    },
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  users: {
    async getAll() {
      const res = await apiFetch('/users');
      return res.data || [];
    },
    async getById(id) {
      const res = await apiFetch(`/users/${id}`);
      return res.data;
    },
    async create(data) {
      const res = await apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return res.data;
    },
    async delete(id) {
      return apiFetch(`/users/${id}`, { method: 'DELETE' });
    },
    async approve(id) {
      const res = await apiFetch(`/users/${id}/approve`, { method: 'PATCH' });
      return res.data;
    },
  },

  // ── Tickets ───────────────────────────────────────────────────────────────
  tickets: {
    async getAll() {
      const res = await apiFetch('/tickets');
      return res.data || [];
    },
    async create(data) {
      const res = await apiFetch('/tickets', { method: 'POST', body: JSON.stringify(data) });
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return res.data;
    },
    async delete(id) {
      return apiFetch(`/tickets/${id}`, { method: 'DELETE' });
    },
  },

  // ── Complaints ────────────────────────────────────────────────────────────
  complaints: {
    async getAll() {
      const res = await apiFetch('/complaints');
      return res.data || [];
    },
    async create(data) {
      const res = await apiFetch('/complaints', { method: 'POST', body: JSON.stringify(data) });
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return res.data;
    },
  },

  // ── Feedback ──────────────────────────────────────────────────────────────
  feedback: {
    async getAll() {
      const res = await apiFetch('/feedback');
      return res.data || [];
    },
    async create(data) {
      const res = await apiFetch('/feedback', { method: 'POST', body: JSON.stringify(data) });
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/feedback/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return res.data;
    },
  },

  // ── Roles ─────────────────────────────────────────────────────────────────
  roles: {
    async getAll() {
      const res = await apiFetch('/roles');
      return res.data || [];
    },
    async getById(id) {
      const res = await apiFetch(`/roles/${id}`);
      return res.data;
    },
    async update(id, permissions) {
      const res = await apiFetch(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ permissions }),
      });
      return res.data;
    },
  },

  // ── Shipments (placeholder — owned by teammate) ───────────────────────────
  shipments: {
    async getAll() {
      try {
        const res = await apiFetch('/shipments');
        return res.data || [];
      } catch (_) { return null; } // fallback to mockData if not deployed yet
    },
  },

  // ── Orders (placeholder — owned by teammate) ──────────────────────────────
  orders: {
    async getAll() {
      try {
        const res = await apiFetch('/orders');
        return res.data || [];
      } catch (_) { return null; }
    },
  },
};

// Export token helper for auth.js
window.API.Token = Token;
