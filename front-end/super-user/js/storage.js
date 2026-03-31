/**
 * LocalStorage Abstraction API
 * Refactored surgically to use the UNIFIED central state (swifttrack_central_state).
 */

const StorageAPI = {
    async init() {
        // AppState in state.js handles the initial seeding if localStorage is empty.
        // We just ensure the handshake is established.
        if (!window.AppState) {
            console.warn("StorageAPI: window.AppState not found. Central sync may fail.");
        }
    },

    _getCentral() {
        if (window.AppState) return window.AppState.getState();
        const raw = localStorage.getItem('swifttrack_central_state');
        return raw ? JSON.parse(raw) : { users: [], orders: [], suComplaints: [], feedback: [], roles: [], zones: [], hubs: [] };
    },

    _saveCentral(state) {
        if (window.AppState) {
            window.AppState.saveState(state);
        } else {
            localStorage.setItem('swifttrack_central_state', JSON.stringify(state));
            window.dispatchEvent(new Event('appStateChanged'));
        }
    },

    // Getters redirected to central state
    getUsers() { return this._getCentral().users || []; },
    getOrders() { return this._getCentral().orders || []; },
    getComplaints() { return this._getCentral().suComplaints || []; },
    getFeedback() { return this._getCentral().feedback || []; },
    getRoles() { return this._getCentral().roles || []; },
    getZones() { return this._getCentral().zones || []; },
    getHubs() { return this._getCentral().hubs || []; },
    getSecurityLogs() { return this._getCentral().securityLogs || []; },

    // Mutators (Surgical Updates to Central State)
    addUser(user) {
        const s = this._getCentral();
        user.id = "USR-" + Math.floor(1000 + Math.random() * 9000);
        user.user_id = user.id;
        user.lastLogin = "Never";
        s.users.push(user);
        this._saveCentral(s);
    },
    updateUser(id, updated) {
        const s = this._getCentral();
        s.users = s.users.map(u => (u.id === id || u.user_id === id) ? { ...u, ...updated } : u);
        this._saveCentral(s);
    },
    deleteUser(id) {
        const s = this._getCentral();
        s.users = s.users.filter(u => u.id !== id && u.user_id !== id);
        this._saveCentral(s);
    },

    updateRolePermissions(roleName, permissions) {
        const s = this._getCentral();
        s.roles = s.roles.map(r => r.name === roleName ? { ...r, permissions } : r);
        this._saveCentral(s);
    },

    updateComplaintStatus(id, newStatus) {
        const s = this._getCentral();
        s.suComplaints = s.suComplaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
        this._saveCentral(s);
    },

    updateFeedbackStatus(id, newStatus) {
        const s = this._getCentral();
        s.feedback = s.feedback.map(f => f.id === id ? { ...f, status: newStatus } : f);
        this._saveCentral(s);
    },

    addZone(zone) {
        const s = this._getCentral();
        zone.id = "ZN-" + (s.zones.length + 1).toString().padStart(2, '0');
        s.zones.push(zone);
        this._saveCentral(s);
    },
    updateZone(id, updated) {
        const s = this._getCentral();
        s.zones = s.zones.map(z => z.id === id ? { ...z, ...updated } : z);
        this._saveCentral(s);
    },
    deleteZone(id) {
        const s = this._getCentral();
        s.zones = s.zones.filter(z => z.id !== id);
        this._saveCentral(s);
    },

    _addSecurityLog(msg) {
        const s = this._getCentral();
        s.securityLogs.unshift({
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            action: msg,
            user: "Admin",
            ip: "192.168.1.1",
            status: "Success"
        });
        if (s.securityLogs.length > 50) s.securityLogs.pop();
        this._saveCentral(s);
    }
};
