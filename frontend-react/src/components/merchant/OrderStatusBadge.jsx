import React from 'react';

/**
 * OrderStatusBadge component
 * Demonstrates conditional class rendering based on props
 * @param {{ status: string }} props
 */
export default function OrderStatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();

  const statusStyles = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CREATED: 'bg-blue-50 text-blue-700 border-blue-200',
    DISPATCHED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    IN_TRANSIT: 'bg-purple-50 text-purple-700 border-purple-200',
    OUT_FOR_DELIVERY: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const currentStyle = statusStyles[normalized] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {normalized.replace(/_/g, ' ')}
    </span>
  );
}
