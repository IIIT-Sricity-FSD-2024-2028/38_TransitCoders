import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    PersonFill, 
    TelephoneFill, 
    EnvelopeFill, 
    AwardFill, 
    Truck, 
    Building, 
    CheckCircleFill, 
    StarFill, 
    Download, 
    PencilSquare, 
    X, 
    Calendar3, 
    GeoAltFill, 
    CircleFill 
} from 'react-bootstrap-icons';
import { API } from '../../services/api';

const STATUS_STORAGE_KEY = 'swifttrack_agent_status';

const HUB_METADATA = {
    H001: { name: 'Chennai Central Hub', code: 'H001', contact: '044-23456789', city: 'Chennai', region: 'Tamil Nadu Region Logistics Hub', operatingHours: '06:00 AM - 10:00 PM' },
    H002: { name: 'Mumbai Gateway Hub', code: 'H002', contact: '022-67891234', city: 'Mumbai', region: 'Maharashtra Region Logistics Hub', operatingHours: '06:00 AM - 10:30 PM' },
    H003: { name: 'Delhi NCR Hub', code: 'H003', contact: '011-45678901', city: 'New Delhi', region: 'Delhi NCR Region Logistics Hub', operatingHours: '06:00 AM - 10:00 PM' },
    H004: { name: 'Bengaluru Tech Hub', code: 'H004', contact: '080-23456781', city: 'Bengaluru', region: 'Karnataka Region Logistics Hub', operatingHours: '06:30 AM - 10:00 PM' },
    H005: { name: 'Kolkata East Hub', code: 'H005', contact: '033-45678902', city: 'Kolkata', region: 'West Bengal Region Logistics Hub', operatingHours: '06:00 AM - 09:30 PM' },
    H006: { name: 'Hyderabad Central Hub', code: 'H006', contact: '040-23456780', city: 'Hyderabad', region: 'Telangana Region Logistics Hub', operatingHours: '06:00 AM - 10:00 PM' },
};

