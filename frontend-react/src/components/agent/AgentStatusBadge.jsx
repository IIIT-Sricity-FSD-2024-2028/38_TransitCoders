import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check2 } from 'react-bootstrap-icons';

const STATUS_OPTIONS = [
    { 
        key: 'Available',
        label: 'Available', 
        desc: 'Ready for pickups',
        dotColor: 'bg-emerald-500', 
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        pulse: 'animate-pulse'
    },
    { 
        key: 'Busy',
        label: 'On Delivery', 
        desc: 'En route with loads',
        dotColor: 'bg-blue-500', 
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        pulse: 'animate-pulse'
    },
    { 
        key: 'Offline',
        label: 'Offline', 
        desc: 'On break / inactive',
        dotColor: 'bg-gray-400', 
        badgeBg: 'bg-gray-100 text-gray-600 border-gray-200',
        pulse: ''
    }
];

export default function AgentStatusBadge({ status, onStatusChange, saving }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (newStatus) => {
        setIsOpen(false);
        onStatusChange(newStatus);
    };

    const currentConfig = STATUS_OPTIONS.find(o => o.key === status) || STATUS_OPTIONS[0];

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                disabled={saving}
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm cursor-pointer ${currentConfig.badgeBg}`}
                title="Click to toggle availability status"
            >
                <span className={`w-2 h-2 rounded-full ${currentConfig.dotColor} ${currentConfig.pulse}`} />
                <span>{currentConfig.label}</span>
                <ChevronDown size={11} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in text-xs">
                    <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Set Dispatch Status
                    </div>
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleSelect(opt.key)}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                status === opt.key ? 'bg-orange-50/60 text-orange-900 font-semibold' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                                <div>
                                    <p className="font-semibold">{opt.label}</p>
                                    <p className="text-[10px] text-gray-400">{opt.desc}</p>
                                </div>
                            </div>
                            {status === opt.key && <Check2 size={14} className="text-orange-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
