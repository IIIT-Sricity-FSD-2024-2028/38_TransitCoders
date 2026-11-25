import { Outlet } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { BoxSeam, ClockHistory, ExclamationTriangle, Person, Speedometer2 } from 'react-bootstrap-icons';
import AcceptDeliveryModal from '../../components/agent/AcceptDeliveryModal';
import ConfirmDeliveryModal from '../../components/agent/ConfirmDeliveryModal';
import AgentStatusBadge from '../../components/agent/AgentStatusBadge';
import { API } from '../../services/api';
import { getSessionUser, saveSession, Token } from '../../services/session';
import { statusLabel } from '../../services/orderStatus';

const nextMilestone = {
    PickedUp: 'InTransit',
    InTransit: 'OutForDelivery',
};

function mapOrder(order) {
    const status = {
        Assigned: 'pending', PickedUp: 'in-transit', InTransit: 'in-transit',
        OutForDelivery: 'in-transit', Delivered: 'delivered', Failed: 'failed',
        Cancelled: 'cancelled', Returned: 'returned',
    }[order.status] || 'pending';
    const deliveredAt = order.statusHistory?.find(event => event.status === 'Delivered')?.timestamp;
    return {
        id: order.orderId || order.id,
        orderId: order.orderId || order.id,
        rawId: order.id,
        trackingId: order.trackingId,
        customer: order.customerName,
        phone: order.customerPhone,
        origin: order.pickupAddress || order.pickupHubId || 'Pickup unavailable',
        destination: order.deliveryAddress,
        status,
        backendStatus: order.status,
        awaitingHandoff: Boolean(order.warehouse && !order.warehouse.checkedOutAt),
        pickupHubId: order.pickupHubId,
        priority: order.priority,
        eta: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString('en-IN') : '—',
        amount: order.amount == null ? '—' : `₹${order.amount}`,
        distance: order.distance || '—',
        deliveredAt,
        createdAt: order.createdAt,
        statusHistory: order.statusHistory || [],
    };
}

export default function AgentLayout() {
    const [currentUser, setCurrentUser] = useState(getSessionUser);
    const userId = currentUser.id;
    const [orders, setOrders] = useState([]);
    const [agent, setAgent] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [profileError, setProfileError] = useState('');
    const [actionError, setActionError] = useState('');
    const [notice, setNotice] = useState('');
    const [acceptModalOrder, setAcceptModalOrder] = useState(null);
    const [confirmModalOrder, setConfirmModalOrder] = useState(null);
    const [busyOrder, setBusyOrder] = useState(null);
    const [savingAvailability, setSavingAvailability] = useState(false);

    const refreshOrders = useCallback(async () => {
        try {
            const data = await API.agents.getWorklist(userId);
            setOrders(data.map(mapOrder));
            setLoadError('');
        } catch (err) {
            setLoadError(err.message);
        }
    }, [userId]);

    useEffect(() => {
        let active = true;
        API.agents.getWorklist(userId).then(data => {
            if (active) setOrders(data.map(mapOrder));
        }, err => {
            if (active) setLoadError(err.message);
        });
        API.agents.getProfile(userId).then(data => {
            if (active) setAgent(data);
        }, err => {
            if (active) setProfileError(err.message);
        });
        return () => { active = false; };
    }, [userId]);

    async function saveAvailability(status) {
        if (savingAvailability || status === agent?.availabilityStatus) return;
        setSavingAvailability(true);
        setProfileError('');
        try {
            const updated = await API.agents.updateAvailability(userId, status);
            setAgent(updated);
            setNotice(`Availability updated to ${updated.availabilityStatus}.`);
        } catch (err) {
            setProfileError(err.message);
        } finally {
            setSavingAvailability(false);
        }
    }

    async function saveProfile(profile) {
        const token = Token.get();
        const updated = await API.auth.updateProfile(profile);
        if (Token.get() !== token) return;
        saveSession(token, updated);
        setCurrentUser(updated);
        setNotice('Profile updated.');
    }

    async function updateOrder(order, status, photo) {
        if (busyOrder) return false;
        setBusyOrder(order.rawId);
        setActionError('');
        setNotice('');
        try {
            const updated = status === 'Delivered'
                ? await API.orders.completeDelivery(order.rawId, photo)
                : await API.orders.updateStatus(order.rawId, status);
            setOrders(previous => previous.map(item => item.rawId === updated.id ? mapOrder(updated) : item));
            setNotice(`${order.orderId} · ${statusLabel(updated.status)}`);
            return true;
        } catch (err) {
            setActionError(err.message);
            if (!acceptModalOrder && !confirmModalOrder) await refreshOrders();
            return false;
        } finally {
            setBusyOrder(null);
        }
    }

    function openAccept(order) {
        setActionError('');
        setAcceptModalOrder(order);
    }

    function openConfirm(order) {
        setActionError('');
        setConfirmModalOrder(order);
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar user={{ ...currentUser, role: 'Delivery Agent' }}>
                <SidebarItem icon={<Speedometer2 size={20} />} text="Dashboard" to="/agent/dashboard" />
                <SidebarItem icon={<BoxSeam size={20} />} text="My Deliveries" to="/agent/worklist" />
                <SidebarItem icon={<ClockHistory size={20} />} text="Delivery History" to="/agent/history" />
                <SidebarItem icon={<ExclamationTriangle size={20} />} text="Report Issue" to="/agent/report-issue" />
                <SidebarItem icon={<Person size={20} />} text="Profile" to="/agent/profile" />
            </Sidebar>
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar
                    title="Delivery Agent Portal"
                    statusBadge={agent && <AgentStatusBadge status={agent.availabilityStatus} onStatusChange={saveAvailability} saving={savingAvailability} />}
                    profilePath="/agent/profile"
                    notificationOrderPath={id => `/agent/worklist?id=${encodeURIComponent(id)}`}
                />
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-8">
                    {(loadError || profileError || (actionError && !acceptModalOrder && !confirmModalOrder)) && (
                        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError || profileError || actionError}</p>
                    )}
                    {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
                    <Outlet context={{
                        orders, user: currentUser, agent, savingAvailability, saveAvailability, saveProfile, busyOrder, refreshOrders,
                        setAcceptModalOrder: openAccept, setConfirmModalOrder: openConfirm,
                        advanceOrder: order => updateOrder(order, nextMilestone[order.backendStatus]),
                    }} />
                </main>
            </div>
            {acceptModalOrder && (
                <AcceptDeliveryModal isOpen order={acceptModalOrder} busy={Boolean(busyOrder)} error={actionError}
                    onClose={() => { setActionError(''); setAcceptModalOrder(null); }}
                    onConfirmAccept={async () => {
                        if (await updateOrder(acceptModalOrder, 'PickedUp')) setAcceptModalOrder(null);
                    }}
                />
            )}
            {confirmModalOrder && (
                <ConfirmDeliveryModal isOpen order={confirmModalOrder} busy={Boolean(busyOrder)} error={actionError}
                    onClose={() => { setActionError(''); setConfirmModalOrder(null); }}
                    onConfirmDelivery={async photo => {
                        if (await updateOrder(confirmModalOrder, 'Delivered', photo)) setConfirmModalOrder(null);
                    }}
                />
            )}
        </div>
    );
}
