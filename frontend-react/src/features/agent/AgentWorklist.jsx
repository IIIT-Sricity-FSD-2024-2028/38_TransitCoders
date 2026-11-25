
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderCard from '../../components/agent/OrderCard';
import { useAgentPortal } from './useAgentPortal';

export default function AgentWorklist() {
    const { orders, openAccept, openConfirm, advanceOrder, busyOrderId, refetchOrders } = useAgentPortal();
    const [filter, setFilter] = useState('all');
    const [params, setParams] = useSearchParams();
    const query = params.get('id') || '';

    const term = query.trim().toLowerCase();
    const filteredOrders = orders.filter(order => {
        const matchesStatus = filter === 'all' || order.status === filter;
        return matchesStatus && [order.trackingId, order.orderId, order.customer, order.rawId].some(value => value?.toLowerCase().includes(term));
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
                <button type="button" onClick={refetchOrders} className="self-start rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium">Refresh worklist</button>
            </div>

            <label className="block max-w-sm space-y-1 text-sm font-medium">
                <span>Search or scan a shipment</span>
                <input type="search" value={query} onChange={event => setParams(event.target.value ? { id: event.target.value } : {}, { replace: true })} placeholder="Tracking ID, order ID, or recipient" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
            </label>

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
                                onAccept={openAccept}
                                onVerify={openConfirm}
                                onAdvance={advanceOrder}
                                busy={Boolean(busyOrderId)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

