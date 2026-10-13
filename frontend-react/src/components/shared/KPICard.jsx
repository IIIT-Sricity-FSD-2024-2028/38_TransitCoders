
export default function KPICard({ title, 
    value, 
    isicon, 
    iconcolor= "bg-blue-50 text-blue-500", 
    icon, isCurrency=false, 
    valueColor = "text-gray-900" }) 
    {
        const displayValue = isCurrency && !isNaN(Number(value))
        ? `₹${Number(value).toFixed(2)}` 
        : value;
        return (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                {isicon && (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconcolor} shrink-0`}>
                        {icon}
                    </div>)
                }
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {title}
                    </p>
                    <p className={`text-2xl font-bold ${valueColor}`}>
                        {displayValue}
                    </p>
                </div>
            </div>
        )
    }