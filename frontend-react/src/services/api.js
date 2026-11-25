import { clearSession, Token } from './session';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

async function request(path, options = {}, authenticated = true) {
  const token = authenticated ? Token.get() : null;
  const headers = new Headers(options.headers);
  if (typeof options.body === 'string') headers.set('Content-Type', 'application/json');
  if (token) headers.set('x-auth-token', token);
  const timeout = AbortSignal.timeout(20_000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...options, headers, signal });
  } catch (err) {
    if (options.signal?.aborted) throw err;
    if (timeout.aborted) throw new Error('SwiftTrack did not respond in time. Try again.', { cause: err });
    throw new Error('Could not connect to SwiftTrack. Check your connection and try again.', { cause: err });
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && token) clearSession(token);
    const message = body.error || body.message || `Request failed (${response.status})`;
    throw Object.assign(new Error(Array.isArray(message) ? message.join(', ') : message), { status: response.status });
  }
  return response;
}

async function apiFetch(path, options, authenticated) {
  return (await request(path, options, authenticated)).json();
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
      }, false);
      return res;
    },
    async register(data) {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }, false);
      return res;
    },
    async me() {
      const res = await apiFetch('/auth/me');
      return res.data;
    },
    async updateProfile(profile) {
      const res = await apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(profile) });
      return res.data;
    },
    async logout() {
      const token = Token.get();
      if (!token) return;
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } finally {
        clearSession(token);
      }
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
      const payload = {
        orderId: data.orderId,
        type: data.type || 'General Issue',
        description: data.description || data.details || data.comment || data.message || '',
        priority: data.priority || 'Medium',
      };
      const res = await apiFetch('/complaints', { method: 'POST', body: JSON.stringify(payload) });
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
      const payload = {
        orderId: data.orderId,
        rating: Number(data.rating),
        comments: data.comments || data.comment || data.feedback || '',
      };
      const res = await apiFetch('/feedback', { method: 'POST', body: JSON.stringify(payload) });
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

  // ── Shipments ──────────────────────────────────────────────────────────────
  shipments: {
    async getAll() {
      const res = await apiFetch('/shipments');
      return res.data || [];
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
      const res = await apiFetch('/orders');
      return res.data || [];
    },
    async getById(id) {
      const res = await apiFetch(`/orders/${encodeURIComponent(id)}`);
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
    async completeDelivery(id, photo) {
      const body = new FormData();
      if (photo) body.append('photo', photo);
      const res = await apiFetch(`/orders/${id}/delivery`, { method: 'PATCH', body });
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
    async scanWarehouse(reference, action, autoAssign) {
      const res = await apiFetch(`/orders/${encodeURIComponent(reference)}/warehouse`, {
        method: 'PATCH', body: JSON.stringify({ action, autoAssign }),
      });
      return res.data;
    },
    async getMessages(id, channel, signal) {
      const res = await apiFetch(`/orders/${encodeURIComponent(id)}/messages/${channel}`, { signal });
      return res.data || [];
    },
    async sendMessage(id, channel, body) {
      const res = await apiFetch(`/orders/${encodeURIComponent(id)}/messages/${channel}`, {
        method: 'POST', body: JSON.stringify({ body }),
      });
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
    async barcode(id, signal) {
      const res = await request(`/orders/${encodeURIComponent(id)}/barcode`, { signal });
      return res.blob();
    },
  },

  // ── Agents ───────────────────────────────────────────────────────────────
  agents: {
    async uploadPhoto(id, file) {
      const body = new FormData();
      body.append('photo', file);
      const res = await apiFetch(`/agents/${encodeURIComponent(id)}/delivery-photo`, { method: 'POST', body });
      return res.data;
    },
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
      const res = await apiFetch(`/tracking/${encodeURIComponent(trackingId.trim().toUpperCase())}`, undefined, false);
      return res.data;
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

export default API;
