import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  CurrencyRupee,
  BoxSeam,
  Calendar3,
  GeoAlt,
  ArrowRight,
} from 'react-bootstrap-icons';
import { statusKey } from '../../services/orderStatus';
import { useOrders } from '../../shared/orders/ordersHooks';
import { normalizeCustomerOrder } from './customerSelectors';
import StatusBadge from '../../components/customer/StatusBadge';
import OrderDetailsDrawer from '../../components/customer/OrderDetailsDrawer';

const FILTER_TABS = ['ALL', 'IN TRANSIT', 'DELIVERED', 'PENDING', 'CANCELLED'];

export default function CustomerOrders() {
    const [searchParams] = useSearchParams();
    const targetId = searchParams.get('id') || '';
    const {
        data: rawOrders = [],
        isLoading: loading,
        error: queryError,
    } = useOrders();
    const error = queryError?.message || '';
    const orders = useMemo(() => rawOrders.map(normalizeCustomerOrder), [rawOrders]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [drawerState, setDrawerState] = useState({ param: '', pickedId: null, closed: false });

    const selectedOrder = useMemo(() => {
        const isSameParam = drawerState.param === targetId;
        if (isSameParam && drawerState.pickedId) {
            return orders.find((o) => o.id === drawerState.pickedId || o.trackingId === drawerState.pickedId) || null;
        }
        if (targetId && !(isSameParam && drawerState.closed)) {
            return orders.find((o) => o.id === targetId || o.trackingId === targetId) || null;
        }
        return null;
    }, [orders, drawerState, targetId]);

    const setSelectedOrder = (order) => {
        if (order) {
            setDrawerState({ param: targetId, pickedId: order.id || order.trackingId, closed: false });
        } else {
            setDrawerState({ param: targetId, pickedId: null, closed: true });
        }
    };

    // 2. Filter Orders (Derived State - No extra state needed!)
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch = 
                !term ||
                (order.trackingId && order.trackingId.toLowerCase().includes(term)) ||
                (order.id && order.id.toLowerCase().includes(term)) ||
                (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(term)) ||
                (order.packageType && order.packageType.toLowerCase().includes(term));

            const s = statusKey(order.status);
            let matchesStatus = true;
            if (selectedStatus === 'IN TRANSIT') {
                matchesStatus = ['assigned', 'pickedup', 'intransit', 'outfordelivery'].includes(s);
            } else if (selectedStatus === 'DELIVERED') {
                matchesStatus = s === 'delivered';
            } else if (selectedStatus === 'PENDING') {
                matchesStatus = s === 'pending';
            } else if (selectedStatus === 'CANCELLED') {
                matchesStatus = s === 'cancelled';
            }

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, selectedStatus]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Live tracking, history, and status updates for all your shipments.
                </p>
            </div>

            {error && <p role="alert" className="text-red-700">{error}</p>}

            {/* Search & Filter Bar (Controlled Components & Event Handling) */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                {/* Search Input (Controlled Component) */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 w-full lg:w-96 shadow-xs focus-within:border-orange-500 transition-colors">
                    <Search className="text-gray-400 mr-2 shrink-0" size={16} />
                    <input
                        type="text"
                        placeholder="Search tracking ID, address, or package..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="text-xs text-gray-400 hover:text-gray-600 px-1 cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Filter Category Tabs */}
                <div className="flex flex-wrap gap-2">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSelectedStatus(tab)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                selectedStatus === tab
                                    ? 'bg-orange-500 text-white shadow-xs'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Grid / Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 animate-pulse h-44" />
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-gray-100 text-gray-400">
                    <BoxSeam size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-base font-semibold text-gray-700">No matching orders found</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Try modifying your search term or selecting a different status filter tab.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredOrders.map((order) => {
                        const trackingId = order.trackingId || order.id;

                        return (
                            <div
                                key={order.id || trackingId}
                                onClick={() => setSelectedOrder(order)}
                                className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-bold text-orange-600 group-hover:text-orange-700 transition-colors">
                                            {trackingId}
                                        </span>
                                        <StatusBadge status={order.status} />
                                    </div>

                                    <div className="flex items-start gap-2 text-xs text-gray-600">
                                        <GeoAlt className="text-gray-400 mt-0.5 shrink-0" size={14} />
                                        <p className="line-clamp-2 leading-relaxed">{order.deliveryAddress}</p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                                        <BoxSeam size={13} className="shrink-0" />
                                        <span>{order.packageType}</span>
                                        <span>&bull;</span>
                                        <span className="capitalize">{order.serviceLevel}</span>
                                    </div>
                                </div>

                                <div className="pt-3 mt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <Calendar3 size={12} className="text-gray-400" />
                                        <span>{order.date}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 flex items-center text-sm">
                                            <CurrencyRupee size={14} />{order.amount}
                                        </span>
                                        <span className="text-orange-500 group-hover:translate-x-0.5 transition-transform">
                                            <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Day 3 Component: Order Details Drawer (Parent-Child Communication) */}
            <OrderDetailsDrawer 
                order={selectedOrder} 
                onClose={() => setSelectedOrder(null)} 
            />
        </div>
    );
}
