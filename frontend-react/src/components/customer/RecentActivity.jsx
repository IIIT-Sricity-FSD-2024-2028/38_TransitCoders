export default function RecentActivity(props){
    return(
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
            <ul className="divide-y divide-gray-100">
                {props.activities.map((item) => (
                <li key={item.id} className="py-3 flex justify-between items-center">
                    <div>
                        <strong className="text-sm font-semibold text-orange-600">{item.id}</strong>
                        <p className="text-xs text-gray-500">{item.address}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                        {item.status}
                    </span>
                </li>
                ))}
            </ul>
        </div>
    )   
}