import { useEffect, useRef, useState } from 'react';
import { Printer, X, Building, GeoAlt } from 'react-bootstrap-icons';
import OrderStatusBadge from './OrderStatusBadge';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectAuthToken } from '../../shared/auth/authSlice';
import { sessionCleared } from '../../shared/auth/sessionActions';
import { fetchOrderBarcodeBlob } from '../../app/api/apiClient';
import { getAutoDimensions } from '../../features/merchant/merchantSelectors';
import './ShippingLabelModal.css';

/**
 * ShippingLabelModal
 * Displays a printable AWB shipping label with barcode,
 * merchant origin, customer destination, and cargo induction details.
 */
export default function ShippingLabelModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;
  return <ShippingLabel key={order.backendId} order={order} onClose={onClose} />;
}

function ShippingLabel({ order, onClose }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const [barcode, setBarcode] = useState(null);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const billedWeight = order.billableWeight ?? order.packageWeight;
  const dimensions = getAutoDimensions(order.packageType, order.packageWeight);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let imageUrl;
    fetchOrderBarcodeBlob(order.backendId, { signal: controller.signal, token }).then(blob => {
      if (controller.signal.aborted) return;
      imageUrl = URL.createObjectURL(blob);
      setBarcode(imageUrl);
    }, err => {
      if (controller.signal.aborted) return;
      if (err.status === 401) dispatch(sessionCleared());
      setError(err.message);
    });
    return () => {
      controller.abort();
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [order.backendId, token, dispatch]);

  return (
    <dialog ref={dialog} aria-label="Shipping label" className="shipping-label-dialog"
      onCancel={event => { event.preventDefault(); onClose(); }}>
      <div className="p-4 sm:p-6 space-y-5">
        
        {/* Header */}
        <div className="flex flex-wrap gap-2 items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-900">Air Waybill (AWB) Label</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={!barcode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer size={14} />
              <span>Print Label</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close shipping label"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Label Container */}
        <div className="shipping-label border-2 border-black p-3 sm:p-5 rounded-xl bg-white space-y-4 font-sans text-xs">
          
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
            <div className="font-mono break-all text-lg sm:text-2xl font-black tracking-widest text-gray-900">
              {order.trackingNumber || order.id}
            </div>
            
            {barcode ? (
              <img src={barcode} alt={`Barcode for ${order.trackingNumber}`} className="mx-auto max-h-16 max-w-full" />
            ) : (
              <p role={error ? 'alert' : 'status'}>{error || 'Loading barcode…'}</p>
            )}
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
              <p className="font-bold text-gray-900">{order.pickupHubId || 'Origin hub unavailable'}</p>
              <p className="text-gray-600 text-[11px]">{order.pickupAddress || 'Origin Logistics Facility'}</p>
              <p className="text-gray-500 font-mono text-[11px]">{order.origin || 'Origin'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <GeoAlt size={11} />
                <span>SHIP TO (CUSTOMER):</span>
              </p>
              <p className="font-bold text-gray-900">{order.recipientName || 'Customer'}</p>
              <p className="text-gray-600 text-[11px]">{order.deliveryAddress || 'Customer Address'}</p>
              <p className="text-gray-500 font-mono text-[11px]">Contact: {order.recipientPhone || 'N/A'}</p>
            </div>
          </div>

          {/* Routing Hubs, Dimensions & Billed Weight */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">BILLED WEIGHT</span>
              <span className="font-bold text-sm text-gray-900">
                {billedWeight == null ? '—' : `${billedWeight} kg`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">DIMENSIONS</span>
              <span className="font-bold text-xs text-gray-900 mt-0.5 block truncate" title="Estimated dimensions">
                {order.packageWeight == null ? '—' : `${dimensions.length} × ${dimensions.width} × ${dimensions.height} cm`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">DESTINATION HUB</span>
              <span className="font-bold text-sm text-orange-600">
                {order.deliveryHubId || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">COD / AMOUNT</span>
              <span className="font-bold text-sm text-gray-900">
                ₹{order.price ?? '—'} ({order.paymentMode || '—'})
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
    </dialog>
  );
}
