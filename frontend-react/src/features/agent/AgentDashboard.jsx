import { useOutletContext } from 'react-router-dom';
import { BoxSeam, ClockHistory, CheckCircle, Truck } from 'react-bootstrap-icons';
import KPICard from '../../components/shared/KPICard';
import OrderCard from '../../components/agent/OrderCard';

export default function AgentDashboard() {
    const { orders, setAcceptModalOrder, setConfirmModalOrder } = useOutletContext();

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const transitCount = orders.filter(o => o.status === 'in-transit').length;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
                <p className="text-gray-500 text-sm">
                    Welcome back! You have <strong className="text-orange-600">{pendingCount + transitCount}</strong> deliveries to attend today.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Assigned"
                    value={orders.length}
                    isicon
                    icon={<BoxSeam size={22} />}
                    color="bg-purple-50 text-purple-600"
                />
                <KPICard
                    title="In Transit"
                    value={transitCount}
                    isicon
                    icon={<Truck size={22} />}
                    color="bg-blue-50 text-blue-600"
                />
                <KPICard
                    title="Pending Pickup"
                    value={pendingCount}
                    isicon
                    icon={<ClockHistory size={22} />}
                    color="bg-amber-50 text-amber-600"
                />
                <KPICard
                    title="Delivered Today"
                    value={deliveredCount}
                    isicon
                    icon={<CheckCircle size={22} />}
                    color="bg-emerald-50 text-emerald-600"
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Urgent & Active Orders</h2>
                    <span className="text-xs text-gray-500">{orders.length} Total loads</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {orders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            onAccept={(clickedOrder) => setAcceptModalOrder(clickedOrder)}
                            onVerify={(clickedOrder) => setConfirmModalOrder(clickedOrder)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

