function StatCard(props){
    return(
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-500">{props.label}</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{props.value}</h2>
        </div>
    )
}

export default StatCard;