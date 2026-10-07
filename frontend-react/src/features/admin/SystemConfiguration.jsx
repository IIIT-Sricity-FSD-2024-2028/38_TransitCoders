import { useState } from "react";

export default function SystemConfiguration() {
    const [buttonText, setButtonText] = useState("Save Changes");
    const originalButtonText = "Save Changes";
    const handleButtonClick = () => {
        setButtonText("Settings Saved!");
        setTimeout(() => {
            setButtonText(originalButtonText);
        }, 2000);
    };

    const [selectedTab, setSelectedTab] = useState("policies");
    const [formData, setFormData] = useState({
    passwordPolicy: "strict",
    sessionTimeout: 60,
    escalationTime: 24,
    requireRefundReview: "yes",
    });

    const handleChange = (e)=>{
        const { name, value } = e.target;
        setFormData((prev)=>({...prev, [name]:value}))
    }

    return (
        <div className="p-1 bg-gray-100 min-h-screen">
            {/* header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">System Configuration</h1>
                    <p className="text-lg font-light text-gray-500 mb-2">Modify core system policies, variables, and operational zones.</p>
                </div>
                <button 
                    onClick={handleButtonClick}
                    className="bg-orange-500 flex text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                >
                    {buttonText}
                </button>
            </div>

            {/* content */}
            <div className="flex flex-col md:flex-row items-start gap-6">
                <aside className="w-fit min-w-[200px] flex-shrink-0 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <ul className="flex flex-col gap-2">
                        <li
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTab === "policies" ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                            onClick={() => setSelectedTab("policies")}
                        >
                            System Policies
                        </li>
                        <li
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTab === "deliveryZones" ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                            onClick={() => setSelectedTab("deliveryZones")}
                        >
                            Delivery Zones
                        </li>
                    </ul>
                </aside>
                <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    {selectedTab === "policies" && (
                        <div>
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4">Security & Passwords</h2>
                                <form>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="passwordPolicy" className="block text-sm font-semibold text-gray-800 mb-2">
                                                Password Policy
                                            </label>
                                            <select
                                                id="passwordPolicy"
                                                name="passwordPolicy"
                                                value={formData.passwordPolicy}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="standard">
                                                    Standard (Alphanumeric, Length &gt; 8)
                                                </option>
                                                <option value="strict">
                                                    Strict (Special Characters, Length &gt; 12)
                                                </option>
                                                <option value="basic">
                                                    Basic (Length &gt; 6)
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="sessionTimeout" className="block text-sm font-semibold text-gray-800 mb-2">
                                                Session Timeout (Minutes)
                                            </label>
                                            <input
                                                type="number"
                                                id="sessionTimeout"
                                                name="sessionTimeout"
                                                value={formData.sessionTimeout}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />

                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4">Priority Escalation Settings</h2>
                                <form>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="escalationTime" className="block text-sm font-semibold text-gray-800 mb-2">
                                                Default Complaint Escalation Time (Hours)
                                            </label>
                                            <input
                                                type="number"
                                                id="escalationTime"
                                                name="escalationTime"
                                                value={formData.escalationTime}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="requireRefundReview" className="block text-sm font-semibold text-gray-800 mb-2">
                                                Require Manager Review for Refunds?
                                            </label>
                                            <select
                                                id="requireRefundReview"
                                                name="requireRefundReview"
                                                value={formData.requireRefundReview}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="yes">
                                                    Yes, always required.
                                                </option>
                                                <option value="no">
                                                    No,allow auto-refund under limit.
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        
                        
                    )}
                    {selectedTab === "deliveryZones" && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Delivery Zones</h2>
                            <p className="text-gray-500">Manage and configure the delivery zones for your operations.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}