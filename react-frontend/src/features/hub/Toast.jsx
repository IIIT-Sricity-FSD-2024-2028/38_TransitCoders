import { useEffect, useState } from 'react';
import { IconCheck, IconX } from '../../components/icons.jsx';

function ToastIcon({ type }) {
  if (type === 'success') return <IconCheck />;
  if (type === 'error') return <IconX />;
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/**
 * Toast — React port of showToast() in
 * front-end/hub-manager/js/hub-manager.js (same markup: .hm-toast-container
 * > .hm-toast.hm-toast-{type}, auto-dismiss after 3s).
 */
export function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => onDone(), 3000);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div className="hm-toast-container">
      <div className={`hm-toast hm-toast-${toast.type}`}>
        <ToastIcon type={toast.type} />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

/**
 * Success tick — React port of showSuccessTick() (same markup:
 * .hm-success-pop > .hm-success-icon + .hm-success-text, ~1.8s).
 */
export function SuccessTick({ message, onDone }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!message) return undefined;
    setShow(false);
    const showT = setTimeout(() => setShow(true), 10);
    const hideT = setTimeout(() => {
      setShow(false);
      onDone();
    }, 1800);
    return () => {
      clearTimeout(showT);
      clearTimeout(hideT);
    };
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className={`hm-success-pop${show ? ' show' : ''}`}>
      <div className="hm-success-icon">
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="hm-success-text">{message}</div>
    </div>
  );
}