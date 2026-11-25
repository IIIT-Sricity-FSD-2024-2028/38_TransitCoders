import { useEffect, useState } from 'react';
import { API } from '../../../services/api';
import { getSessionUser } from '../../../services/session';
import './AssignAgentModal.css';

const canTakeDelivery = agent => agent.availabilityStatus === 'Available' && agent.currentTasksCount < agent.taskCapacity;

export default function AssignAgentModal({ order, isOpen, ...props }) {
  return isOpen && order ? <Assignment key={order.id} order={order} {...props} /> : null;
}

function Assignment({ order, onClose, onSuccess }) {
  const hubId = getSessionUser().hubId;
  const [agents, setAgents] = useState(null);
  const [agentId, setAgentId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const available = agents?.some(canTakeDelivery);
  const selected = agents?.find(agent => agent.userId === agentId);

  useEffect(() => {
    let active = true;
    API.hubs.getAgentsForHub(hubId).then(data => {
      if (active) setAgents(data);
    }, err => {
      if (active) setLoadError(err.message);
    });
    return () => { active = false; };
  }, [hubId]);

  async function assign(auto) {
    if (assigning || (auto ? !available : !selected || !canTakeDelivery(selected))) return;
    setError('');
    setAssigning(true);
    try {
      if (auto) await API.orders.autoAssign(order.id);
      else await API.orders.assign(order.id, agentId);
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
      if (err.status === 409 || err.status === 400) {
        API.hubs.getAgentsForHub(hubId).then(setAgents, () => {});
      }
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="assign-title" className="assign-modal-overlay">
      <div className="assign-modal">
        <h2 id="assign-title">Assign Agent</h2>
        <p>Order {order.orderId}</p>
        {loadError && <p role="alert">{loadError}</p>}
        {!agents && !loadError && <p role="status">Loading available agents…</p>}
        {agents && !available && <p>No available agents have capacity at your hub.</p>}
        {agents?.length > 0 && <select aria-label="Delivery agent" value={agentId} onChange={event => setAgentId(event.target.value)} disabled={assigning}>
          <option value="">Select an agent</option>
          {agents.map(agent => <option key={agent.userId} value={agent.userId} disabled={!canTakeDelivery(agent)}>
            {agent.name} ({agent.currentTasksCount}/{agent.taskCapacity} active{agent.availabilityStatus !== 'Available' ? `, ${agent.availabilityStatus}` : ''})
          </option>)}
        </select>}
        {error && <p role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={assigning} onClick={onClose}>Cancel</button>
          <button type="button" disabled={assigning || !available} onClick={() => assign(true)}>Auto-assign</button>
          <button type="button" disabled={assigning || !selected || !canTakeDelivery(selected)} onClick={() => assign(false)}>{assigning ? 'Assigning…' : 'Assign'}</button>
        </div>
      </div>
    </div>
  );
}
