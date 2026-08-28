import { useEffect, useState } from 'react';
import DispatchStats from './DispatchStats.jsx';
import OrderList from './OrderList.jsx';
import DispatchPanel from './DispatchPanel.jsx';
import OverrideModal from './OverrideModal.jsx';
import OrderDetailModal from './OrderDetailModal.jsx';
import ChangeDestinationModal from './ChangeDestinationModal.jsx';
import MapModal from './MapModal.jsx';
import { Toast, SuccessTick } from './Toast.jsx';
import {
  initialOrders,
  initialDrivers,
  hubs,
  getHubName,
} from './data/mockData.js';
import dispatchMap from './assets/dispatch-map.png';

/**
 * Hub Manager — Dispatch & Assignment Control.
 * Faithful React conversion of front-end/hub-manager/dispatch.html
 * + js/dispatch.js (+ the shared helpers it uses from hub-manager.js).
 *
 * Section order matches the original page exactly:
 *   1. .hm-page-header
 *   2. #dispatchStats        → DispatchStats
 *   3. "Orders Requiring Attention" + View All Queue link
 *   4. pending order cards   → OrderList/OrderCard (selection for the lab)
 *   5. #attentionContainer   → DispatchPanel (Override / View Details)
 *   6. .hm-dispatch-map      → dispatch-map.png
 *   7. .hm-brand-footer
 *   + the four original modals and toast/success-tick feedback
 *
 * LIFTED STATE (Lab 2): selectedOrder + selectedDriver live here in the
 * parent. OrderCard/DriverCard invoke child→parent callbacks; the
 * attention card and stats re-render from the parent state.
 */
