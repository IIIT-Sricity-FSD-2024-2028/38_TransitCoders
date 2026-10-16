import React from 'react';

/**
 * StatCard component
 * @param {Object} props
 * @param {string} props.title - Metric title (e.g., 'Total Orders')
 * @param {string|number} props.value - Display value
 * @param {string} [props.subtitle] - Optional helper text
 * @param {React.ReactNode} [props.icon] - Icon element
 * @param {string} [props.trend] - Optional trend indicator (e.g. '+12%')
 * @param {string} [props.accentColor] - Accent border/color
 */
export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  accentColor = 'border-orange-500' 
}) {
  return (
    <div className={`bg-white rounded-xl p-5 border-l-4 ${accentColor} shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        {trend && (
          <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      )}
    </div>
  );
}
