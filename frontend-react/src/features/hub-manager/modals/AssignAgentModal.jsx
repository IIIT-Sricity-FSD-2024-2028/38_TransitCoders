import { useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { selectCurrentUser } from '../../../shared/auth/authSlice';
import { useHubAgents, useAssignAgent, useAutoAssignAgent } from '../hubManagerHooks';
import './AssignAgentModal.css';

const canTakeDelivery = agent => agent.availabilityStatus === 'Available' && agent.currentTasksCount < agent.taskCapacity;

export default function AssignAgentModal({ order, isOpen, ...props }) {
  return isOpen && order ? <Assignment key={order.id} order={order} {...props} /> : null;
}

function Assignment({ order, onClose, onSuccess }) {
  const hubId = useAppSelector(selectCurrentUser)?.hubId;
  const {
    data: agents,
    error: loadErrObj,
    refetch: refetchAgents,
  } = useHubAgents(hubId, { skip: !hubId });
  const [triggerAssignAgent, { isLoading: assigningManual }] = useAssignAgent();
  const [triggerAutoAssign, { isLoading: assigningAuto }] = useAutoAssignAgent();

  const [agentId, setAgentId] = useState('');
  const [error, setError] = useState('');
  const loadError = loadErrObj?.message || '';
  const assigning = assigningManual || assigningAuto;
  const available = agents?.some(canTakeDelivery);
  const selected = agents?.find(agent => agent.userId === agentId);

  async function assign(auto) {
    if (assigning || (auto ? !available : !selected || !canTakeDelivery(selected))) return;
    setError('');
    try {
      if (auto) await triggerAutoAssign(order.id).unwrap();
      else await triggerAssignAgent({ id: order.id, agentId }).unwrap();
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
      if (err.status === 409 || err.status === 400) {
        refetchAgents();
      }
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