function getInitials(name) {
    if (!name) return 'DA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AgentProfile() {
    const { orders = [] } = useOutletContext() || {};

    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const saved = localStorage.getItem("user");
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.warn('[AgentProfile] Error reading user:', e);
        }
        return { name: "Agent One", email: "agent1@swifttrack.com", role: "delivery_agent", hubId: "H001" };
    });

    const userKey = currentUser?.id || currentUser?.email || 'agent1';
    const agentNum = (currentUser?.name || '').replace(/\D/g, '') || (currentUser?.email ? currentUser.email.replace(/\D/g, '') : '1');
    const assignedHub = HUB_METADATA[currentUser?.hubId] || HUB_METADATA.H001;

    const [profile, setProfile] = useState(() => {
        const customProfileSaved = localStorage.getItem(`swifttrack_agent_profile_${userKey}`);
        if (customProfileSaved) {
            try {
                const parsed = JSON.parse(customProfileSaved);
                if (parsed && !parsed.name?.includes('Karthik')) {
                    return parsed;
                }
            } catch (_) {}
        }

        const agentId = `DA-10${agentNum || '1'}`;
        const phone = currentUser?.phone || `+91 98765 0000${agentNum || '1'}`;
        const licenseNo = `${(assignedHub.city || 'TN').slice(0, 2).toUpperCase()}012023000${agentNum || '1'}001`;
        const vehiclePlate = `${(assignedHub.city || 'TN').slice(0, 2).toUpperCase()} 0${agentNum || '1'} AG 100${agentNum || '1'}`;
        const effectiveName = (currentUser?.name && !currentUser.name.includes('Karthik'))
            ? currentUser.name
            : `Agent ${agentNum || 'One'}`;

        return {
            name: effectiveName,
            agentId,
            role: "Senior Delivery Agent",
            phone,
            email: currentUser?.email || `agent${agentNum || '1'}@swifttrack.com`,
            licenseNo,
            joinedDate: "12 Jan 2023",
            contractStatus: "Active",
            emergencyContact: `+91 99887 7665${agentNum || '1'}`,
            status: localStorage.getItem(STATUS_STORAGE_KEY) || "available",
            vehicle: {
                number: vehiclePlate,
                type: Number(agentNum) % 2 === 0 ? "Express Cargo Van" : "Rapid Delivery Bike",
                capacity: Number(agentNum) % 2 === 0 ? "350 kg" : "120 kg",
                status: "Active / Insured"
            },
            hub: {
                name: assignedHub.name,
                code: assignedHub.code,
                contact: assignedHub.contact,
                operatingHours: assignedHub.operatingHours,
                region: assignedHub.region
            }
        };
    });

    // Try fetching live backend agent profile if available
    useEffect(() => {
        if (currentUser?.id && API?.agents?.getProfile) {
            API.agents.getProfile(currentUser.id).then(backendAgent => {
                if (backendAgent) {
                    setProfile(prev => ({
                        ...prev,
                        name: backendAgent.name || prev.name,
                        status: (backendAgent.availabilityStatus || '').toLowerCase() || prev.status,
                        vehicle: {
                            ...prev.vehicle,
                            type: backendAgent.vehicleType ? `${backendAgent.vehicleType.toUpperCase()} Carrier` : prev.vehicle.type
                        }
                    }));
                }
            }).catch(() => {
                // Ignore background agent profile fetch errors
            });
        }
    }, [currentUser?.id]);

    // Dynamic performance computed from real assigned deliveries
    const completedCount = orders.filter(o => o.status === 'delivered').length;
    const failedCount = orders.filter(o => o.status === 'failed').length;
    const totalCount = orders.length;

    // Listen to status changes triggered from Topbar or other components
    useEffect(() => {
        const handleStatusEvent = (e) => {
            if (e.detail && e.detail !== profile.status) {
                setProfile(prev => ({ ...prev, status: e.detail }));
            }
        };

        window.addEventListener('agent-status-changed', handleStatusEvent);
        return () => window.removeEventListener('agent-status-changed', handleStatusEvent);
    }, [profile.status]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        emergencyContact: profile.emergencyContact
    });
    const [toastMessage, setToastMessage] = useState(null);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleStatusChange = async (newStatus) => {
        setProfile(prev => ({ ...prev, status: newStatus }));
        localStorage.setItem(STATUS_STORAGE_KEY, newStatus);
        window.dispatchEvent(new CustomEvent('agent-status-changed', { detail: newStatus }));

        if (currentUser?.id && API?.agents?.updateAvailability) {
            API.agents.updateAvailability(currentUser.id, newStatus).catch(() => {});
        }

        const label = newStatus === 'available' ? 'Available for Pickups' : newStatus === 'on-delivery' ? 'On Delivery Run' : 'Offline / On Break';
        triggerToast(`Status updated to: ${label}`);
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        const updated = {
            ...profile,
            name: editForm.name,
            phone: editForm.phone,
            email: editForm.email,
            emergencyContact: editForm.emergencyContact
        };
        setProfile(updated);
        try {
            localStorage.setItem(`swifttrack_agent_profile_${userKey}`, JSON.stringify(updated));
            const updatedUser = { ...currentUser, name: editForm.name, email: editForm.email, phone: editForm.phone };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
        } catch (_) {}

        setIsEditModalOpen(false);
        triggerToast("Profile information updated successfully!");
    };

    const handleDownloadID = () => {
        alert(`Downloading SwiftTrack Agent Digital Credential for ${profile.agentId} (${profile.name})...`);
    };

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-gray-700 animate-fade-in">
                    <CheckCircleFill className="text-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <PersonFill className="text-orange-600" />
                        Agent Profile
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Manage your agent identity, vehicle credentials, and active dispatch status.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownloadID}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-orange-600 shadow-sm transition-all"
                    >
                        <Download size={14} />
                        Download ID Card
                    </button>
                    <button
                        onClick={() => {
                            setEditForm({
                                name: profile.name,
                                phone: profile.phone,
                                email: profile.email,
                                emergencyContact: profile.emergencyContact
                            });
                            setIsEditModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 shadow-sm transition-all"
                    >
                        <PencilSquare size={14} />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Two-Column Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left/Main Column (2 cols wide) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Clean Agent Summary Card (No bulky cover banner) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center text-xl font-bold shrink-0">
                                    {getInitials(profile.name)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {profile.contractStatus}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ID: <strong className="text-orange-600 font-semibold">{profile.agentId}</strong> · {profile.role}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar3 size={13} />
                                <span>Joined {profile.joinedDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                            <PersonFill className="text-orange-600" />
                            Personal Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-400 block mb-1">Full Legal Name</span>
                                <span className="text-sm font-semibold text-gray-900">{profile.name}</span>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-400 block mb-1">Agent ID Code</span>
                                <span className="text-sm font-semibold text-orange-600">{profile.agentId}</span>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-400 block mb-1">Registered Phone</span>
                                <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                    <TelephoneFill size={12} className="text-gray-400" />
                                    {profile.phone}
                                </span>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-400 block mb-1">Official Email</span>
                                <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                    <EnvelopeFill size={12} className="text-gray-400" />
                                    {profile.email}
                                </span>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-400 block mb-1">Driving License No.</span>
                                <span className="text-sm font-semibold font-mono text-gray-900">{profile.licenseNo}</span>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-400 block mb-1">Emergency Contact</span>
                                <span className="text-sm font-semibold text-gray-800">{profile.emergencyContact}</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance & Scorecard */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <AwardFill className="text-orange-600" />
                                Delivery Performance
                            </h3>
                            <span className="text-xs text-gray-400">Dispatch stats</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 rounded-lg bg-gray-50">
                                <span className="text-xs text-gray-500 block">Total Deliveries</span>
                                <span className="text-xl font-bold text-gray-900 mt-1 block">{totalCount}</span>
                            </div>

                            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700">
                                <span className="text-xs text-emerald-600 block">Delivered</span>
                                <span className="text-xl font-bold mt-1 block">{completedCount}</span>
                            </div>

                            <div className="p-3 rounded-lg bg-red-50 text-red-600">
                                <span className="text-xs text-red-500 block">Failed / Returned</span>
                                <span className="text-xl font-bold mt-1 block">{failedCount}</span>
                            </div>

                            <div className="p-3 rounded-lg bg-amber-50 text-amber-700">
                                <span className="text-xs text-amber-600 block">Rating</span>
                                <span className="text-xl font-bold mt-1 flex items-center justify-center gap-1">
                                    4.9
                                    <StarFill size={14} className="text-amber-500" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right/Side Column (1 col wide) */}
                <div className="space-y-6">
                    {/* Live Status Toggle Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">
                            Dispatch Status
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">
                            Control incoming delivery assignments.
                        </p>

                        <div className="space-y-2">
                            {[
                                { key: 'available', label: 'Available', desc: 'Ready for pickups', color: 'bg-emerald-500' },
                                { key: 'on-delivery', label: 'On Delivery', desc: 'En route with orders', color: 'bg-blue-500' },
                                { key: 'offline', label: 'Offline / Break', desc: 'Not taking orders', color: 'bg-gray-400' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => handleStatusChange(item.key)}
                                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                                        profile.status === item.key
                                            ? 'border-orange-500 bg-orange-50/40 text-orange-900'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{item.label}</p>
                                            <p className="text-[11px] text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                    {profile.status === item.key && (
                                        <CheckCircleFill className="text-orange-600" size={15} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Vehicle Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Truck className="text-orange-600" />
                                Assigned Vehicle
                            </h3>
                            <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full">
                                {profile.vehicle.status}
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-gray-400">Plate Number</span>
                                <span className="font-semibold font-mono text-gray-900">{profile.vehicle.number}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-gray-400">Type</span>
                                <span className="font-medium text-gray-800">{profile.vehicle.type}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-gray-400">Capacity</span>
                                <span className="font-medium text-gray-800">{profile.vehicle.capacity}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-gray-400">GPS Status</span>
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                    <CircleFill size={7} /> Active
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Operating Hub Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Building className="text-orange-600" />
                                Base Hub
                            </h3>
                            <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 font-mono font-semibold rounded">
                                {profile.hub.code}
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-start gap-2 text-gray-700">
                                <GeoAltFill className="text-orange-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-gray-900">{profile.hub.name}</p>
                                    <p className="text-[11px] text-gray-500">{profile.hub.region || 'Regional Logistics Hub'}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                <span className="text-gray-400">Helpdesk</span>
                                <span className="font-medium text-gray-800">{profile.hub.contact}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Timings</span>
                                <span className="font-medium text-gray-800">{profile.hub.operatingHours}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
                            <h3 className="text-base font-bold">Edit Profile</h3>
                            <button 
                                onClick={() => setIsEditModalOpen(false)} 
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="p-5 space-y-3.5 text-xs text-gray-700">
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Emergency Contact Number</label>
                                <input
                                    type="text"
                                    value={editForm.emergencyContact}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 text-gray-900"
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
