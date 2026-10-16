import { useState } from 'react';
import { X, CheckCircle, Camera, GeoAlt } from 'react-bootstrap-icons';

export default function ConfirmDeliveryModal({ isOpen, onClose, order, onConfirmDelivery }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [podImage, setPodImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  if (!isOpen || !order) return null;

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPodImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmDelivery(order.id, { otp: otp.join(''), photo: podImage });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Proof of Delivery (PoD)</span>
            <h2 className="text-xl font-bold text-gray-900 mt-0.5">Order #{order.orderId || order.id}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Customer Banner */}
        <div className="my-4 bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs flex justify-between items-center">
          <div>
            <span className="text-blue-700 font-semibold block">{order.customer}</span>
            <span className="text-gray-500">{order.destination}</span>
          </div>
          <span className="font-bold text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
            {order.amount}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Input */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-1">
              Customer 4-Digit OTP
            </label>
            <div className="flex gap-2 justify-center py-2">
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={otp[i]}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  className="w-12 h-12 text-center text-xl font-bold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 outline-none"
                />
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-1">
              Upload Proof of Delivery Photo (Optional)
            </label>
            <label className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50">
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-32 object-cover rounded-lg" />
              ) : (
                <div className="text-center py-2">
                  <Camera size={22} className="mx-auto text-blue-500 mb-1" />
                  <span className="text-xs text-blue-600 font-medium">Click to select photo</span>
                </div>
              )}
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center gap-3 justify-end border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer flex items-center gap-2">
              <CheckCircle size={16} />
              <span>Confirm Delivery</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
