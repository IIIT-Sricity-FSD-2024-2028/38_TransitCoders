export default function LiveTrackingCard(props){
    return(
        <div>
            <h1>Live tracking</h1>
            <h2>Order#{props.order.id}</h2>
            <p>{props.order.address}</p>
            <div>
                <small>Status</small>
                <p>{props.order.status}</p>
                <small>Agent</small>
                <p>{props.order.agent}</p>
            </div>
            <button>Track Now</button>
        </div>
    )
}