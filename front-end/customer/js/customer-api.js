/**
 * Customer API Wrapper
 * Abstracts data fetching. In a full backend integration, these would map directly 
 * to window.API calls. For now, it gracefully falls back to window.AppState if the API fails.
 */

window.CustomerAPI = {
  getCurrentUser: () => {
    try { return JSON.parse(sessionStorage.getItem("user")); }
    catch (_) { return null; }
  },

  async getOrders() {
    const user = this.getCurrentUser();
    if (!user) return [];

    try {
      if (window.API && window.API.orders) {
        const res = await window.API.orders.getAll();
        if (res) return res.filter(o => o.customer_name === user.name || o.customerId === user.user_id);
      }
    } catch (e) { console.warn("API fallback to AppState for orders"); }

    // Fallback to state
    if (window.AppState) {
      const state = window.AppState.getState();
      return state.orders.filter(o => o.customer_name === user.name || o.customerId === user.user_id)
                         .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return [];
  },

  async getComplaints() {
    const user = this.getCurrentUser();
    if (!user) return [];

    try {
      if (window.API && window.API.complaints) {
        const res = await window.API.complaints.getAll();
        if (res && res.length) return res.filter(c => c.customer === user.name || c.userId === user.user_id);
      }
    } catch (e) { console.warn("API fallback to AppState for complaints"); }

    if (window.AppState) {
      const state = window.AppState.getState();
      return state.complaints.filter(c => c.customer === user.name || c.userId === user.user_id)
                             .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }
    return [];
  },

  async getFeedback() {
    const user = this.getCurrentUser();
    if (!user) return [];

    if (window.AppState) {
      const state = window.AppState.getState();
      return state.feedback.filter(f => f.customer === user.name || f.userId === user.user_id)
                           .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }
    return [];
  },

  async submitComplaint(data) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const payload = {
      id: 'CMP-' + Math.floor(Math.random() * 10000),
      customer: user.name,
      userId: user.id,
      date: new Date().toISOString(),
      status: 'Open',
      ...data
    };

    if (window.AppState) {
      const state = window.AppState.getState();
      state.complaints.push(payload);
      window.AppState.saveState(state);
      return { success: true, data: payload };
    }
    throw new Error("State manager not found");
  },

  async submitFeedback(data) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const payload = {
      id: 'FB-' + Math.floor(Math.random() * 10000),
      customer: user.name,
      userId: user.id,
      date: new Date().toISOString(),
      status: 'Pending',
      ...data
    };

    if (window.AppState) {
      const state = window.AppState.getState();
      state.feedback.push(payload);
      window.AppState.saveState(state);
      return { success: true, data: payload };
    }
    throw new Error("State manager not found");
  }
};
