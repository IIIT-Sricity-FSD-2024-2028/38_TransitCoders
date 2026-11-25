import { useState } from 'react';
import { X } from 'react-bootstrap-icons';
import { useCreateUser, useUpdateUser } from '../../features/admin/adminHooks';

export default function AddOrEditUserModal({ 
  onClose, 
  userToEdit = null,
  onSuccess, canManagePrivilegedRoles, hubs
}) {
  const isEdit = Boolean(userToEdit);
  const [createUser, { isLoading: creating }] = useCreateUser();
  const [updateUser, { isLoading: updating }] = useUpdateUser();
  const loading = creating || updating;

  const [formData, setFormData] = useState(() => ({
        name: userToEdit?.name || '',
        email: userToEdit?.email || '',
        password: '',
        role: userToEdit?.role || '',
        hubId: userToEdit?.hubId || '',
        isActive: userToEdit?.isActive ?? false,
        }));
  const [error, setError] = useState(null);
  const requiresHub = ['hub_manager', 'delivery_agent'].includes(formData.role);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!isEdit && !formData.password) || !formData.role || (requiresHub && !formData.hubId)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setError(null);

      if (isEdit) {
        const updatePayload = {
          id: userToEdit.id,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role.toLowerCase(),
          isActive: formData.isActive,
          hubId: requiresHub ? formData.hubId : null,
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }

        const res = await updateUser(updatePayload).unwrap();
        if (onSuccess) onSuccess(res, 'edit');
      } else {
        const createPayload = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role.toLowerCase(),
          ...(requiresHub ? { hubId: formData.hubId } : {}),
        };

        const res = await createUser(createPayload).unwrap();
        if (onSuccess) onSuccess(res, 'create');
      }

      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit User' : 'Add New User'} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={loading ? undefined : onClose} />

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
            onClick={onClose} disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div role="alert" className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="user-name" className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                id="user-name" name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="eg. Vinod Reddy"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="user-email" className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                id="user-email" name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="user-password" className="block text-xs font-semibold text-gray-700 mb-1">
                Password {isEdit && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                id="user-password" name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? '••••••••' : 'Enter password'}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors"
                required={!isEdit}
              />
            </div>

            <div>
              <label htmlFor="user-role" className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
              <select
                id="user-role" name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white cursor-pointer focus:border-orange-500 transition-colors"
                required
              >
                <option value="">Select a role...</option>
                {canManagePrivilegedRoles && <option value="super_user">Super Admin</option>}
                <option value="hub_manager">Hub Manager</option>
                {canManagePrivilegedRoles && <option value="admin">Business Admin</option>}
                <option value="delivery_agent">Delivery Agent</option>
                <option value="merchant">Merchant</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          
          {requiresHub && (
            <div>
              <label htmlFor="user-hub" className="block text-xs font-semibold text-gray-700 mb-1">Assigned hub</label>
              <select id="user-hub" name="hubId" value={formData.hubId} onChange={handleChange} required className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm">
                <option value="">Select a hub</option>
                {hubs.map(hub => <option key={hub.hubId} value={hub.hubId}>{hub.name} ({hub.hubId})</option>)}
              </select>
            </div>
          )}
          {isEdit && formData.role !== "super_user" && (
              <div>
                <label htmlFor="user-isActive" className="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
                <select
                  id="user-isActive" name="isActive"
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === "active" }))}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white cursor-pointer focus:border-orange-500 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Pending Approval)</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose} disabled={loading}
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
