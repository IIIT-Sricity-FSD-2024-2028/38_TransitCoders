/**
 * Admin Hub Manager — LocalStorage Abstraction API
 * Loads JSON seed data on first visit, then all CRUD via localStorage.
 */
const AdminStorage = {
    async init() {
        const files = ['orders', 'agents', 'transfers', 'complaints', 'reports'];
        for (const file of files) {
            const key = 'admin_' + file;
            if (!localStorage.getItem(key)) {
                try {
                    const res = await fetch('data/' + file + '.json');
                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem(key, JSON.stringify(data));
                    }
                } catch (e) {
                    console.error('Failed to load seed data for: ' + file, e);
                }
            }
        }
    },

    _save(key, data) {
        localStorage.setItem('admin_' + key, JSON.stringify(data));
    },

    _get(key) {
        return JSON.parse(localStorage.getItem('admin_' + key)) || [];
    },

    // Orders
    getOrders() { return this._get('orders'); },
    addOrder(order) {
        const orders = this.getOrders();
        orders.push(order);
        this._save('orders', orders);
    },
    updateOrder(id, updated) {
        let orders = this.getOrders();
        orders = orders.map(o => o.id === id ? { ...o, ...updated } : o);
        this._save('orders', orders);
    },
    deleteOrder(id) {
        let orders = this.getOrders();
        orders = orders.filter(o => o.id !== id);
        this._save('orders', orders);
    },

    // Agents
    getAgents() { return this._get('agents'); },
    updateAgent(id, updated) {
        let agents = this.getAgents();
        agents = agents.map(a => a.id === id ? { ...a, ...updated } : a);
        this._save('agents', agents);
    },

    // Transfers
    getTransfers() { return this._get('transfers'); },
    addTransfer(transfer) {
        const transfers = this.getTransfers();
        transfers.push(transfer);
        this._save('transfers', transfers);
    },
    updateTransfer(id, updated) {
        let transfers = this.getTransfers();
        transfers = transfers.map(t => t.id === id ? { ...t, ...updated } : t);
        this._save('transfers', transfers);
    },
    deleteTransfer(id) {
        let transfers = this.getTransfers();
        transfers = transfers.filter(t => t.id !== id);
        this._save('transfers', transfers);
    },

    // Complaints
    getComplaints() { return this._get('complaints'); },
    updateComplaint(id, updated) {
        let complaints = this.getComplaints();
        complaints = complaints.map(c => c.id === id ? { ...c, ...updated } : c);
        this._save('complaints', complaints);
    },
    deleteComplaint(id) {
        let complaints = this.getComplaints();
        complaints = complaints.filter(c => c.id !== id);
        this._save('complaints', complaints);
    },

    // Reports
    getReports() { return this._get('reports'); }
};
