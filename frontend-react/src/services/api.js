/**
 * SwiftTrack API Client
 * Single source of truth for all HTTP calls to the backend.
 * Base URL defaults to http://localhost:3001 but can be overridden by setting
 * window.SWIFTTRACK_API_BASE before this script loads (e.g. for staging/prod).
 *
 * Usage:
 *   const users = await API.users.getAll();
 *   const token = await API.auth.login(email, password);
 */

// Allow deployment-time override: <script>window.SWIFTTRACK_API_BASE='https://api.example.com'</script>
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// ─── Token helpers ──────────────────────────────────────────────────────────
export const Token = {
  get: () => localStorage.getItem('x-auth-token'),
  set: (t) => localStorage.setItem('x-auth-token', t),
  clear: () => localStorage.removeItem('x-auth-token'),
};

// ─── Core fetch wrapper ─────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Token.get();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['x-auth-token'] = token;

  const fetchOptions = { cache: 'no-store', ...options, headers };
  const res = await fetch(`${API_BASE}${path}`, fetchOptions);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json.error || json.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json; // { success, data, message }
}

// ─── API Modules ────────────────────────────────────────────────────────────
export const API = {

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
      if (window.AppState) {
        const s = window.AppState.getState();
        s.users.push({
          ...data,
          user_id: res.data.id,
          hub_id: data.hubId || null,
          active: true
        });
        window.AppState.saveState(s);
      }
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (window.AppState) {
        const s = window.AppState.getState();
        const u = s.users.find(x => x.user_id === id);
        if (u) {
          Object.assign(u, data);
          if (data.hubId !== undefined) u.hub_id = data.hubId;
          window.AppState.saveState(s);
        }
      }
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
      if (window.AppState) {
        const s = window.AppState.getState();
        s.tickets.push({ ...data, id: res.data.id });
        window.AppState.saveState(s);
      }
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (window.AppState) {
        const s = window.AppState.getState();
        const t = s.tickets.find(x => x.id === id);
        if (t) { Object.assign(t, data); window.AppState.saveState(s); }
      }
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
      const payload = {
        orderId: data.orderId,
        type: data.type || 'General Issue',
        description: data.description || data.details || data.comment || data.message || '',
        priority: data.priority || 'Medium',
      };
      const res = await apiFetch('/complaints', { method: 'POST', body: JSON.stringify(payload) });
      if (window.AppState) {
        const s = window.AppState.getState();
        s.complaints.push({ ...data, id: res.data.id });
        window.AppState.saveState(s);
      }
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (window.AppState) {
        const s = window.AppState.getState();
        const c = s.complaints.find(x => x.id === id);
        if (c) { Object.assign(c, data); window.AppState.saveState(s); }
      }
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
      const payload = {
        orderId: data.orderId,
        rating: Number(data.rating),
        comments: data.comments || data.comment || data.feedback || '',
      };
      const res = await apiFetch('/feedback', { method: 'POST', body: JSON.stringify(payload) });
      if (window.AppState) {
        const s = window.AppState.getState();
        s.feedback.push({ ...data, id: res.data.id });
        window.AppState.saveState(s);
      }
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/feedback/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (window.AppState) {
        const s = window.AppState.getState();
        const f = s.feedback.find(x => x.id === id);
        if (f) { Object.assign(f, data); window.AppState.saveState(s); }
      }
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

  // ── Agents ─────────────────────────────────────────────────────────────────
  agents: {
    async uploadPhoto(id, file) {
      const token = Token.get();
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${API_BASE}/agents/${id}/delivery-photo`, {
        method: 'POST',
        headers: { 'x-auth-token': token }, // FormData automatically sets multipart/form-data with boundary
        body: formData
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Upload failed');
      }
      return json;
    }
  },

  // ── Shipments ──────────────────────────────────────────────────────────────
  shipments: {
    async getAll() {
      try {
        const res = await apiFetch('/shipments');
        return res.data || [];
      } catch (err) {
        console.error('[API.shipments.getAll] Failed to fetch shipments:', err?.message || err);
        return null;
      }
    },
    async create(data) {
      const res = await apiFetch('/shipments', { method: 'POST', body: JSON.stringify(data) });
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return res.data;
    },
    async getById(id) {
      const res = await apiFetch(`/shipments/${id}`);
      return res.data;
    },
    async getTracking(id) {
      const res = await apiFetch(`/shipments/${id}/track`);
      return res.data;
    },
    async cancel(id) {
      const res = await apiFetch(`/shipments/${id}`, { method: 'DELETE' });
      return res.data;
    },
  },

  // ── Orders — the authoritative order lifecycle API ────────────────────────
  orders: {
    async getAll() {
      try {
        const res = await apiFetch('/orders');
        return res.data || [];
      } catch (err) {
        console.error('[API.orders.getAll] Failed to fetch orders:', err?.message || err);
        return null;
      }
    },
    async getById(id) {
      const res = await apiFetch(`/orders/${id}`);
      return res.data;
    },
    async create(data) {
      // NOTE: backend computes the authoritative price — any client-side
      // "amount" field is accepted but ignored.
      const res = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) });
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return res.data;
    },
    async updateStatus(id, status) {
      const res = await apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      return res.data;
    },
    async assign(id, agentId) {
      const res = await apiFetch(`/orders/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ agentId }) });
      return res.data;
    },
    async autoAssign(id) {
      const res = await apiFetch(`/orders/${id}/auto-assign`, { method: 'PATCH' });
      return res.data;
    },
    async cancel(id) {
      const res = await apiFetch(`/orders/${id}/cancel`, { method: 'PATCH' });
      return res.data;
    },
    async transfer(id, toHubId, reason) {
      const res = await apiFetch(`/orders/${id}/transfer`, {
        method: 'PATCH',
        body: JSON.stringify({ toHubId, reason }),
      });
      return res.data;
    },
    async authorizeReturn(id, reason) {
      const res = await apiFetch(`/orders/${id}/return`, { method: 'PATCH', body: JSON.stringify({ reason }) });
      return res.data;
    },
    async reportMishap(id, type, description) {
      const typeMap = {
        vehicle_breakdown: 'vehicle_breakdown',
        vehicle: 'vehicle_breakdown',
        traffic: 'vehicle_breakdown',
        address_not_found: 'address_not_found',
        address_incorrect: 'address_not_found',
        address: 'address_not_found',
        customer_unavailable: 'customer_unavailable',
        unavailable: 'customer_unavailable',
        package_damaged: 'package_damaged',
        damaged_package: 'package_damaged',
        package: 'package_damaged',
        damaged: 'package_damaged',
        customer_refused: 'other',
        refused: 'other',
        other: 'other',
      };
      const cleanType = typeMap[(type || '').trim().toLowerCase()] || 'other';
      const res = await apiFetch(`/orders/${id}/mishap`, {
        method: 'POST',
        body: JSON.stringify({ type: cleanType, description: description || '' }),
      });
      return res.data;
    },
    async schedulePickup(id, pickupAt) {
      const res = await apiFetch(`/orders/${id}/pickup`, { method: 'PATCH', body: JSON.stringify({ pickupAt }) });
      return res.data;
    },
    async confirmDelivery(id) {
      const res = await apiFetch(`/orders/${id}/confirm`, { method: 'PATCH' });
      return res.data;
    },
    async remove(id) {
      const res = await apiFetch(`/orders/${id}`, { method: 'DELETE' });
      return res.data;
    },
    barcodeUrl(id) {
      return `${API_BASE}/orders/${id}/barcode`;
    },
  },

  // ── Agents ───────────────────────────────────────────────────────────────
  agents: {
    async getProfile(id) {
      const res = await apiFetch(`/agents/${id}`);
      return res.data;
    },
    async getWorklist(id) {
      const res = await apiFetch(`/agents/${id}/worklist`);
      return res.data;
    },
    async updateAvailability(id, availabilityStatus) {
      const res = await apiFetch(`/agents/${id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ availabilityStatus }),
      });
      return res.data;
    },
  },

  // ── Pricing — the SINGLE authoritative price calculator ───────────────────
  pricing: {
    async quote(serviceLevel, weightKg, paymentMode) {
      const res = await apiFetch('/pricing/quote', {
        method: 'POST',
        body: JSON.stringify({ serviceLevel, weightKg, paymentMode }),
      });
      return res.data;
    },
    async getConfig() {
      const res = await apiFetch('/pricing/config');
      return res.data;
    },
    async updateConfig(changes) {
      const res = await apiFetch('/pricing/config', { method: 'PUT', body: JSON.stringify(changes) });
      return res.data;
    },
  },

  // ── Public tracking (no auth) ──────────────────────────────────────────────
  tracking: {
    async track(trackingId) {
      const res = await fetch(`${API_BASE}/tracking/${encodeURIComponent(trackingId)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Tracking ID not found');
      return json.data;
    },
  },

  // ── Reports (Super User) ───────────────────────────────────────────────────
  reports: {
    async getRevenue() {
      const res = await apiFetch('/reports/revenue');
      return res.data;
    },
    async getOperations() {
      const res = await apiFetch('/reports/operations');
      return res.data;
    },
    async getPayments(limit = 100) {
      const res = await apiFetch(`/reports/payments?limit=${limit}`);
      return res.data || [];
    },
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: {
    async getAll() {
      const res = await apiFetch('/expenses');
      return res.data || [];
    },
    async create(data) {
      const res = await apiFetch('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    async remove(id) {
      const res = await apiFetch(`/expenses/${id}`, {
        method: 'DELETE',
      });
      return res.message;
    },
  },

  // ── Notifications ───────────────────────────────────────────────────────────
  notifications: {
    async getAll() {
      const res = await apiFetch('/notifications');
      return res.data || [];
    },
    async unreadCount() {
      const res = await apiFetch('/notifications/unread-count');
      return res.data.count;
    },
    async markRead(id) {
      const res = await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      return res.data;
    },
    async markAllRead() {
      const res = await apiFetch('/notifications/read-all', { method: 'PATCH' });
      return res.data;
    },
  },

  // ── Hubs ────────────────────────────────────────────────────────────────────
  hubs: {
    async getAll() {
      const res = await apiFetch('/hubs');
      return res.data || [];
    },
    async getById(id) {
      const res = await apiFetch(`/hubs/${encodeURIComponent(id)}`);
      return res.data;
    },
    async create(data) {
      const res = await apiFetch('/hubs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    async update(id, data) {
      const res = await apiFetch(`/hubs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    async delete(id) {
      return apiFetch(`/hubs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    async getAgentsForHub(hubId) {
      const res = await apiFetch(`/hubs/${encodeURIComponent(hubId)}/agents`);
      return res.data || [];
    },
  },
  // ── Mishaps ───────────────────────────────────────────────────────────────
  mishaps: {
    async getAll() {
      const res = await apiFetch('/orders/mishaps');
      return res.data || [];
    },
  },
};

window.API_BASE = API_BASE;
window.API = window.API || {};
window.API.Token = Token;
export default API;
