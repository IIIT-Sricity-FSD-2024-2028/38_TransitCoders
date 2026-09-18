import { IconRefresh, IconClipboard, IconAlert } from '../../components/icons.jsx';
import { calculatePriority } from './data/mockData.js';

/**
 * Stats row — React port of renderDispatchStats() in
 * front-end/hub-manager/js/dispatch.js. Receives orders via props.
 */
export default function DispatchStats({ orders }) {
  const total = orders.length;
  const pending = orders.filter((o) => o.status === 'Pending').length;
  const highPriority = orders.filter(
    (o) => calculatePriority(o) === 'HIGH'
  ).length;
  const autoAssigned = total - pending;

  const stats = [
    {
      tone: 'blue',
      label: 'Auto Assigned Orders',
      value: autoAssigned,
      sub: 'System assigned successfully',
      icon: <IconRefresh />,
    },
    {
      tone: 'orange',
      label: 'Pending Assignments',
      value: pending,
      sub: 'Require manual review',
      icon: <IconClipboard />,
    },
    {
      tone: 'red',
      label: 'High Priority Orders',
      value: highPriority,
      sub: 'Immediate dispatch needed',
      icon: <IconAlert />,
    },
  ];

  return (
    <div className="hm-dispatch-stats">
      {stats.map((s) => (
        <div className="hm-dstat-card" key={s.label}>
          <div className={`hm-dstat-icon ${s.tone}`}>{s.icon}</div>
          <div className="hm-dstat-title">{s.label}</div>
          <div className="hm-dstat-val">{s.value}</div>
          <div className="hm-dstat-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}