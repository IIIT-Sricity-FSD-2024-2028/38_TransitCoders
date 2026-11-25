import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../../shared/auth/authSlice';
import { statusLabel } from '../../services/orderStatus';
import {
  useCompleteDelivery,
  useUpdateOrderStatus,
  useAgentProfile,
  useAgentWorklist,
  useUpdateAgentAvailability,
} from './agentHooks';
import { mapAgentOrder, NEXT_AGENT_MILESTONE } from './agentSelectors';
import {
  closeAcceptModal,
  closeConfirmModal,
  openAcceptModal,
  openConfirmModal,
  selectAcceptModalOrderId,
  selectAgentActionError,
  selectAgentBusyOrderId,
  selectAgentNotice,
  selectAgentSavingAvailability,
  selectConfirmModalOrderId,
  setAgentActionError,
  setAgentBusyOrder,
  setAgentNotice,
  setAgentSavingAvailability,
} from './agentSlice';

export function useAgentPortal() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const userId = user?.id;

  const acceptModalOrderId = useAppSelector(selectAcceptModalOrderId);
  const confirmModalOrderId = useAppSelector(selectConfirmModalOrderId);
  const busyOrderId = useAppSelector(selectAgentBusyOrderId);
  const savingAvailability = useAppSelector(selectAgentSavingAvailability);
  const actionError = useAppSelector(selectAgentActionError);
  const notice = useAppSelector(selectAgentNotice);

  const {
    data: rawWorklist = [],
    error: worklistError,
    refetch: refetchWorklist,
  } = useAgentWorklist(userId, { skip: !userId });

  const {
    data: agent = null,
    error: agentProfileError,
  } = useAgentProfile(userId, { skip: !userId });

  const [triggerUpdateAvailability] = useUpdateAgentAvailability();
  const [triggerUpdateOrderStatus] = useUpdateOrderStatus();
  const [triggerCompleteDelivery] = useCompleteDelivery();

  const orders = useMemo(() => rawWorklist.map(mapAgentOrder), [rawWorklist]);

  const acceptModalOrder = useMemo(
    () => orders.find((o) => o.rawId === acceptModalOrderId) || null,
    [orders, acceptModalOrderId],
  );
  const confirmModalOrder = useMemo(
    () => orders.find((o) => o.rawId === confirmModalOrderId) || null,
    [orders, confirmModalOrderId],
  );

  const loadError = worklistError?.message || '';
  const profileError = agentProfileError?.message || '';

  // Saving state and errors live in the store (not in this hook's mutation state) so the
  // layout banner and badge reflect an availability change made from any page.
  const saveAvailability = useCallback(
    async (status) => {
      if (!userId || savingAvailability || status === agent?.availabilityStatus) return;
      dispatch(setAgentSavingAvailability(true));
      dispatch(setAgentActionError(''));
      try {
        const updated = await triggerUpdateAvailability({ id: userId, availabilityStatus: status }).unwrap();
        dispatch(setAgentNotice(`Availability updated to ${updated.availabilityStatus}.`));
      } catch (err) {
        dispatch(setAgentActionError(err.message));
      } finally {
        dispatch(setAgentSavingAvailability(false));
      }
    },
    [userId, savingAvailability, agent?.availabilityStatus, triggerUpdateAvailability, dispatch],
  );

  const updateOrder = useCallback(
    async (order, status, photo) => {
      if (busyOrderId || !order || !status) return false;
      dispatch(setAgentBusyOrder(order.rawId));
      dispatch(setAgentActionError(''));
      dispatch(setAgentNotice(''));
      try {
        const updated =
          status === 'Delivered'
            ? await triggerCompleteDelivery({ id: order.rawId, photo }).unwrap()
            : await triggerUpdateOrderStatus({ id: order.rawId, status }).unwrap();
        dispatch(setAgentNotice(`${order.orderId} · ${statusLabel(updated.status)}`));
        return true;
      } catch (err) {
        dispatch(setAgentActionError(err.message));
        if (!acceptModalOrderId && !confirmModalOrderId) {
          refetchWorklist();
        }
        return false;
      } finally {
        dispatch(setAgentBusyOrder(null));
      }
    },
    [
      busyOrderId,
      dispatch,
      triggerCompleteDelivery,
      triggerUpdateOrderStatus,
      acceptModalOrderId,
      confirmModalOrderId,
      refetchWorklist,
    ],
  );

  const advanceOrder = useCallback(
    (order) => updateOrder(order, NEXT_AGENT_MILESTONE[order.backendStatus]),
    [updateOrder],
  );

  return {
    user,
    agent,
    orders,
    loadError,
    profileError,
    actionError,
    notice,
    busyOrderId,
    savingAvailability,
    acceptModalOrder,
    confirmModalOrder,
    saveAvailability,
    updateOrder,
    advanceOrder,
    refetchOrders: refetchWorklist,
    openAccept: (order) => dispatch(openAcceptModal(order.rawId)),
    closeAccept: () => dispatch(closeAcceptModal()),
    openConfirm: (order) => dispatch(openConfirmModal(order.rawId)),
    closeConfirm: () => dispatch(closeConfirmModal()),
  };
}
