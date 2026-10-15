import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import StatsCard from './StatsCard';
import AssignAgentModal from "./modals/AssignAgentModal";
import TransferHubModal from "./modals/TransferHubModal";
import OrderDetailsModal from "./modals/OrderDetailsModal";

import "./DashBoard.css";
import OrderCard from './OrderCard';

import {API} from '../../services/api'




export default function DashBoard() {
    const [orders,setOrders] = useState([]);
    const [activeFilter , setActiveFilter] = useState("All");
    const [loading,setLoading] = useState(true);
    const [error, setError] = useState("");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const [availableAgents, setAvailableAgents] = useState(0);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedTransferOrder, setSelectedTransferOrder] = useState(null);
    
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedViewOrder, setSelectedViewOrder] = useState(null);


    const deliveredOrders = orders.filter(order => {
        return order.status === "Delivered";
    }).length;
    


    async function loadAvailableAgents() {
        try{
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            if(!user.hubId){
                setAvailableAgents(0);
                return;
            }

            const agents = await API.hubs.getAgentsForHub(user.hubId);

            if(Array.isArray(agents)){
                setAvailableAgents(
                    agents.filter(agent => agent.availabilityStatus === "Available").length
                );
            }
        }
        catch (err) {
        console.error("could not load available agents:", err);
    }
    }


    async function refreshOrders() {
        const result = await API.orders.getAll();

        if(Array.isArray(result)){
            setOrders(result);
        }
    }


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
        loadAvailableAgents();
    },[]);


    const filteredOrders = activeFilter === "All" ? (
                        orders
                    ) : (
                        orders.filter(order => order.status === activeFilter)
                    );
    const activeOrders = orders.filter(order => ["Pending", "Assigned", "InTransit", "OutForDelivery"].includes(order.status)).length;
    const pendingOrders = orders.filter(order => order.status === "Pending").length;

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
                                value: activeOrders,
                                sub: "Current orders",
                                icon: "bi-box-seam"
                            }}
                        />
                        <StatsCard
                            stats={{
                                label: "Pending Orders",
                                value: pendingOrders,
                                sub: "Waiting for assignment",
                                icon: "bi-clock-history"
                            }}
                        />
                        <StatsCard
                            stats={{
                                label: "Available Agents",
                                value: availableAgents,
                                sub: "Ready for delivery",
                                icon: "bi-people"
                            }}
                        />
                        <StatsCard
                            stats={{
                                label: "Delivered Orders",
                                value: deliveredOrders,
                                sub: "Successfully delivered",
                                icon: "bi-check-circle"
                            }}
                        />

                    </div>


                    <div className = "order-filters">
                       {["All", "Pending", "Assigned", "InTransit", "OutForDelivery", "Delivered"].map(status => {
                        return <button
                        key = {status}
                        className= {activeFilter === status ? "active" : ""}
                        onClick={() => setActiveFilter(status)}
                        >

                            {{

                            All: "All",
                            Pending: "Pending",
                            Assigned: "Assigned",
                            InTransit: "In Transit",
                            OutForDelivery: "Out for Delivery",
                            Delivered: "Delivered"

                        }[status]}
                        </button>
                       })}
                    </div>




                    {
                    filteredOrders.length === 0 ? 
                    (
                    <p className="empty-orders-text">
                         No orders found for this status.
                    </p>) : 
                    (filteredOrders.map(order => {
                            return (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAssign={() => {
                                      setSelectedOrder(order);
                                      setShowAssignModal(true);
                                    }}
                                    onTransfer= {
                                        order.pickupHubId === currentUser.hubId && ! ["Delivered", "Cancelled", "Returned", "Failed"].includes(order.status)
                                        ? () => {
                                            setSelectedTransferOrder(order);
                                            setShowTransferModal(true);
                                    } 
                                    : undefined
                                }
                                    onView={() => {
                                        setSelectedViewOrder(order);
                                        setShowDetailsModal(true);
                                    }}
                                />
                            );
                        })
                    )
                    }
                    </>

                        ):(<>
                        </>)
                    }
                </main>

                <AssignAgentModal
                  order={selectedOrder}
                  isOpen={showAssignModal}
                  onClose={() => setShowAssignModal(false)}
                  onSuccess={refreshOrders}
                />

                <TransferHubModal
                  order={selectedTransferOrder}
                  isOpen={showTransferModal}
                  onClose={() => setShowTransferModal(false)}
                  onSuccess={refreshOrders}
                />

                <OrderDetailsModal
                  order={selectedViewOrder}
                  isOpen={showDetailsModal}
                  onClose={() => setShowDetailsModal(false)}
                />
            </div>


        </div>

    );
}                                                                                   