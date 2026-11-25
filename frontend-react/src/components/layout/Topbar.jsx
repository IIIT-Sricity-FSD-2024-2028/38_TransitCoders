import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, PersonCircle } from 'react-bootstrap-icons';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../../shared/notifications/notificationsHooks';
import './TopBar.css';

function Notifications({ orderPath }) {
    const [open, setOpen] = useState(false);
    const [actionError, setActionError] = useState('');
    const menu = useRef(null);

    const { data: unread = 0, refetch: refetchCount } = useUnreadCount({ pollingInterval: 30_000 });
    // The feed is only loaded (and kept fresh) while the menu is open.
    const {
        data: items,
        isLoading: loadingItems,
        isFetching: fetchingItems,
        error: listError,
    } = useNotifications({ skip: !open });

    const [triggerMarkRead, { isLoading: markingOne }] = useMarkNotificationRead();
    const [triggerMarkAll, { isLoading: markingAll }] = useMarkAllNotificationsRead();

    const saving = markingOne || markingAll;
    const error = actionError || listError?.message || '';

    useEffect(() => {
        if (!open) return;
        const outside = event => {
            if (!menu.current?.contains(event.target)) setOpen(false);
        };
        const escape = event => { if (event.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [open]);

    function toggle() {
        if (open) { setOpen(false); return; }
        setActionError('');
        setOpen(true);
        refetchCount();
    }

    async function markRead(id) {
        if (saving) return;
        setActionError('');
        try {
            if (id) await triggerMarkRead(id).unwrap();
            else await triggerMarkAll().unwrap();
        } catch (err) {
            setActionError(err.message);
        }
    }

    return (
        <div ref={menu} className="relative">
            <button type="button" className="topbar-icon-button relative" aria-label="Notifications" aria-expanded={open} onClick={toggle}>
                <Bell size={19} />
                {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
            </button>
            {open && <section aria-label="Notification feed" className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-6rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-3">
                    <h2 className="text-sm font-semibold">Notifications</h2>
                    {unread > 0 && <button type="button" className="text-xs font-medium text-orange-700" disabled={saving} onClick={() => markRead()}>Mark all as read</button>}
                </div>
                {error && <p role="alert" className="p-3 text-sm text-red-700">{error}</p>}
                {(loadingItems || (fetchingItems && !items) || (!items && !error)) && <p role="status" className="p-3 text-sm text-gray-500">Loading notifications…</p>}
                {items?.length === 0 && <p className="p-3 text-sm text-gray-500">No notifications yet.</p>}
                <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
                    {items?.map(item => <li key={item.id} className={`space-y-1 p-3 text-sm ${item.isRead ? '' : 'bg-orange-50'}`}>
                        <p>{item.message}</p>
                        <div className="flex flex-wrap gap-x-3 text-xs text-gray-600">
                            <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('en-IN')}</time>
                            {orderPath && item.orderId && <Link to={orderPath(item.orderId)} className="font-semibold text-orange-700" onClick={() => setOpen(false)}>View shipment</Link>}
                            {!item.isRead && <button type="button" disabled={saving} onClick={() => markRead(item.id)} className="font-medium text-orange-700">Mark read</button>}
                        </div>
                    </li>)}
                </ul>
            </section>}
        </div>
    );
}

export default function Topbar({ title = 'SwiftTrack', statusBadge, profilePath, notificationOrderPath }) {
    return (
        <header className="topbar shrink-0">
            <p className="topbar-title">{title}</p>
            <div className="topbar-actions">
                {statusBadge}
                <Notifications orderPath={notificationOrderPath} />
                {profilePath && <Link to={profilePath} className="topbar-icon-button" aria-label="View Profile"><PersonCircle size={22} /></Link>}
            </div>
        </header>
    );
}
