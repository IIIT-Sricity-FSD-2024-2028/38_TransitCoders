/**
 * LocalStorage Abstraction API
 * Fetches JSON seed data seamlessly on initial load.
 */

const StorageAPI = {
    // Top level initialization run by every page before booting
    async init() {
        const files = ['users', 'complaints', 'feedback', 'roles', 'zones'];
        for (const file of files) {
            if (!localStorage.getItem(file)) {
                try {
                    const res = await fetch(`data/${file}.json`);
                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem(file, JSON.stringify(data));
                    }
                } catch(e) {
                    console.error("Failed to load mock JSON data for: " + file, e);
                }
            }
        }
    },

    _save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Getters
    getUsers() { return JSON.parse(localStorage.getItem('users')) || []; },
    getComplaints() { return JSON.parse(localStorage.getItem('complaints')) || []; },
    getFeedback() { return JSON.parse(localStorage.getItem('feedback')) || []; },
    getRoles() { return JSON.parse(localStorage.getItem('roles')) || []; },
    getZones() { return JSON.parse(localStorage.getItem('zones')) || []; },

    // Users Mutators
    addUser(user) {
        user.id = "USR-" + Math.floor(1000 + Math.random() * 9000);
        user.lastLogin = "Never";
        const users = this.getUsers();
        users.push(user);
        this._save("users", users);
    },
    updateUser(id, updated) {
        let users = this.getUsers();
        users = users.map(u => u.id === id ? { ...u, ...updated } : u);
        this._save("users", users);
    },
    deleteUser(id) {
        let users = this.getUsers();
        users = users.filter(u => u.id !== id);
        this._save("users", users);
    },

    // Roles Mutators
    updateRolePermissions(roleName, permissions) {
        let roles = this.getRoles();
        roles = roles.map(r => r.name === roleName ? { ...r, permissions } : r);
        this._save("roles", roles);
    },

    // Complaints Mutators
    updateComplaintStatus(id, newStatus) {
        let comps = this.getComplaints();
        comps = comps.map(c => c.id === id ? { ...c, status: newStatus } : c);
        this._save("complaints", comps);
    },

    // Feedback Mutators
    updateFeedbackStatus(id, newStatus) {
        let fb = this.getFeedback();
        fb = fb.map(f => f.id === id ? { ...f, status: newStatus } : f);
        this._save("feedback", fb);
    }
};
