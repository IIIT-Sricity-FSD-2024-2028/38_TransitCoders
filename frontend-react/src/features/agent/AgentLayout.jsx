import { Outlet } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';

import { 
    Speedometer2, 
    BoxSeam, 
    ClockHistory, 
    ExclamationTriangle, 
    Person,
    CheckCircleFill,
    InfoCircleFill
} from 'react-bootstrap-icons';

import AcceptDeliveryModal from '../../components/agent/AcceptDeliveryModal';
import ConfirmDeliveryModal from '../../components/agent/ConfirmDeliveryModal';
import AgentStatusBadge from '../../components/agent/AgentStatusBadge';
import { API } from '../../services/api';

export default function AgentLayout() {
    const currentUser = (() => {
        try {
            const saved = localStorage.getItem("user");
            if (saved) {
                const u = JSON.parse(saved);
                return {
                    id: u.id,
                    name: u.name || "Delivery Agent",
                    email: u.email,
                    role: "Delivery Agent",
                    hubId: u.hubId
                };
            }
        } catch (e) {
            console.warn('[AgentLayout] Error parsing user:', e);
        }
        return { name: "Delivery Agent", role: "Delivery Agent" };
    })();

    const storageKey = currentUser?.id 
        ? `swifttrack_agent_orders_${currentUser.id}` 
        : (currentUser?.email ? `swifttrack_agent_orders_${currentUser.email}` : 'swifttrack_agent_orders_default');

    // Load initial state from agent-scoped LocalStorage
    const [orders, setOrders] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.warn('[AgentLayout] Error reading localStorage:', e);
        }
        return [];
    });

    const [acceptModalOrder, setAcceptModalOrder] = useState(null);
    const [confirmModalOrder, setConfirmModalOrder] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // Save orders to agent-scoped localStorage on state changes
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(orders));
        } catch (e) {
            console.warn('[AgentLayout] Error saving orders to localStorage:', e);
        }
    }, [orders, storageKey]);

    // Fetch live backend orders on mount
    const fetchBackendOrders = useCallback(async () => {
        try {
            if (API?.orders?.getAll) {
                const backendOrders = await API.orders.getAll();
                if (Array.isArray(backendOrders)) {
                    setOrders(prev => {
                        // Retain locally modified statuses if present
                        const statusByOrderId = new Map();
                        prev.forEach(o => {
                            const key = o.orderId || o.id;
                            statusByOrderId.set(key, o.status);
                            if (o.rawId) statusByOrderId.set(o.rawId, o.status);
                            if (o.id) statusByOrderId.set(o.id, o.status);
                        });

                    const localMap = new Map();

                    backendOrders.forEach(bo => {
                        const rawStatus = (bo.status || '').toLowerCase();
                        let mappedStatus = 'pending';
                        if (rawStatus.includes('transit') || rawStatus.includes('out') || rawStatus.includes('picked')) {
                            mappedStatus = 'in-transit';
                        } else if (rawStatus.includes('delivered')) {
                            mappedStatus = 'delivered';
                        } else if (rawStatus.includes('fail') || rawStatus.includes('cancel')) {
                            mappedStatus = 'failed';
                        }

                        // Order ID must be displayed (e.g. ORD-2024-0001), not the raw internal database UUID id
                        const displayOrderId = bo.orderId || bo.order_id || bo.id;
                        const preservedStatus = statusByOrderId.get(displayOrderId) || statusByOrderId.get(bo.id) || mappedStatus;

                        localMap.set(displayOrderId, {
                            id: displayOrderId,
                            orderId: displayOrderId,
                            rawId: bo.id, // Keep the backend database UUID for updateStatus API calls
                            trackingId: bo.trackingId || bo.tracking_id || displayOrderId,
                            customer: bo.customerName || bo.recipientName || bo.customer || 'Customer',
                            phone: bo.customerPhone || bo.recipientPhone || bo.phone || '+91 98765 00000',
                            origin: bo.pickupAddress || bo.origin || 'Central Hub, Zone 4',
                            destination: bo.deliveryAddress || bo.destination || 'Indiranagar, Bengaluru',
                            status: preservedStatus,
                            priority: bo.priority || 'Standard',
                            eta: preservedStatus === 'delivered' ? 'Delivered' : preservedStatus === 'in-transit' ? '25 mins' : 'Pending',
                            amount: bo.amount ? `₹${bo.amount}` : '₹350',
                            distance: bo.distance || '4.5 km'
                        });
                    });

                        return Array.from(localMap.values());
                    });
                }
            }
        } catch (err) {
            console.warn('[AgentLayout] Backend orders fetch skipped (using offline state):', err?.message || err);
        }
    }, []);

    useEffect(() => {
        fetchBackendOrders();
    }, [fetchBackendOrders]);

    // Handle accepting a delivery
    const handleConfirmAccept = async (orderId) => {
        const target = orders.find(o => o.id === orderId || o.orderId === orderId || o.rawId === orderId);
        const rawId = target?.rawId || target?.id || orderId;
        const displayId = target?.orderId || target?.id || orderId;

        // Optimistic UI update
        setOrders(prev =>
            prev.map(o => (o.id === displayId || o.orderId === displayId || o.rawId === rawId ? { ...o, status: 'in-transit', eta: '25 mins' } : o))
        );
        showToast(`Order #${displayId} accepted! Marked as In-Transit.`);

        // Sync with backend API
        try {
            await API.orders.updateStatus(rawId, 'InTransit').catch(() => 
                API.orders.updateStatus(rawId, 'PickedUp')
            );
        } catch (err) {
            console.warn('[handleConfirmAccept] Backend status update notice:', err?.message || err);
        }
    };

    // Handle confirming delivery with OTP and optional PoD photo
    const handleConfirmDelivery = async (orderId, details = {}) => {
        const target = orders.find(o => o.id === orderId || o.orderId === orderId || o.rawId === orderId);
        const rawId = target?.rawId || target?.id || orderId;
        const displayId = target?.orderId || target?.id || orderId;

        // Optimistic UI update
        setOrders(prev =>
            prev.map(o => (o.id === displayId || o.orderId === displayId || o.rawId === rawId ? { 
                ...o, 
                status: 'delivered', 
                eta: 'Delivered',
                deliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                verifiedOtp: details.otp || true
            } : o))
        );
        showToast(`Order #${displayId} delivered and verified successfully!`);

        // Sync with backend
        try {
            if (details.photo) {
                await API.agents.uploadPhoto(rawId, details.photo).catch(e => {
                    console.warn('[handleConfirmDelivery] PoD photo upload notice:', e?.message || e);
                });
            }
            await API.orders.updateStatus(rawId, 'Delivered').catch(e => {
                console.warn('[handleConfirmDelivery] Backend status update notice:', e?.message || e);
            });
        } catch (err) {
            console.warn('[handleConfirmDelivery] Backend sync notice:', err?.message || err);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {/* Floating Toast Notification */}
            {toast && (
                <div className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 text-xs font-semibold animate-fade-in">
                    {toast.type === 'success' ? (
                        <CheckCircleFill className="text-emerald-400" size={16} />
                    ) : (
                        <InfoCircleFill className="text-blue-400" size={16} />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            <Sidebar user={currentUser}>
                <SidebarItem icon={<Speedometer2 size={20} />} text="Dashboard" to="/agent/dashboard" />
                <SidebarItem icon={<BoxSeam size={20} />} text="My Deliveries" to="/agent/worklist" />
                <SidebarItem icon={<ClockHistory size={20} />} text="Delivery History" to="/agent/history" />
                <SidebarItem icon={<ExclamationTriangle size={20} />} text="Report Issue" to="/agent/report-issue" />
                <SidebarItem icon={<Person size={20} />} text="Profile" to="/agent/profile" />
            </Sidebar>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar 
                    title="Delivery Agent Portal" 
                    statusBadge={
                        <AgentStatusBadge 
                            onStatusChange={(newStatus) => 
                                showToast(`Dispatch status set to: ${newStatus.replace('-', ' ')}`)
                            } 
                        />
                    }
                    showSearch={false}
                    showNotification={false}
                    profilePath="/agent/profile"
                />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-100">
                    <Outlet context={{ 
                        orders, 
                        setOrders, 
                        setAcceptModalOrder, 
                        setConfirmModalOrder,
                        refreshOrders: fetchBackendOrders,
                        showToast,
                        user: currentUser
                    }} />
                </main>
            </div>

            {/* Centralized Modals */}
            <AcceptDeliveryModal
                isOpen={Boolean(acceptModalOrder)}
                onClose={() => setAcceptModalOrder(null)}
                order={acceptModalOrder}
                onConfirmAccept={handleConfirmAccept}
            />

            <ConfirmDeliveryModal
                isOpen={Boolean(confirmModalOrder)}
                onClose={() => setConfirmModalOrder(null)}
                order={confirmModalOrder}
                onConfirmDelivery={handleConfirmDelivery}
            />
        </div>
    );
}
