
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import OrderCard from '../../components/agent/OrderCard';

export default function AgentWorklist() {
    const { orders, setAcceptModalOrder, setConfirmModalOrder } = useOutletContext();
    const [filter, setFilter] = useState('all');

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') {
            return true;
        }

        return order.status === filter;
    });

    const tabs = [
        {
            key: 'all',
            label: 'All Loads',
            count: orders.length
        },
        {
            key: 'pending',
            label: 'Pending',
            count: orders.filter(
                order => order.status === 'pending'
            ).length
        },
        {
            key: 'in-transit',
            label: 'In-Transit',
            count: orders.filter(
                order => order.status === 'in-transit'
            ).length
        },
        {
            key: 'delivered',
            label: 'Delivered',
            count: orders.filter(
                order => order.status === 'delivered'
            ).length
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Today's Worklist</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Review, accept and process your assigned deliveries.
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200/80 pb-3 overflow-x-auto">
                {tabs.map(tab => {
                    const isActive = filter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${isActive
                                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/70 hover:text-gray-900'
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive
                                        ? 'bg-orange-600/70 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Orders Grid */}
            <div>
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                        <p className="text-gray-400 font-medium">No orders in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onAccept={(clickedOrder) => setAcceptModalOrder(clickedOrder)}
                                onVerify={(clickedOrder) => setConfirmModalOrder(clickedOrder)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

