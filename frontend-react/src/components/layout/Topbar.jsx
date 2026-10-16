
import { Search, Bell, PersonCircle } from "react-bootstrap-icons";
import "./TopBar.css";

function Topbar({ title = "Dashboard", statusBadge }) {
    return (
        <header className="topbar">
            <h1 className="topbar-title">{title}</h1>

            <div className="topbar-actions">
                <div className="topbar-search">
                    <Search size={16} />

                    <input
                        type="text"
                        placeholder="Search..."
                    />
                </div>

                {statusBadge && (
                    <div className="topbar-status-wrapper">
                        {statusBadge}
                    </div>
                )}

                <button
                    type="button"
                    className="topbar-icon-button"
                >
                    <Bell size={19} />
                </button>

                <button
                    type="button"
                    className="topbar-icon-button"
                >
                    <PersonCircle size={22} />
                </button>
            </div>
        </header>
    );
}

export default Topbar;
