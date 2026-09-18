export default function RecentActivity(props){
    return(
        <div>
            <h3>Recent Activity</h3>
            <ul>
                {props.activities.map((item) => (
                <li key={item.id} style={{ margin: '12px 0', listStyle: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <strong>{item.id}</strong>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>{item.address}</p>
                    </div>
                    <span>{item.status}</span>
                    </div>
                </li>
                ))}
            </ul>
        </div>
    )   
}