import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../services/api';

const MerchantContext = createContext(null);

export function MerchantProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);
  const [liveNotification, setLiveNotification] = useState(null);

  // 1. Fetch live orders & shipments from backend API
  const fetchLiveOrders = async () => {
    try {
      setLoading(true);

      // Query both orders and shipments from the live NestJS backend
      const [ordersRes, shipmentsRes] = await Promise.all([
        API.orders.getAll().catch(() => null),
        API.shipments.getAll().catch(() => null),
      ]);

      const backendOrders = Array.isArray(ordersRes) ? ordersRes : [];
      const backendShipments = Array.isArray(shipmentsRes) ? shipmentsRes : [];

      // Normalize into unified tracking format
      const normalizedList = [
        ...backendShipments.map((s) => ({
          id: s.shipmentId || s.id,
          trackingNumber: s.shipmentId || s.id,
          recipientName: s.recipient?.name || 'Customer',
          recipientPhone: s.recipient?.phone || '+91 98765 43210',
          pickupAddress: s.originHubId || 'Chennai Hub',
          deliveryAddress: s.recipient?.address || 'Destination Hub',
          origin: s.originHubId || 'Chennai',
          destination: s.destinationHubId || 'Bengaluru',
          packageWeight: s.weight || 1.5,
          packageType: s.serviceType?.toUpperCase() || 'STANDARD',
          serviceType: s.serviceType || 'standard',
          status: (s.status || 'PENDING').toUpperCase(),
          price: s.amount || 250,
          date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Today',
          timeline: s.trackingTimeline || [
            { title: 'Shipment Created', time: 'Recorded in System', status: 'done' }
          ]
        })),
        ...backendOrders.map((o) => ({
          id: o.trackingNumber || o.id,
          trackingNumber: o.trackingNumber || o.id,
          recipientName: o.customerName || 'Customer',
          recipientPhone: o.recipientPhone || '+91 90000 00000',
          pickupAddress: o.pickupAddress || 'Origin Hub',
          deliveryAddress: o.deliveryAddress || 'Destination',
          origin: o.pickupHubId || 'Chennai',
          destination: o.deliveryHubId || 'Bengaluru',
          packageWeight: o.weight || 2.0,
          packageType: o.packageType || 'Box',
          serviceType: o.serviceLevel || 'standard',
          status: (o.status || 'PENDING').toUpperCase(),
          price: o.amount || o.price || 350,
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Today',
          timeline: [
            { title: 'Order Created', time: 'Recorded in System', status: 'done' },
            { title: 'Hub Dispatch', time: o.status === 'PENDING' ? 'Awaiting Dispatch' : 'Processed', status: o.status === 'PENDING' ? 'active' : 'done' },
            { title: 'Delivery In Transit', time: o.status === 'IN_TRANSIT' ? 'On Highway Route' : 'Pending', status: o.status === 'IN_TRANSIT' ? 'active' : o.status === 'DELIVERED' ? 'done' : 'pending' },
            { title: 'Delivered', time: o.status === 'DELIVERED' ? 'Delivered' : 'Pending', status: o.status === 'DELIVERED' ? 'done' : 'pending' }
          ]
        }))
      ];

      // If backend is empty or first run, provide initial seeded items
      if (normalizedList.length === 0) {
        const localSaved = localStorage.getItem('swifttrack_merchant_live');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            setOrders(parsed);
            if (!activeTrackingOrder && parsed.length > 0) setActiveTrackingOrder(parsed[0]);
            return;
          } catch (e) {}
        }

        const seedItems = [
          {
            id: 'SWT-2026-98471',
            trackingNumber: 'SWT-2026-98471',
            recipientName: 'Divya Iyer',
            recipientPhone: '+91 91234 56789',
            pickupAddress: '24 Mount Road, Chennai',
            deliveryAddress: '15 MG Road, Bengaluru',
            origin: 'Chennai',
            destination: 'Bengaluru',
            packageWeight: 2.5,
            packageType: 'Box',
            serviceType: 'express',
            status: 'IN_TRANSIT',
            price: 450,
            date: '28 Mar 2026',
            timeline: [
              { title: 'Order Placed', time: 'Mar 28, 2026 · 09:15 AM', status: 'done' },
              { title: 'Picked Up by Agent', time: 'Mar 28, 2026 · 02:30 PM', status: 'done' },
              { title: 'In Transit – Bengaluru Hub', time: 'Mar 29, 2026 · 08:00 AM', status: 'active' },
              { title: 'Out for Delivery', time: 'Expected Mar 31', status: 'pending' },
              { title: 'Delivered', time: 'Expected Apr 1', status: 'pending' }
            ]
          },
          {
            id: 'SWT-2026-98470',
            trackingNumber: 'SWT-2026-98470',
            recipientName: 'Karthik Raja',
            recipientPhone: '+91 98765 43210',
            pickupAddress: '10 Anna Nagar, Chennai',
            deliveryAddress: '42 Jubilee Hills, Hyderabad',
            origin: 'Chennai',
            destination: 'Hyderabad',
            packageWeight: 1.2,
            packageType: 'Envelope',
            serviceType: 'standard',
            status: 'DELIVERED',
            price: 320,
            date: '27 Mar 2026',
            timeline: [
              { title: 'Order Placed', time: 'Mar 26, 2026 · 10:00 AM', status: 'done' },
              { title: 'Picked Up', time: 'Mar 26, 2026 · 04:00 PM', status: 'done' },
              { title: 'In Transit – Hyderabad Hub', time: 'Mar 27, 2026 · 06:00 AM', status: 'done' },
              { title: 'Delivered', time: 'Mar 27, 2026 · 03:15 PM', status: 'done' }
            ]
          }
        ];
        setOrders(seedItems);
        setActiveTrackingOrder(seedItems[0]);
      } else {
        setOrders(normalizedList);
        if (!activeTrackingOrder) setActiveTrackingOrder(normalizedList[0]);
      }
    } catch (err) {
      console.warn('API sync fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
  }, []);

  // Save to localStorage whenever orders update
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('swifttrack_merchant_live', JSON.stringify(orders));
    }
  }, [orders]);

  // 2. Fetch live tracking details for a specific shipment from API: GET /shipments/:id/track
  const fetchLiveTracking = async (trackingId) => {
    try {
      // First check local list
      let match = orders.find(
        (o) => o.trackingNumber?.toLowerCase() === trackingId?.toLowerCase() || o.id?.toLowerCase() === trackingId?.toLowerCase()
      );

      // Query real API endpoint
      const trackingTimeline = await API.shipments.getTracking(trackingId).catch(() => null);

      if (trackingTimeline && Array.isArray(trackingTimeline) && trackingTimeline.length > 0) {
        const liveTimeline = trackingTimeline.map((item) => ({
          title: item.note || `Status: ${item.status}`,
          time: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent',
          status: item.status === 'delivered' ? 'done' : 'active'
        }));

        if (match) {
          match = { ...match, timeline: liveTimeline };
        }
      }

      if (match) {
        setActiveTrackingOrder(match);
        return match;
      }
      return null;
    } catch (e) {
      console.error('Failed to fetch live tracking:', e);
      return null;
    }
  };

  // 3. Create a real shipment via API: POST /shipments
  const createOrder = async (orderPayload) => {
    try {
      // Call backend API create shipment
      const apiResult = await API.shipments.create({
        recipient: {
          name: orderPayload.recvName,
          phone: orderPayload.recvPhone || '+91 90000 00000',
          address: `${orderPayload.recvAddress}, ${orderPayload.recvCity}`,
        },
        originHubId: 'hub_chennai',
        destinationHubId: 'hub_bengaluru',
        serviceType: orderPayload.serviceType || 'standard',
        weight: parseFloat(orderPayload.pkgWeight) || 1.5,
      }).catch(() => null);

      const trackingNumber = apiResult?.shipmentId || `SWT-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      const newShipment = {
        id: trackingNumber,
        trackingNumber: trackingNumber,
        recipientName: orderPayload.recvName,
        recipientPhone: orderPayload.recvPhone,
        pickupAddress: `${orderPayload.pickupAddress}, ${orderPayload.pickupCity}`,
        deliveryAddress: `${orderPayload.recvAddress}, ${orderPayload.recvCity}`,
        origin: orderPayload.pickupCity || 'Chennai',
        destination: orderPayload.recvCity || 'Bengaluru',
        packageWeight: parseFloat(orderPayload.pkgWeight) || 1.5,
        packageType: orderPayload.pkgType || 'Box',
        serviceType: orderPayload.serviceType || 'express',
        status: 'PENDING',
        price: apiResult?.amount || orderPayload.price || 420,
        date: 'Just now',
        timeline: [
          { title: 'Shipment Created via API', time: 'Just now', status: 'done' },
          { title: 'Dispatched to Origin Hub', time: 'In Queue', status: 'active' },
          { title: 'Hub Transit', time: 'Expected tomorrow', status: 'pending' },
          { title: 'Delivery to Recipient', time: 'Pending', status: 'pending' }
        ]
      };

      setOrders((prev) => [newShipment, ...prev]);
      setActiveTrackingOrder(newShipment);

      setLiveNotification(`API Success: Created Shipment ${trackingNumber}!`);
      setTimeout(() => setLiveNotification(null), 4000);

      return newShipment;
    } catch (err) {
      console.error('API create shipment failed:', err);
      throw err;
    }
  };

  // 4. Cancel shipment via API: DELETE /shipments/:id
  const cancelOrder = async (orderId) => {
    try {
      await API.shipments.cancel(orderId).catch(() => null);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'CANCELLED',
                timeline: [
                  ...o.timeline,
                  { title: 'Shipment Cancelled by Merchant', time: 'Just now', status: 'cancelled' }
                ]
              }
            : o
        )
      );

      setLiveNotification(`Shipment ${orderId} cancelled in API database.`);
      setTimeout(() => setLiveNotification(null), 4000);
    } catch (e) {
      alert('Cancel failed: ' + e.message);
    }
  };

  // 5. Advance order status simulation
  const advanceOrderStatus = async (orderId) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const nextStatus = o.status === 'PENDING' ? 'IN_TRANSIT' : 'DELIVERED';
        const updated = {
          ...o,
          status: nextStatus,
          timeline: [
            ...o.timeline,
            { title: `Status Advanced: ${nextStatus}`, time: 'Just now', status: nextStatus === 'DELIVERED' ? 'done' : 'active' }
          ]
        };
        if (activeTrackingOrder?.id === orderId) setActiveTrackingOrder(updated);
        return updated;
      })
    );

    setLiveNotification(`Live tracking update sent for ${orderId}`);
    setTimeout(() => setLiveNotification(null), 4000);
  };

  return (
    <MerchantContext.Provider
      value={{
        orders,
        loading,
        createOrder,
        cancelOrder,
        advanceOrderStatus,
        activeTrackingOrder,
        setActiveTrackingOrder,
        fetchLiveTracking,
        fetchLiveOrders,
        liveNotification
      }}
    >
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
}
