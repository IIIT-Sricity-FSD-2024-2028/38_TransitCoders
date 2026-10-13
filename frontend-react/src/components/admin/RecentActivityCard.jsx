import { Link } from 'react-router-dom';

export default function RecentActivityCard({ title, viewAllLink, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
            {/* header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                    >View All</Link>
                )}
            </div>
            {/* content */}
            <div className="flex flex-col gap-3">
                {children}
            </div>
        </div>
    )
}