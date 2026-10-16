
import "./StatsCard.css";

export default function StatsCard({ stats }) {
    return (
        <div className="stats-card">
            <i className={`bi ${stats.icon} stats-icon`}></i>
            <p className="stats-label">{stats.label}</p>
            <h2 className="stats-value">{stats.value}</h2>
            <p className="stats-subtitle">{stats.sub}</p>
        </div>
    );
}
