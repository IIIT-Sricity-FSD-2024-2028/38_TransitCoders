import { useState, useEffect } from 'react';
import { X } from 'react-bootstrap-icons';
import { API } from '../../services/api';

export default function AddOrEditUserModal({ 
  isOpen, 
  onClose, 
  zoneToEdit = null,
  onSuccess 
}) {
  const isEdit = Boolean(zoneToEdit);

  const [formData, setFormData] = useState({
    hubId: '',
    name: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    capacity: '',
    phone: '',
    status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (zoneToEdit) {
      setFormData({
        hubId: zoneToEdit.hubId || '',
        name: zoneToEdit.name || '',
        city: zoneToEdit.city || '',
        state: zoneToEdit.state || '',
        pincode: zoneToEdit.pincode || '',
        address: zoneToEdit.address || '',
        capacity: zoneToEdit.capacity !== undefined ? String(zoneToEdit.capacity) : '',
        phone: zoneToEdit.phone || '',
        status: zoneToEdit.status || 'active',
      });
    } else {
      setFormData({
        hubId: '',
        name: '',
        city: '',
        state: '',
        pincode: '',
        address: '',
        capacity: '',
        phone: '',
        status: 'active',
      });
    }
    setError(null);
  }, [zoneToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      (!isEdit && !formData.hubId.trim()) ||
      !formData.name.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.pincode.trim() ||
      !formData.address.trim()
    ) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        address: formData.address.trim(),
        status: formData.status,
      };

      if (!isEdit) {
        payload.hubId = formData.hubId.trim();
      }

      if (formData.capacity !== '') {
        payload.capacity = parseInt(formData.capacity, 10);
      }

      if (formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }

      if (isEdit) {
        const targetId = zoneToEdit.id || zoneToEdit.hubId;
        const res = await API.hubs.update(targetId, payload);
        if (onSuccess) onSuccess(res, 'edit');
      } else {
        const res = await API.hubs.create(payload);
        if (onSuccess) onSuccess(res, 'create');
      }

      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} delivery zone`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Updating hub ${zoneToEdit?.hubId || zoneToEdit?.name}` : 'Configure a new operational hub'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hub ID *</label>
                <input
                  type="text"
                  name="hubId"
                  value={formData.hubId}
                  onChange={handleChange}
                  placeholder="e.g. HUB-CHN-01"
                  disabled={isEdit}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Zone / Hub Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Chennai Central Hub"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Chennai"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Tamil Nadu"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Postal PIN Code *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="600001"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity (Daily)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="500"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address or locality"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white cursor-pointer focus:border-orange-500 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#f97316] hover:bg-[#ea580c] rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Zone' : 'Save Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}