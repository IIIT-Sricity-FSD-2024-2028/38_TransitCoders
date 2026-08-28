import OrderCard from './OrderCard.jsx';

/**
 * Renders the pending orders passed down from Dispatch.jsx via props.
 * Selection lives in the parent — this list only forwards the callback.
 * When zero pending orders exist it renders the single "No Pending
 * Orders" empty state (the original page's #attentionContainer empty
 * state) and nothing else — assigned orders never appear here.
 */
export default function OrderList({ orders, selectedOrder, onSelectOrder }) {
  if (!orders.length) {
    return (
      <div className="hm-empty-state">
        <div className="hm-empty-title">No Pending Orders</div>
        <div className="hm-empty-msg">All orders have been assigned.</div>
      </div>
    );
  }

  return (
    <div className="hm-order-grid">
      {orders.map((order) => (
        <OrderCard
          key={order.order_id}
          order={order}
          selected={selectedOrder?.order_id === order.order_id}
          onSelect={onSelectOrder}
        />
      ))}
    </div>
  );
}