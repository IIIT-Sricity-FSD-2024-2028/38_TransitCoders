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

    let backendOrders = [];
    try {
      if (window.API && window.API.orders) {
        const res = await window.API.orders.getAll();
        if (res) {
          backendOrders = res.map(o => ({
            ...o,
            order_id: o.orderId || o.order_id,
            tracking_id: o.trackingId || o.tracking_id,
            created_at: o.createdAt || o.created_at,
            customer_name: o.customerName || o.customer_name,
            delivery_address: o.deliveryAddress || o.delivery_address,
            package_type: o.packageType || o.package_type
          })).filter(o => o.customer_name === user.name || o.customerId === user.user_id || o.customerId === user.id);
        }
      }
    } catch (e) { console.warn("API fallback to AppState for orders"); }

    let stateOrders = [];
    if (window.AppState) {
      const state = window.AppState.getState();
      stateOrders = state.orders.filter(o => o.customer_name === user.name || o.customerId === user.user_id);
    }

    // Merge and deduplicate by tracking_id or order_id
    const combined = [...backendOrders];
    stateOrders.forEach(so => {
      if (!combined.find(bo => (bo.tracking_id && bo.tracking_id === so.tracking_id) || (bo.order_id && bo.order_id === so.order_id))) {
        combined.push(so);
      }
    });

    return combined.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
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
      customer: user.name,
      userId: user.id || user.user_id,
      date: new Date().toISOString(),
      status: 'Open',
      ...data
    };

    try {
      if (window.API && window.API.complaints) {
        const res = await window.API.complaints.create(payload);
        return { success: true, data: res };
      }
    } catch (e) { console.warn("API fallback to AppState for submitting complaint"); }

    if (window.AppState) {
      payload.id = 'CMP-' + Math.floor(Math.random() * 10000);
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
      customer: user.name,
      userId: user.id || user.user_id,
      date: new Date().toISOString(),
      status: 'Pending',
      ...data
    };

    try {
      if (window.API && window.API.feedback) {
        const res = await window.API.feedback.create(payload);
        return { success: true, data: res };
      }
    } catch (e) { console.warn("API fallback to AppState for submitting feedback"); }

    if (window.AppState) {
      payload.id = 'FB-' + Math.floor(Math.random() * 10000);
      const state = window.AppState.getState();
      state.feedback.push(payload);
      window.AppState.saveState(state);
      return { success: true, data: payload };
    }
    throw new Error("State manager not found");
  }
};
