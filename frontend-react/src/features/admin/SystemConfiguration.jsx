import { useState } from "react";
import AddOrEditDeliveryZone from '../../components/admin/AddOrEditDeliveryZone'
import { useAppSelector } from '../../app/hooks';
import { selectIsSuperUser } from '../../shared/auth/authSlice';
import { useDeleteHub } from './adminHooks';
import { useHubs } from '../../shared/hubs/hubsHooks';
import PricingConfiguration from '../../components/admin/PricingConfiguration';
import { Pencil, Trash } from "react-bootstrap-icons";

export default function SystemConfiguration() {
    const [selectedTab, setSelectedTab] = useState("deliveryZones");

    const {
        data: zones = [],
        isLoading: zonesLoading,
        error: queryError,
    } = useHubs();
    const [triggerDeleteHub] = useDeleteHub();
    const [actionError, setActionError] = useState('');

    const canManageZones = useAppSelector(selectIsSuperUser);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [zoneToEdit, setZoneToEdit] = useState(null);
    const error = actionError || queryError?.message || '';

    const handleOpenAddZone = () => {
        setZoneToEdit(null);
        setIsZoneModalOpen(true);
    };

    const handleOpenEditZone = (zone) => {
        setZoneToEdit(zone);
        setIsZoneModalOpen(true);
    };

    const handleDeleteZone = async (zone) => {
        const id = zone.id || zone.hubId;
        if (!window.confirm(`Delete zone "${zone.name}"?`)) return;
        setActionError('');
        try {
            await triggerDeleteHub(id).unwrap();
        } catch (err) {
            setActionError(err.message || "Failed to delete zone");
        }
    };

    return (
        <div className="p-2 bg-gray-50 min-h-screen">
            {/* header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">System Configuration</h1>
                    <p className="text-lg font-light text-gray-500 mb-2">Modify core system policies, variables, and operational zones.</p>
                </div>
            </div>

            {/* content */}
            <div className="flex flex-col md:flex-row items-start gap-6">
                <nav aria-label="System settings" className="flex gap-2 rounded-xl border border-gray-100 bg-white p-3 md:flex-col">
                    {[['deliveryZones', 'Delivery Zones'], ['pricing', 'Pricing']].map(([tab, label]) => (
                        <button key={tab} type="button" aria-pressed={selectedTab === tab} onClick={() => setSelectedTab(tab)}
                            className={`rounded-lg px-3 py-2 text-left text-sm ${selectedTab === tab ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}>{label}</button>
                    ))}
                </nav>
                <div className="w-full min-w-0 flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    
                    {selectedTab === "pricing" && <PricingConfiguration />}
                    {selectedTab === "deliveryZones" && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
                            {/* header */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                                <h3 className="text-base font-bold text-gray-900">Operational Delivery Zones</h3>
                                {canManageZones && <button
                                    type="button"
                                    onClick={handleOpenAddZone}
                                    className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                                >
                                    + Add new Zone
                                </button>}
                            </div>
                            {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
                            {/* content */}
                            <div className="flex flex-col divide-y divide-gray-100">
                                {zonesLoading && (
                                    <div className="text-center py-8 text-sm text-gray-400">
                                        Loading zones...
                                    </div>
                                )}

                                {!zonesLoading && zones.length === 0 && (
                                    <div className="text-center py-8 text-sm text-gray-400">
                                        No operational zones configured yet.
                                    </div>
                                )}

                                {!zonesLoading && zones.map((zone) => {
                                    const key = zone.id || zone.hubId;
                                    const location = [zone.city, zone.state].filter(Boolean).join(', ');
                                    return (
                                        <div key={key} className="flex items-center justify-between py-3.5 px-2 hover:bg-gray-50/70 rounded-lg transition-colors">
                                            <div>
                                                <div className="font-semibold text-sm text-gray-900">{zone.name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {location} {zone.capacity !== undefined ? `• Capacity: ${zone.capacity}` : ''}
                                                </div>
                                            </div>
                                            {canManageZones && <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditZone(zone)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit Zone"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteZone(zone)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete Zone"
                                                >
                                                    <Trash size={15} />
                                                </button>
                                            </div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isZoneModalOpen && <AddOrEditDeliveryZone
                onClose={() => setIsZoneModalOpen(false)}
                zoneToEdit={zoneToEdit}
            />}
        </div>
    );
}