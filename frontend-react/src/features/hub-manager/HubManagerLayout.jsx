import Sidebar, { SidebarItem } from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import "./HubManagerLayout.css";

export default function HubManagerLayout({ title, children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="hm-layout">
      <Sidebar
        user={{
          name: user.name || "Hub Manager",
          role: "Hub Manager"
        }}
      >
        <SidebarItem text="Dashboard" to="/hub/dashboard" />
        <SidebarItem text="Order Queue" to="/hub/queue" />
        <SidebarItem text="Dispatch" to="/hub/dispatch" />
        <SidebarItem text="Hub Transfer" to="/hub/transfer" />
        <SidebarItem text="Reports" to="/hub/reports" />
      </Sidebar>

      <div className="hm-main">
        <Topbar title={title} />

        <main className="hm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
