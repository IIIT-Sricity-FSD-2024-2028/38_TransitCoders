import React from 'react';
import { Printer, X, QrCode, Building, GeoAlt, CheckCircleFill } from 'react-bootstrap-icons';
import OrderStatusBadge from './OrderStatusBadge';

/**
 * ShippingLabelModal
 * Displays a realistic printable AWB shipping label with barcode, QR code,
 * merchant origin, customer destination, and cargo induction details.
 */
export default function ShippingLabelModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">Air Waybill (AWB) Label</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer size={14} />
              <span>Print Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Label Container */}
        <div className="border-2 border-black p-5 rounded-xl bg-white space-y-4 font-sans text-xs">
          
          {/* Top Carrier Brand & Service Tier */}
          <div className="flex justify-between items-center border-b-2 border-black pb-3">
            <div>
              <span className="text-xl font-black tracking-tight text-gray-900">
                Swift<span className="text-orange-600">Track</span>
              </span>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Express Logistics Network
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase bg-black text-white px-2.5 py-1 rounded">
                {order.serviceType ? `${order.serviceType.toUpperCase()} AIR` : 'PRIORITY AIR'}
              </span>
            </div>
          </div>

          {/* Realistic Barcode Block */}
          <div className="py-2.5 text-center bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
            <div className="font-mono text-2xl font-black tracking-widest text-gray-900">
              {order.trackingNumber || order.id}
            </div>
            
            {/* Dynamic CSS Barcode Lines */}
            <div className="flex justify-center items-center gap-1 h-12 overflow-hidden opacity-90">
              {Array.from({ length: 42 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full ${
                    i % 4 === 0
                      ? 'w-1 bg-black'
                      : i % 3 === 0
                      ? 'w-1.5 bg-black'
                      : i % 2 === 0
                      ? 'w-0.5 bg-black'
                      : 'w-2 bg-black'
                  }`}
                />
              ))}
            </div>
            <p className="text-[9px] text-gray-400 font-mono tracking-wider">
              SCAN TO DISPATCH & CONFIRM INDUCTION
            </p>
          </div>

          {/* Sender & Receiver Details Grid */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <Building size={11} />
                <span>SHIP FROM (MERCHANT):</span>
              </p>
              <p className="font-bold text-gray-900">SwiftTrack Hub (Main Warehouse)</p>
              <p className="text-gray-600 text-[11px]">{order.pickupAddress || 'Plot 24, Guindy Industrial Estate, Chennai'}</p>
              <p className="text-gray-500 font-mono text-[11px]">Chennai, TN - 600032</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <GeoAlt size={11} />
                <span>SHIP TO (CUSTOMER):</span>
              </p>
              <p className="font-bold text-gray-900">{order.recipientName || 'Customer'}</p>
              <p className="text-gray-600 text-[11px]">{order.deliveryAddress}</p>
              <p className="text-gray-500 font-mono text-[11px]">Contact: {order.recipientPhone || 'N/A'}</p>
            </div>
          </div>

          {/* Routing Hubs, Dimensions & Billed Weight */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">BILLED WEIGHT</span>
              <span className="font-bold text-sm text-gray-900">
                {order.packageWeight ? `${order.packageWeight} kg` : '2.0 kg'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">DIMENSIONS</span>
              <span className="font-bold text-xs text-gray-900 mt-0.5 block truncate" title={order.dimensions || '28x22x16 cm'}>
                {order.dimensions || (order.length ? `${order.length}x${order.width}x${order.height} cm` : '28x22x16 cm')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">DESTINATION HUB</span>
              <span className="font-bold text-sm text-orange-600">
                {order.destination ? `${order.destination.toUpperCase()}-01` : 'BLR-01'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">COD / AMOUNT</span>
              <span className="font-bold text-sm text-gray-900">
                ₹{order.price || 350} (PAID)
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
            <span>Date: {order.date || 'Today'}</span>
            <span>Carrier: SwiftTrack Ground & Air Express</span>
          </div>

        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
