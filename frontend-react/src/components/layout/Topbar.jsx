import { Link } from "react-router-dom";
import { Search, Bell, PersonCircle } from "react-bootstrap-icons";
import "./TopBar.css";

function Topbar({ 
    title = "Dashboard", 
    statusBadge,
    showSearch = true,
    showNotification = true,
    showProfile = true,
    onProfileClick,
    profilePath
}) {
    return (
        <header className="topbar">
            <h1 className="topbar-title">{title}</h1>

            <div className="topbar-actions">
                {showSearch && (
                    <div className="topbar-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                        />
                    </div>
                )}

                {statusBadge && (
                    <div className="topbar-status-wrapper">
                        {statusBadge}
                    </div>
                )}

                {showNotification && (
                    <button
                        type="button"
                        className="topbar-icon-button"
                        title="Notifications"
                        aria-label="Notifications"
                    >
                        <Bell size={19} />
                    </button>
                )}

                {showProfile && (
                    profilePath ? (
                        <Link
                            to={profilePath}
                            className="topbar-icon-button"
                            title="View Profile"
                            aria-label="View Profile"
                        >
                            <PersonCircle size={22} />
                        </Link>
                    ) : (
                        <button
                            type="button"
                            className="topbar-icon-button"
                            title="Profile"
                            aria-label="Profile"
                            onClick={onProfileClick}
                        >
                            <PersonCircle size={22} />
                        </button>
                    )
                )}
            </div>
        </header>
    );
}

export default Topbar;
