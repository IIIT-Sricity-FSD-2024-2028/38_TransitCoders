import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import StatsCard from './StatsCard';

import "./DashBoard.css";
import OrderCard from './OrderCard';

import {API} from '../../services/api'




export default function DashBoard() {
    const [orders,setOrders] = useState([]);
    const [activeFilter , setActiveFilter] = useState("All");
    const [loading,setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        async function loadOrders(){
            try
            {const result = await API.orders.getAll();

            if(result == null){
                setError("Could not load orders. Check the backend and login.");
            }else if (!Array.isArray(result)){
                setError("the API returned an unexpected order format");
            }else{
                setOrders(result);
            }}

            catch(err){
                setError("an unexpected error occurred while loading orders.");
            }finally{
            setLoading(false);
            }
        }

        loadOrders();

    },[]);


    const filteredOrders = activeFilter === "All" ? (
                        orders
                    ) : (
                        orders.filter(order => order.status === activeFilter)
                    );
    return(
        <div className = "dashboard">
            <Sidebar user = {{name : "Hub Manager" , role : "Hub Manager"}}/>

            <div className = "dashboard-main">
                <Topbar title ="Hub Operations Dashboard"/>
                <main className = "dashboard-content">
                    <h1>Operations Dashboard</h1>
                    <p>Overview of hub operations and orders</p>


                    {
                        loading === true ? (
                            <p className = "loading-orders-text">loading orders.....</p>
                        ):(
                            <></>
                        )
                    }

                    {
                      (error) ? (
                        <p>{error}</p>
                      ):(
                        <></>
                      )
                    }

                    {
                        ((!loading && !error))?
                        (
                            <>
                            <div className = "stats-container">
                        <StatsCard
                            stats={{
                                label: "Active Orders",
                                value: 12,
                                sub: "Current orders",
                                icon: "orange"
                            }}
                        />
                        <StatsCard
                            stats={{
                                label: "Pending Orders",
                                value: 5,
                                sub: "Waiting for assignment",
                                icon: "orange"
                            }}
                        />
                        <StatsCard
                            stats={{
                                label: "Available Agents",
                                value: 8,
                                sub: "Ready for delivery",
                                icon: "green"
                            }}
                        />
                        <StatsCard
                            stats={{
                                label: "Average Delivery",
                                value: "38 min",
                                sub: "Average time",
                                icon: "blue"
                            }}
                        />

                    </div>


                    <div className = "order-filters">
                        <button onClick = {() => setActiveFilter("All")}>All</button>
                        <button onClick = {() => setActiveFilter("Pending")}>Pending</button>
                        <button onClick={() => setActiveFilter("InTransit")}>In Transit</button>
                        <button onClick = {() => setActiveFilter("Delivered")}>Delivered</button>
                    </div>
                    {
                    filteredOrders.map(order => {
                            return (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAssign={() => console.log("assigned", order.orderId)}
                                    onTransfer={() => console.log("transferred", order.orderId)}
                                    onView={() => console.log("viewed", order.orderId)}
                                />
                            );
                        })
                    }
                    </>

                        ):(<>
                        </>)
                    }
                </main>
            </div>
        </div>

    );
}
