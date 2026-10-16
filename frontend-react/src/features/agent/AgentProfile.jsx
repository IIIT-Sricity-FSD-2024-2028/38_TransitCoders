import { useState, useEffect } from 'react';
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
    ShieldCheck, 
    X,
    Calendar3,
    GeoAltFill,
    CircleFill
} from 'react-bootstrap-icons';

const STATUS_STORAGE_KEY = 'swifttrack_agent_status';

export default function AgentProfile() {
    const [profile, setProfile] = useState(() => ({
        name: "Karthik A.",
        agentId: "DA102",
        role: "Senior Delivery Agent",
        phone: "+91 98765 43210",
        email: "karthik.agent@swifttrack.com",
        licenseNo: "TN0720210001234",
        joinedDate: "12 Jan 2023",
        contractStatus: "Active",
        emergencyContact: "+91 99887 76655",
        status: localStorage.getItem(STATUS_STORAGE_KEY) || "available",
        performance: {
            total: 210,
            completed: 198,
            failed: 12,
            rating: 4.8
        },
        vehicle: {
            number: "TN 07 AB 1234",
            type: "Express Cargo Van",
            capacity: "350 kg",
            status: "Active / Insured"
        },
        hub: {
            name: "Central Hub - Zone 4",
            code: "CHN001",
            contact: "+91 44 2345 6789",
            operatingHours: "06:00 AM - 10:00 PM"
        }
    }));

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

    const handleStatusChange = (newStatus) => {
        setProfile(prev => ({ ...prev, status: newStatus }));
        localStorage.setItem(STATUS_STORAGE_KEY, newStatus);
        window.dispatchEvent(new CustomEvent('agent-status-changed', { detail: newStatus }));
        const label = newStatus === 'available' ? 'Available for Pickups' : newStatus === 'on-delivery' ? 'On Delivery Run' : 'Offline / On Break';
        triggerToast(`Status updated to: ${label}`);
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        setProfile(prev => ({
            ...prev,
            name: editForm.name,
            phone: editForm.phone,
            email: editForm.email,
            emergencyContact: editForm.emergencyContact
        }));
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    {/* Header Banner Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-28 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-6 flex justify-end">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full h-fit">
                                <ShieldCheck size={14} /> Verified Partner
                            </span>
                        </div>
                        <div className="px-6 pb-6 pt-0 relative">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 gap-4">
                                <div className="flex items-end gap-4">
                                    <div className="w-24 h-24 rounded-2xl bg-orange-600 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-black shrink-0">
                                        KA
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {profile.contractStatus}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            ID: <strong className="text-orange-600 font-semibold">{profile.agentId}</strong> · {profile.role}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar3 size={12} /> Joined {profile.joinedDate}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                            <PersonFill className="text-orange-600" />
                            Personal & Contract Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                                <span className="text-gray-400 font-semibold uppercase block mb-1">Full Legal Name</span>
                                <span className="text-sm font-bold text-gray-900">{profile.name}</span>
                            </div>

                            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                                <span className="text-gray-400 font-semibold uppercase block mb-1">Agent ID Code</span>
                                <span className="text-sm font-bold text-orange-600">{profile.agentId}</span>
                            </div>

                            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                                <span className="text-gray-400 font-semibold uppercase block mb-1">Registered Phone</span>
                                <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                    <TelephoneFill size={12} className="text-gray-400" />
                                    {profile.phone}
                                </span>
                            </div>

                            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                                <span className="text-gray-400 font-semibold uppercase block mb-1">Official Email</span>
                                <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                    <EnvelopeFill size={12} className="text-gray-400" />
                                    {profile.email}
                                </span>
                            </div>

                            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                                <span className="text-gray-400 font-semibold uppercase block mb-1">Driving License No.</span>
                                <span className="text-sm font-bold font-mono text-gray-900">{profile.licenseNo}</span>
                            </div>

                            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                                <span className="text-gray-400 font-semibold uppercase block mb-1">Emergency Contact</span>
                                <span className="text-sm font-semibold text-gray-800">{profile.emergencyContact}</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance & Scorecard */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <AwardFill className="text-orange-600" />
                                Delivery Performance
                            </h3>
                            <span className="text-xs text-gray-400">All-time dispatch stats</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Dispatches</span>
                                <span className="text-2xl font-black text-gray-900 mt-1 block">{profile.performance.total}</span>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Delivered</span>
                                <span className="text-2xl font-black text-emerald-700 mt-1 block">{profile.performance.completed}</span>
                            </div>

                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                                <span className="text-xs font-bold text-red-500 uppercase tracking-wider block">Failed / Returned</span>
                                <span className="text-2xl font-black text-red-600 mt-1 block">{profile.performance.failed}</span>
                            </div>

                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Customer Rating</span>
                                <span className="text-2xl font-black text-amber-600 mt-1 flex items-center justify-center gap-1">
                                    {profile.performance.rating}
                                    <StarFill size={16} />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right/Side Column (1 col wide) */}
                <div className="space-y-6">
                    {/* Live Status Toggle Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                            Current Dispatch Status
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Control whether new delivery assignments are routed to you.
                        </p>

                        <div className="space-y-2.5">
                            {[
                                { key: 'available', label: 'Available', desc: 'Ready for new pickups', color: 'bg-emerald-500' },
                                { key: 'on-delivery', label: 'On Delivery', desc: 'En route with active orders', color: 'bg-blue-500' },
                                { key: 'offline', label: 'Offline / Break', desc: 'Not taking new orders', color: 'bg-gray-400' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => handleStatusChange(item.key)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                                        profile.status === item.key
                                            ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.label}</p>
                                            <p className="text-[11px] text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                    {profile.status === item.key && (
                                        <CheckCircleFill className="text-orange-600" size={16} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Vehicle Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <Truck className="text-orange-600" />
                                Assigned Vehicle
                            </h3>
                            <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full">
                                {profile.vehicle.status}
                            </span>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                                <span className="text-gray-400 font-medium">Plate Number</span>
                                <span className="font-bold font-mono text-gray-900 text-sm">{profile.vehicle.number}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                                <span className="text-gray-400 font-medium">Model / Type</span>
                                <span className="font-semibold text-gray-800">{profile.vehicle.type}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                                <span className="text-gray-400 font-medium">Payload Capacity</span>
                                <span className="font-semibold text-gray-800">{profile.vehicle.capacity}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-gray-400 font-medium">GPS Telematics</span>
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <CircleFill size={8} /> Active Ping (12s ago)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Operating Hub Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <Building className="text-orange-600" />
                                Base Operating Hub
                            </h3>
                            <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 font-mono font-bold rounded">
                                {profile.hub.code}
                            </span>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-start gap-2 text-gray-700">
                                <GeoAltFill className="text-orange-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-gray-900">{profile.hub.name}</p>
                                    <p className="text-[11px] text-gray-500">Karnataka Region Logistics Hub</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                <span className="text-gray-400 font-medium">Hub Helpdesk</span>
                                <span className="font-semibold text-gray-800">{profile.hub.contact}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">Shift Timings</span>
                                <span className="font-semibold text-gray-800">{profile.hub.operatingHours}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white flex justify-between items-center">
                            <div>
                                <span className="text-xs uppercase font-bold tracking-wider text-orange-100">Edit Credentials</span>
                                <h3 className="text-lg font-bold">Update Profile Information</h3>
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(false)} 
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs text-gray-700">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Emergency Contact Number</label>
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
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
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
