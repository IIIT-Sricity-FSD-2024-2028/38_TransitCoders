
import "./StatsCard.css";

export default function StatsCard({ stats }) {
    return (
        <div className="stats-card">
            <div className="stats-icon">{stats.icon}</div>
            <p className="stats-label">{stats.label}</p>
            <h2 className="stats-value">{stats.value}</h2>
            <p className="stats-subtitle">{stats.sub}</p>
        </div>
    );
}
