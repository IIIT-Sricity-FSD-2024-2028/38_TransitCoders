import { X, GeoAlt, Telephone, BoxSeam, CheckCircle, Cash } from 'react-bootstrap-icons';

export default function AcceptDeliveryModal({ isOpen, onClose, order, onConfirmAccept }) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Delivery Assignment</span>
            <h2 className="text-xl font-bold text-gray-900 mt-0.5">Order #{order.orderId || order.id}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-4 border-b border-gray-100 text-center">
          <div className="bg-gray-50 p-2.5 rounded-xl">
            <span className="text-[11px] text-gray-400 block font-medium">ETA</span>
            <span className="text-sm font-bold text-gray-800">{order.eta || '30 mins'}</span>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl">
            <span className="text-[11px] text-gray-400 block font-medium">Distance</span>
            <span className="text-sm font-bold text-gray-800">{order.distance || '4.5 km'}</span>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl">
            <span className="text-[11px] text-gray-400 block font-medium">Priority</span>
            <span className="text-sm font-bold text-orange-600">{order.priority || 'Standard'}</span>
          </div>
        </div>

        {/* Recipient & Route */}
        <div className="py-4 space-y-3 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">{order.customer}</span>
            <a href={`tel:${order.phone}`} className="text-xs text-orange-600 font-medium flex items-center gap-1">
              <Telephone size={12} />
              <span>{order.phone}</span>
            </a>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-0.5 shrink-0"></span>
              <span className="text-gray-700"><strong>From:</strong> {order.origin}</span>
            </div>
            <div className="flex items-start gap-2">
              <GeoAlt size={14} className="text-rose-500 mt-0.5 shrink-0" />
              <span className="text-gray-900"><strong>To:</strong> {order.destination}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-5 flex items-center gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmAccept(order.id);
              onClose();
            }}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl cursor-pointer flex items-center gap-2"
          >
            <CheckCircle size={16} />
            <span>Accept & Start Delivery</span>
          </button>
        </div>
      </div>
    </div>
  );
}
