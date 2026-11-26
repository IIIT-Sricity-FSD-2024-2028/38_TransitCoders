import { useEffect } from 'react';
import { CheckCircleFill, ExclamationCircleFill, InfoCircleFill, X } from 'react-bootstrap-icons';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
    // Auto-dismiss timer using useEffect with cleanup
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const styles = {
        success: 'bg-emerald-900/90 text-white border-emerald-700 shadow-emerald-900/20',
        error: 'bg-red-900/90 text-white border-red-700 shadow-red-900/20',
        info: 'bg-gray-900/90 text-white border-gray-700 shadow-gray-900/20'
    };

    const icons = {
        success: <CheckCircleFill className="text-emerald-400 shrink-0" size={18} />,
        error: <ExclamationCircleFill className="text-red-400 shrink-0" size={18} />,
        info: <InfoCircleFill className="text-blue-400 shrink-0" size={18} />
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-sm font-medium ${styles[type] || styles.info}`}>
                {icons[type] || icons.info}
                <span className="leading-snug pr-2">{message}</span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer text-gray-300 hover:text-white"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
