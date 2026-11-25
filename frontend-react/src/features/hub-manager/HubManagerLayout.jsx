import Sidebar, { SidebarItem } from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { Boxes, Diagram3, ExclamationCircle, GraphUp, Grid, Truck, UpcScan } from "react-bootstrap-icons";
import { getSessionUser } from "../../services/session";
import "./HubManagerLayout.css";

export default function HubManagerLayout({ title, children }) {
  const user = getSessionUser();

  return (
    <div className="hm-layout">
      <Sidebar
        user={{
          name: user.name || "Hub Manager",
          role: "Hub Manager"
        }}
      >
        <SidebarItem icon={<Grid size={18} />} text="Dashboard" to="/hub/dashboard" />
        <SidebarItem icon={<Boxes size={18} />} text="Order Queue" to="/hub/queue" />
        <SidebarItem icon={<UpcScan size={18} />} text="Warehouse" to="/hub/warehouse" />
        <SidebarItem icon={<Truck size={18} />} text="Dispatch" to="/hub/dispatch" />
        <SidebarItem icon={<Diagram3 size={18} />} text="Hub Transfer" to="/hub/transfer" />
        <SidebarItem icon={<ExclamationCircle size={18} />} text="Complaints" to="/hub/complaints" />
        <SidebarItem icon={<GraphUp size={18} />} text="Reports" to="/hub/reports" />
      </Sidebar>

      <div className="hm-main">
        <Topbar title={title} notificationOrderPath={id => `/hub/queue?id=${encodeURIComponent(id)}`} />

        <main className="hm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
