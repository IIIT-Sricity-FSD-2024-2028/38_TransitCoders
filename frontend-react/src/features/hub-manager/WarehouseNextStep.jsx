import { Link } from 'react-router-dom';
import { warehouseStep } from './warehouseWorkflow';

export default function WarehouseNextStep({ order, hubId }) {
  const step = warehouseStep(order, hubId);
  if (!step) return null;
  return (
    <div className="my-3 rounded-lg bg-orange-50 p-3 text-sm text-gray-800">
      <div>{step.text}</div>
      {step.to && <Link to={step.to} className="mt-1 inline-block font-semibold text-orange-800 underline">{step.label}</Link>}
    </div>
  );
}
