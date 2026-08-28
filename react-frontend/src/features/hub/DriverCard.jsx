/**
 * One selectable driver card — same markup as the agent cards in the
 * vanilla app's Override Assignment modal (openOverrideModal in
 * front-end/hub-manager/js/dispatch.js).
 *
 * Child-to-parent callback: the Select button (or the card itself)
 * invokes onSelect(driver), which the parent uses to update selectedDriver.
 */
export default function DriverCard({ driver, selected, onSelect }) {
  const taskTone = (driver.tasks_count || 0) <= 1 ? 'green' : 'orange';

  return (
    <div
      className={`modal-agent-card${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(driver)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(driver);
      }}
    >
      <div className="modal-agent-info">
        <div className="modal-agent-name">{driver.name}</div>
        <div className="modal-agent-meta">
          <div className="modal-meta-item">{driver.vehicle_type}</div>
          <div className="modal-meta-item">{driver.status}</div>
        </div>
        <div className={`modal-agent-tasks ${taskTone}`}>
          {driver.tasks_count || 0} active tasks
        </div>
      </div>
      <button
        type="button"
        className="hm-btn-small"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(driver);
        }}
      >
        {selected ? 'Selected' : 'Select'}
      </button>
    </div>
  );
}