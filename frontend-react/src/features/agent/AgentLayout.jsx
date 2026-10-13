import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';

import { 
    Speedometer2, 
    BoxSeam, 
    ClockHistory, 
    ExclamationTriangle, 
    Person 
} from 'react-bootstrap-icons';

import AcceptDeliveryModal from '../../components/agent/AcceptDeliveryModal';
import ConfirmDeliveryModal from '../../components/agent/ConfirmDeliveryModal';

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
        eta: "Completed",
        amount: "₹320",
        distance: "6.0 km"
    }
];

export default function AgentLayout() {
    const currentUser = {
        name: "JS",
        role: "Delivery Agent"
    };

    const [orders, setOrders] = useState(initialOrders);
    const [acceptModalOrder, setAcceptModalOrder] = useState(null);
    const [confirmModalOrder, setConfirmModalOrder] = useState(null);

    const handleConfirmAccept = (orderId) => {
        setOrders(prev =>
            prev.map(o => (o.id === orderId ? { ...o, status: 'in-transit' } : o))
        );
    };

    const handleConfirmDelivery = (orderId) => {
        setOrders(prev =>
            prev.map(o => (o.id === orderId ? { ...o, status: 'delivered', eta: 'Delivered' } : o))
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar user={currentUser}>
                <SidebarItem icon={<Speedometer2 size={20} />} text="Dashboard" to="/agent/dashboard" />
                <SidebarItem icon={<BoxSeam size={20} />} text="My Deliveries" to="/agent/worklist" />
                <SidebarItem icon={<ClockHistory size={20} />} text="Delivery History" to="/agent/history" />
                <SidebarItem icon={<ExclamationTriangle size={20} />} text="Report Issue" to="/agent/report-issue" />
                <SidebarItem icon={<Person size={20} />} text="Profile" to="/agent/profile" />
            </Sidebar>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-100">
                    <Outlet context={{ orders, setAcceptModalOrder, setConfirmModalOrder }} />
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

