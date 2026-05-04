/* js/utils/ui.js – Shared UI utilities: toast, modal, confirm dialog */

/* ══════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════ */
const Toast = (() => {
  let timer;
  function show(msg, type = 'success') {
    const el  = document.getElementById('toast');
    const msg_el = document.getElementById('toast-msg');
    const icon_el = document.getElementById('toast-icon');
    if (!el) return;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    icon_el.textContent = icons[type] || '✓';
    msg_el.textContent  = msg;
    el.style.background = type === 'error' ? '#DC2626' : type === 'warning' ? '#D97706' : '';
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), 3000);
  }
  return { show };
})();

// Legacy alias used throughout the app
function showToast(msg, type) { Toast.show(msg, type); }


/* ══════════════════════════════════════════
   GENERIC MODAL
══════════════════════════════════════════ */
const Modal = (() => {
  function open(id)  { document.getElementById(id)?.classList.add('open'); }
  function close(id) { document.getElementById(id)?.classList.remove('open'); }
  function closeAll()  { document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); }

  // Close on overlay click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeAll();
  });
  return { open, close, closeAll };
})();


/* ══════════════════════════════════════════
   CONFIRM DIALOG
══════════════════════════════════════════ */
const Confirm = (() => {
  let _resolve;

  function show(title, msg) {
    return new Promise(resolve => {
      _resolve = resolve;
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-msg').textContent   = msg;
      document.getElementById('confirm-overlay').classList.add('open');
    });
  }

  // Wire buttons after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('confirm-ok')?.addEventListener('click', () => {
      document.getElementById('confirm-overlay').classList.remove('open');
      if (_resolve) { _resolve(true); _resolve = null; }
    });
    document.getElementById('confirm-cancel')?.addEventListener('click', () => {
      document.getElementById('confirm-overlay').classList.remove('open');
      if (_resolve) { _resolve(false); _resolve = null; }
    });
  });

  return { show };
})();


/* ══════════════════════════════════════════
   SEARCH FILTER UTILITY
══════════════════════════════════════════ */
function filterTableBySearch(inputId, tableBodyId) {
  const q = document.getElementById(inputId)?.value.toLowerCase() || '';
  document.querySelectorAll(`#${tableBodyId} tr`).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
