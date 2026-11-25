import { API } from './api';
import { isActiveOrder, statusKey, statusLabel } from './orderStatus';

const formatDate = value => value
    ? new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

function normalizeOrder(order) {
    return {
        ...order,
        backendId: order.id,
        id: order.orderId || order.id,
        customerName: order.customerName || 'Customer',
        pickupAddress: order.pickupAddress || order.pickupHubId || 'Unavailable',
        deliveryAddress: order.deliveryAddress || 'Unavailable',
        estimatedDelivery: formatDate(order.estimatedDelivery),
        date: formatDate(order.createdAt),
        status: statusLabel(order.status),
        assignedAgent: order.assignedAgent || (order.assignedAgentId ? 'Assigned delivery agent' : 'Unassigned'),
        packageType: order.packageType || 'Package',
        statusHistory: order.statusHistory || [],
    };
}

const normalizeComplaint = complaint => ({ ...complaint, details: complaint.description });
const normalizeFeedback = feedback => ({ ...feedback, comment: feedback.comment || feedback.comments });

export const customerService = {
    async getOrders() {
        return (await API.orders.getAll()).map(normalizeOrder);
    },

    async getDashboardData() {
        const [orders, complaints] = await Promise.all([this.getOrders(), this.getComplaints()]);
        const activeOrders = orders.filter(order => isActiveOrder(order.status));
        return {
            stats: {
                activeShipments: activeOrders.length,
                delivered: orders.filter(order => statusKey(order.status) === 'delivered').length,
                supportTickets: complaints.length,
            },
            activeOrder: activeOrders[0] || null,
            recentOrders: orders.slice(0, 4),
        };
    },

    async getOrderById(id) {
        const query = id.trim();
        const reference = /^(TRK|ORD)-/i.test(query) ? query.toUpperCase() : query;
        try {
            return normalizeOrder(await API.orders.getById(reference));
        } catch (err) {
            if (err.status === 403 || err.status === 404) return null;
            throw err;
        }
    },

    async getComplaints() {
        return (await API.complaints.getAll()).map(normalizeComplaint);
    },

    async confirmReceipt(id) {
        return normalizeOrder(await API.orders.confirmDelivery(id));
    },

    async submitComplaint(data) {
        const order = await this.getOrderById(data.orderId);
        if (!order) throw new Error('Enter the tracking ID or order ID of one of your shipments.');
        return normalizeComplaint(await API.complaints.create({
            ...data,
            orderId: order.trackingId || order.id,
            description: data.details.trim(),
        }));
    },

    async getFeedback() {
        return (await API.feedback.getAll()).map(normalizeFeedback);
    },

    async submitFeedback(data) {
        const order = await this.getOrderById(data.orderId);
        if (!order) throw new Error('Enter the tracking ID or order ID of one of your shipments.');
        return normalizeFeedback(await API.feedback.create({
            ...data,
            orderId: order.trackingId || order.id,
            comment: data.comment.trim(),
        }));
    },
};
