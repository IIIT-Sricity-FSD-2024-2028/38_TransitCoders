function StatCard(props){
    return(
        <div>
            <p>{props.label}</p>
            <h2>{props.value}</h2>
        </div>
    )
}

export default StatCard;