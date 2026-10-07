import { useState, useEffect } from 'react';
import { X } from 'react-bootstrap-icons';
import { API } from '../../services/api';

export default function AddOrEditUserModal({ 
  isOpen, 
  onClose, 
  userToEdit = null,
  onSuccess 
}) {
  const isEdit = Boolean(userToEdit);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    hubId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '', 
        role: userToEdit.role || '',
        hubId: userToEdit.hubId || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: '',
        hubId: '',
      });
    }
    setError(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!isEdit && !formData.password) || !formData.role) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEdit) {
        const updatePayload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role.toLowerCase(),
          ...(formData.hubId ? { hubId: formData.hubId } : {}),
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }

        const res = await API.users.update(userToEdit.id, updatePayload);
        if (onSuccess) onSuccess(res, 'edit');
      } else {
        const createPayload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role.toLowerCase(),
          ...(formData.hubId ? { hubId: formData.hubId } : {}),
        };

        const res = await API.users.create(createPayload);
        if (onSuccess) onSuccess(res, 'create');
      }

      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Edit User' : 'Add New User'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Updating profile for ${userToEdit?.name}` : 'Create a new system account'}
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
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="eg. Vinod Reddy"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password {isEdit && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? '••••••••' : 'Enter password'}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                required={!isEdit}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white cursor-pointer focus:border-orange-500 transition-colors"
                required
              >
                <option value="">Select a role...</option>
                <option value="super_user">Super Admin</option>
                <option value="hub_manager">Hub Manager</option>
                <option value="admin">Business Admin</option>
                <option value="delivery_agent">Delivery Agent</option>
                <option value="merchant">Merchant</option>
                <option value="customer">Customer</option>
              </select>
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
              {loading ? 'Saving...' : isEdit ? 'Update User' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}