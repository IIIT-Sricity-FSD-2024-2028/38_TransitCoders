import { useState,useEffect } from "react";
import AddOrEditDeliveryZone from '../../components/admin/AddOrEditDeliveryZone'
import API from '../../services/api'
import { Pencil, Trash } from "react-bootstrap-icons";

export default function SystemConfiguration() {
    const [selectedTab, setSelectedTab] = useState("deliveryZones");

    const [zones, setZones] = useState([]);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [zoneToEdit, setZoneToEdit] = useState(null);

    const fetchZones = async () => {
        try {
        setZonesLoading(true);
        const data = await API.hubs.getAll();
        setZones(Array.isArray(data) ? data : []);
        } catch (err) {
        console.error("Failed to load hubs:", err);
        } finally {
        setZonesLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTab === "deliveryZones") {
            fetchZones();
        }
    }, [selectedTab]);
    
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
        try {
            await API.hubs.delete(id);
            setZones((prev) => prev.filter((z) => (z.id || z.hubId) !== id));
        } catch (err) {
            alert(err.message || "Failed to delete zone");
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
                <aside className="w-fit min-w-[200px] flex-shrink-0 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <ul className="flex flex-col gap-2">
                        <li
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTab === "deliveryZones" ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                            onClick={() => setSelectedTab("deliveryZones")}
                        >
                            Delivery Zones
                        </li>
                    </ul>
                </aside>
                <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    
                    {selectedTab === "deliveryZones" && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
                            {/* header */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                                <h3 className="text-base font-bold text-gray-900">Operational Delivery Zones</h3>
                                <button
                                    type="button"
                                    onClick={handleOpenAddZone}
                                    className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                                >
                                    + Add new Zone
                                </button>
                            </div>
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
                                            <div className="flex items-center gap-2">
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
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AddOrEditDeliveryZone
                isOpen={isZoneModalOpen}
                onClose={() => setIsZoneModalOpen(false)}
                zoneToEdit={zoneToEdit}
                onSuccess={() => fetchZones()}
            />
        </div>
    );
}