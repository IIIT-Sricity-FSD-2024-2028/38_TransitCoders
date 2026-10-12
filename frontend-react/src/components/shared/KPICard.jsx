
export default function KPICard({ title, value, isicon, color= "bg-blue-50 text-blue-500", icon }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            {isicon && (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
                    {icon}
                </div>)
            }
            <div>
                <p className="text-xs font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    )
}