export default function Dispatch() {
  // ── Page data (mock for Lab 2, original field names) ──
  const [orders, setOrders] = useState(initialOrders);
  const [drivers, setDrivers] = useState(initialDrivers);

  // ── LIFTED STATE ──
  const [selectedOrder, setSelectedOrder] = useState(
    initialOrders.find((o) => o.status === 'Pending') || null
  );
  const [selectedDriver, setSelectedDriver] = useState(null);

  // ── Modal state (one overlay open at a time, like the original) ──
  const [activeModal, setActiveModal] = useState(null); // 'override' | 'detail' | 'changeDest' | 'map'

  // ── Feedback (ports of showToast / showSuccessTick) ──
  const [toast, setToast] = useState(null);
  const [successTick, setSuccessTick] = useState(null);

  // ESC closes the open modal — same as the original keydown handler
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setActiveModal(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ── Child-to-parent callbacks ─────────────────────────────────
  function handleSelectOrder(order) {
    setSelectedOrder(order);
  }

  // Called by DriverCard inside the Override modal (port of
  // selectOverrideAgent: highlight the card, remember the agent)
  function handleSelectDriver(driver) {
    setSelectedDriver(driver);
  }

  // Port of openOverrideModal(): resets the pending agent choice
  function handleOpenOverride(order) {
    setSelectedOrder(order);
    setSelectedDriver(null);
    setActiveModal('override');
  }

  // Port of confirmOverride(): validation + assignment + feedback
  function handleConfirmOverride() {
    if (!selectedOrder || !selectedDriver) {
      setToast({ type: 'error', message: 'Select an agent first' });
      return;
    }

    const previousAgent = selectedOrder.assigned_agent || null;
    const assigned = {
      ...selectedOrder,
      status: 'Assigned',
      assigned_agent: selectedDriver.agent_id,
    };

    setOrders((prev) =>
      prev.map((o) => (o.order_id === assigned.order_id ? assigned : o))
    );
    // Port of adjustAgentTaskCounts()
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.agent_id === previousAgent) {
          return { ...d, tasks_count: Math.max(0, d.tasks_count - 1) };
        }
        if (d.agent_id === selectedDriver.agent_id) {
          return { ...d, tasks_count: d.tasks_count + 1 };
        }
        return d;
      })
    );

    setSelectedOrder(assigned);
    setActiveModal(null);
    setSuccessTick('Assignment overridden');
    setToast({
      type: 'success',
      message: `Agent overridden for ${assigned.order_id}`,
    });
  }

  // Port of viewOrderDetail()
  function handleViewDetails(order) {
    setSelectedOrder(order);
    setActiveModal('detail');
  }

  // Port of setOrderHub() + confirmChangeDestinationAction()
  function handleChangeDestination(hubId, reason) {
    if (!hubId || !reason) {
      setToast({ type: 'error', message: 'Please select both hub and reason' });
      return;
    }
    const hub = hubs.find((h) => h.hub_id === hubId);
    const updated = {
      ...selectedOrder,
      assigned_hub: hubId,
      pickup_hub_id: hubId,
      pickup_address: hub ? hub.name : hubId,
    };
    setOrders((prev) =>
      prev.map((o) => (o.order_id === updated.order_id ? updated : o))
    );
    setSelectedOrder(updated);
    setActiveModal(null);
    setSuccessTick('Destination updated');
    setToast({ type: 'success', message: 'Destination hub updated successfully' });
  }

  const pendingOrders = orders.filter((o) => o.status === 'Pending');

  // Order shown in the attention card — port of the original lookup
  // currentOrders.find(o => o.status === PENDING) in dispatch.js:
  // the selected order while it is still Pending, otherwise the first
  // pending order. When none are pending this is null, so ONLY the
  // "No Pending Orders" empty state renders — never an assigned order.
  const attentionOrder =
    selectedOrder && selectedOrder.status === 'Pending'
      ? selectedOrder
      : pendingOrders[0] || null;

  return (
    <div id="page-content">
      {/* PAGE HEADER — exact original markup */}
      <div className="hm-page-header">
        <div>
          <div className="hm-page-title">Dispatch & Assignment Control</div>
          <div className="hm-page-subtitle">
            Monitor automatic assignments and override when necessary
          </div>
        </div>
      </div>

      {/* STATS ROW — #dispatchStats */}
      <DispatchStats orders={orders} />

      {/* SECTION HEADER — exact original text + link */}
      <div className="hm-section-header">
        <h3 className="hm-section-title">Orders Requiring Attention</h3>
        <span className="hm-section-link">View All Queue</span>
      </div>

      {/* Pending order queue — click to select (lab requirement).
          The selected order is shown in the attention card below,
          exactly where the original page shows the order under review. */}
      <OrderList
        orders={pendingOrders}
        selectedOrder={selectedOrder}
        onSelectOrder={handleSelectOrder}
      />

      {/* ATTENTION CARD — #attentionContainer. When attentionOrder is
          null (zero pending) this renders nothing; the empty state is
          shown once by OrderList under the section header. */}
      <DispatchPanel
        order={attentionOrder}
        drivers={drivers}
        onOverride={handleOpenOverride}
        onViewDetails={handleViewDetails}
      />

      {/* MAP — bottom half of the attention-card unit in the original
          page; hidden while there is no pending order to dispatch. */}
      {attentionOrder && (
        <div className="hm-dispatch-map">
          <img src={dispatchMap} alt="Dispatch route map" />
        </div>
      )}

      {/* FOOTER — exact original markup */}
      <div className="hm-brand-footer">
        <div>© 2026 SWIFTTRACK. ALL RIGHTS RESERVED.</div>
        <div className="hm-social">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.92c-2.78.6-3.37-1.12-3.37-1.12-.45-1.15-1.1-1.46-1.1-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10.01 10.01 0 0022 12c0-5.53-4.47-10-10-10z"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
        </div>
      </div>

      {/* ── MODALS (original #overrideModal / #viewDetailModal /
             #changeDestModal / #map-modal) ── */}
      {activeModal === 'override' && (
        <OverrideModal
          order={selectedOrder}
          drivers={drivers}
          selectedDriver={selectedDriver}
          onSelectDriver={handleSelectDriver}
          onClose={() => setActiveModal(null)}
          onConfirm={handleConfirmOverride}
        />
      )}

      {activeModal === 'detail' && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setActiveModal(null)}
          onChangeDestination={() => setActiveModal('changeDest')}
          onTrackMap={() => setActiveModal('map')}
          onOverrideAgent={() => handleOpenOverride(selectedOrder)}
        />
      )}

      {activeModal === 'changeDest' && (
        <ChangeDestinationModal
          order={selectedOrder}
          hubs={hubs}
          onClose={() => setActiveModal('detail')}
          onConfirm={handleChangeDestination}
        />
      )}

      {activeModal === 'map' && (
        <MapModal
          order={selectedOrder}
          driver={
            selectedOrder?.assigned_agent
              ? drivers.find((d) => d.agent_id === selectedOrder.assigned_agent)
              : null
          }
          getHubName={getHubName}
          onClose={() => setActiveModal('detail')}
        />
      )}

      {/* ── FEEDBACK (showToast / showSuccessTick ports) ── */}
      <Toast toast={toast} onDone={() => setToast(null)} />
      <SuccessTick message={successTick} onDone={() => setSuccessTick(null)} />
    </div>
  );
}