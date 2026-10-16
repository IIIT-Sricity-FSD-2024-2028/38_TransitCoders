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

const STORAGE_KEY = 'swifttrack_agent_orders_v1';

const initialOrders = [
    {
        id: "ORD-9281",
        customer: "Rahul Sharma",
        phone: "+91 98765 43210",
        origin: "Hub Central, Zone 4",
        destination: "45 MG Road, Indiranagar, Bengaluru",
        status: "in-transit",
        priority: "High",
        eta: "25 mins",
        amount: "₹450",
        distance: "3.1 km"
    },
    {
        id: "ORD-9282",
        customer: "Priya Nair",
        phone: "+91 91234 56789",
        origin: "Hub North, Koramangala",
        destination: "12 Palm Grove, HSR Layout, Bengaluru",
        status: "pending",
        priority: "Medium",
        eta: "50 mins",
        amount: "₹280",
        distance: "5.4 km"
    },
    {
        id: "ORD-9280",
        customer: "Vikram Das",
        phone: "+91 99887 66554",
        origin: "Hub Central, Zone 4",
        destination: "8th Cross, Malleshwaram",
        status: "delivered",
        priority: "Standard",
        eta: "Delivered",
        amount: "₹320",
        distance: "6.0 km"
    }
];

export default function AgentLayout() {
    const currentUser = (() => {
        try {
            const saved = localStorage.getItem("user");
            if (saved) {
                const u = JSON.parse(saved);
                return {
                    name: u.name || "Agent",
                    role: "Delivery Agent"
                };
            }
        } catch (e) {
            console.warn('[AgentLayout] Error parsing user:', e);
        }
        return { name: "JS", role: "Delivery Agent" };
    })();

    // Load initial state from LocalStorage or fall back to default loads
    const [orders, setOrders] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.warn('[AgentLayout] Error reading localStorage:', e);
        }
        return initialOrders;
    });

    const [acceptModalOrder, setAcceptModalOrder] = useState(null);
    const [confirmModalOrder, setConfirmModalOrder] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // Save orders to localStorage on any state change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        } catch (e) {
            console.warn('[AgentLayout] Error saving orders to localStorage:', e);
        }
    }, [orders]);

    // Fetch live backend orders on mount
    const fetchBackendOrders = useCallback(async () => {
        try {
            const backendOrders = await API.orders.getAll();
            if (Array.isArray(backendOrders) && backendOrders.length > 0) {
                setOrders(prev => {
                    const localMap = new Map(prev.map(o => [o.id, o]));
                    
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

                        const orderKey = bo.orderId || bo.id;

                        // Only merge if not already tracked locally or update status
                        if (!localMap.has(orderKey)) {
                            localMap.set(orderKey, {
                                id: orderKey,
                                rawId: bo.id,
                                customer: bo.customerName || bo.recipientName || bo.customer || 'Customer',
                                phone: bo.customerPhone || bo.recipientPhone || bo.phone || '+91 98765 00000',
                                origin: bo.pickupAddress || bo.origin || 'Central Hub, Zone 4',
                                destination: bo.deliveryAddress || bo.destination || 'Indiranagar, Bengaluru',
                                status: mappedStatus,
                                priority: bo.priority || 'Standard',
                                eta: mappedStatus === 'delivered' ? 'Delivered' : mappedStatus === 'in-transit' ? '30 mins' : 'Pending',
                                amount: bo.amount ? `₹${bo.amount}` : '₹350',
                                distance: bo.distance || '4.5 km'
                            });
                        }
                    });

                    return Array.from(localMap.values());
                });
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
        // Optimistic UI update
        setOrders(prev =>
            prev.map(o => (o.id === orderId ? { ...o, status: 'in-transit', eta: '25 mins' } : o))
        );
        showToast(`Order #${orderId} accepted! Marked as In-Transit.`);

        // Sync with backend API
        try {
            await API.orders.updateStatus(orderId, 'InTransit').catch(() => 
                API.orders.updateStatus(orderId, 'PickedUp')
            );
        } catch (err) {
            console.warn('[handleConfirmAccept] Backend status update notice:', err?.message || err);
        }
    };

    // Handle confirming delivery with OTP and optional PoD photo
    const handleConfirmDelivery = async (orderId, details = {}) => {
        // Optimistic UI update
        setOrders(prev =>
            prev.map(o => (o.id === orderId ? { 
                ...o, 
                status: 'delivered', 
                eta: 'Delivered',
                deliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                verifiedOtp: details.otp || true
            } : o))
        );
        showToast(`Order #${orderId} delivered and verified successfully!`);

        // Sync with backend
        try {
            // Upload proof photo if attached
            if (details.photo) {
                await API.agents.uploadPhoto(orderId, details.photo).catch(e => {
                    console.warn('[handleConfirmDelivery] PoD photo upload notice:', e?.message || e);
                });
            }
            // Update status on backend
            await API.orders.updateStatus(orderId, 'Delivered').catch(e => {
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
                />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-100">
                    <Outlet context={{ 
                        orders, 
                        setOrders, 
                        setAcceptModalOrder, 
                        setConfirmModalOrder,
                        refreshOrders: fetchBackendOrders,
                        showToast
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
