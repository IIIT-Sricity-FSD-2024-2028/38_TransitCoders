import { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { useUpdateProfile } from '../../shared/auth/authHooks';
import { useHub } from '../../shared/hubs/hubsHooks';
import AgentStatusBadge from '../../components/agent/AgentStatusBadge';
import { isActiveOrder } from '../../services/orderStatus';
import { setAgentNotice } from './agentSlice';
import { useAgentPortal } from './useAgentPortal';

export default function AgentProfile() {
    const dispatch = useAppDispatch();
    const { user, agent, orders, saveAvailability, savingAvailability } = useAgentPortal();
    const [updateProfile] = useUpdateProfile();
    const [editing, setEditing] = useState(false);
    const hubId = agent?.hubId || user?.hubId;

    const { data: hub = null } = useHub(hubId, { skip: !hubId });

    async function saveProfile(profile) {
        await updateProfile(profile).unwrap();
        dispatch(setAgentNotice('Profile updated.'));
    }

    return (
        <div className="max-w-4xl space-y-5">
            <h1 className="text-2xl font-bold text-gray-900">Agent Profile</h1>
            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">{user?.name}</h2>
                    {agent && <AgentStatusBadge status={agent.availabilityStatus} onStatusChange={saveAvailability} saving={savingAvailability} />}
                </div>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                        ['Email', user?.email],
                        ['Phone', user?.phone || agent?.phone],
                        ['Agent ID', agent?.id],
                        ['Vehicle type', agent?.vehicleType],
                        ['Assigned hub', hub?.name || hubId],
                        ['Hub contact', hub?.phone],
                        ['Active delivery slots', agent && `${orders.filter(order => isActiveOrder(order.backendStatus)).length}/${agent.taskCapacity}`],
                        ['Deliveries completed', orders.filter(order => order.status === 'delivered').length],
                    ].map(([label, value]) => (
                        <div key={label}><dt className="text-gray-500">{label}</dt><dd className="font-medium">{value ?? '—'}</dd></div>
                    ))}
                </dl>
                <button type="button" onClick={() => setEditing(true)} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white">Edit Profile</button>
            </section>
            {editing && user && <EditProfile user={user} onSave={saveProfile} onClose={() => setEditing(false)} />}
        </div>
    );
}

function EditProfile({ user, onSave, onClose }) {
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function submit(event) {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setError('');
        try {
            await onSave({ name: name.trim(), phone: phone.trim() });
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg">
                <h2 id="edit-profile-title" className="text-lg font-semibold">Edit Profile</h2>
                <label className="block space-y-1 text-sm font-medium"><span>Name</span><input className="block w-full rounded-lg border border-gray-300 px-3 py-2" required maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label>
                <label className="block space-y-1 text-sm font-medium"><span>Phone</span><input type="tel" className="block w-full rounded-lg border border-gray-300 px-3 py-2" maxLength={30} value={phone} onChange={event => setPhone(event.target.value)} /></label>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <div className="flex justify-end gap-3">
                    <button type="button" disabled={saving} onClick={onClose}>Cancel</button>
                    <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Profile'}</button>
                </div>
            </form>
        </div>
    );
}
