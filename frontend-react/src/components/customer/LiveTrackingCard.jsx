import { useNavigate } from "react-router-dom"

export default function LiveTrackingCard(props){
    const navigate=useNavigate();
    return(
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3"> 
            <h1 className="text-xs font-bold text-orange-500 uppercase">Live tracking</h1>
            <h2 className="text-xl font-bold text-gray-900">Order#{props.order.id}</h2>
            <p className="text-sm text-gray-500">{props.order.address}</p>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <small className="text-gray-400 block">Status</small>
                <p className="font-semibold text-gray-800">{props.order.status}</p>
                <small className="text-gray-400 block">Agent</small>
                <p className="font-semibold text-gray-800">{props.order.agent}</p>
            </div>
            <button onClick={()=>navigate('/customer/tracking')} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 cursor-pointer">Track Now</button>
        </div>
    )
}