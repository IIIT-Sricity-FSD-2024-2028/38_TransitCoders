
import { useState } from 'react';
import OrderCard from '../../components/agent/OrderCard';

const mockOrders = [
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
    id: "ORD-9283",
    customer: "Ananya Roy",
    phone: "+91 98221 11223",
    origin: "Hub Central, Zone 4",
    destination: "Flat 402, Whitefield, Bengaluru",
    status: "pending",
    priority: "High",
    eta: "1 hr 10m",
    amount: "₹520",
    distance: "8.7 km"
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

export default function AgentWorklist() {
  const [filter, setFilter] = useState('all');

  const filteredOrders = mockOrders.filter(order => {
    if (filter === 'all') {
      return true;
    }

    return order.status === filter;
  });

  const tabs = [
    {
      key: 'all',
      label: 'All Loads',
      count: mockOrders.length
    },
    {
      key: 'pending',
      label: 'Pending',
      count: mockOrders.filter(
        order => order.status === 'pending'
      ).length
    },
    {
      key: 'in-transit',
      label: 'In-Transit',
      count: mockOrders.filter(
        order => order.status === 'in-transit'
      ).length
    },
    {
      key: 'delivered',
      label: 'Delivered',
      count: mockOrders.filter(
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
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/70 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
