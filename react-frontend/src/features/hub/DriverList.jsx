import DriverCard from './DriverCard.jsx';

/**
 * Renders the delivery agents passed down from Dispatch.jsx via props.
 * Uses the same .modal-agent-list / .modal-agent-card markup as the
 * vanilla app's Override Assignment modal (openOverrideModal in
 * front-end/hub-manager/js/dispatch.js).
 */
export default function DriverList({ drivers, selectedDriver, onSelectDriver }) {
  if (!drivers.length) {
    return (
      <div className="hm-empty-state">
        <div className="hm-empty-title">No Agents Available</div>
        <div className="hm-empty-msg">
          No delivery agents are registered to this hub yet.
        </div>
      </div>
    );
  }

  return (
    <div className="modal-agent-list">
      {drivers.map((driver) => (
        <DriverCard
          key={driver.agent_id}
          driver={driver}
          selected={selectedDriver?.agent_id === driver.agent_id}
          onSelect={onSelectDriver}
        />
      ))}
    </div>
  );
}