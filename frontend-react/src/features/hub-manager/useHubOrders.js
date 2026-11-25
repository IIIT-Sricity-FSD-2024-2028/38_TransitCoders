import { useCallback, useEffect, useState } from 'react';
import { API } from '../../services/api';
import { getSessionUser } from '../../services/session';

export default function useHubOrders() {
  const hubId = getSessionUser().hubId;
  const [result, setResult] = useState(null);

  const refreshOrders = useCallback(async () => {
    try {
      setResult({ orders: await API.orders.getAll() });
    } catch (err) {
      setResult(previous => ({ orders: previous?.orders || [], error: err.message }));
    }
  }, []);

  useEffect(() => {
    if (!hubId) return;
    let active = true;
    API.orders.getAll().then(orders => {
      if (active) setResult({ orders });
    }, err => {
      if (active) setResult({ error: err.message });
    });
    return () => { active = false; };
  }, [hubId]);

  return {
    orders: result?.orders || [],
    loading: Boolean(hubId) && !result,
    error: hubId ? result?.error : 'No hub is assigned to this account.',
    hubId,
    refreshOrders,
  };
}
