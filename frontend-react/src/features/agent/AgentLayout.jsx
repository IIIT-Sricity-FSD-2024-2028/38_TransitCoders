import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import {
  BoxSeam,
  ClockHistory,
  ExclamationTriangle,
  Person,
  Speedometer2,
} from 'react-bootstrap-icons';
import AcceptDeliveryModal from '../../components/agent/AcceptDeliveryModal';
import ConfirmDeliveryModal from '../../components/agent/ConfirmDeliveryModal';
import AgentStatusBadge from '../../components/agent/AgentStatusBadge';
import { useEffect } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { useAgentPortal } from './useAgentPortal';
import { resetAgentState } from './agentSlice';

export default function AgentLayout() {
    const dispatch = useAppDispatch();
    // Leaving the agent portal drops transient modal/banner state so it can't reappear later.
    useEffect(() => () => { dispatch(resetAgentState()); }, [dispatch]);
    const {
        user,
        agent,
        loadError,
        profileError,
        actionError,
        notice,
        busyOrderId,
        savingAvailability,
        acceptModalOrder,
        confirmModalOrder,
        saveAvailability,
        updateOrder,
        closeAccept,
        closeConfirm,
    } = useAgentPortal();

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar user={{ ...(user || {}), role: 'Delivery Agent' }}>
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
                    <Outlet />
                </main>
            </div>
            {acceptModalOrder && (
                <AcceptDeliveryModal isOpen order={acceptModalOrder} busy={Boolean(busyOrderId)} error={actionError}
                    onClose={closeAccept}
                    onConfirmAccept={async () => {
                        if (await updateOrder(acceptModalOrder, 'PickedUp')) closeAccept();
                    }}
                />
            )}
            {confirmModalOrder && (
                <ConfirmDeliveryModal isOpen order={confirmModalOrder} busy={Boolean(busyOrderId)} error={actionError}
                    onClose={closeConfirm}
                    onConfirmDelivery={async photo => {
                        if (await updateOrder(confirmModalOrder, 'Delivered', photo)) closeConfirm();
                    }}
                />
            )}
        </div>
    );
}
