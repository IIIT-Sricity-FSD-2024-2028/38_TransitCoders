import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { IPayment } from './interfaces/payment.interface';
import { IOrder } from '../orders/interfaces/order.interface';

/**
 * PaymentsService — internal payment/financial model.
 *
 * The SRS mentions secure payments but does not mandate an external payment
 * gateway. To avoid inventing a fake third-party integration, this project
 * implements a clean INTERNAL ledger:
 *
 *   Prepaid order → charge record created with status 'paid' (payment
 *                   captured at booking, as with a wallet/UPI model).
 *   COD order     → charge record created with status 'pending'; marked
 *                   'paid' when the agent completes delivery (cash collected).
 *   Cancellation  → charge record flipped to 'refunded' + a 'refund' record
 *                   of the same amount is appended (full refund policy for
 *                   cancellations before pickup).
 *   Return (post-delivery, hub-manager authorized) → same refund flow.
 *
 * Invariants enforced here:
 *   - An order has at most ONE charge record.
 *   - A refund is only possible when the charge exists and is not already
 *     refunded.
 *   - order.paymentStatus always mirrors the charge/refund state.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  /** Create the charge record at order creation time. */
  createChargeForOrder(order: IOrder): IPayment {
    const existing = this.paymentsRepository.findChargeForOrder(order.id);
    if (existing) return existing; // idempotent — never double-charge

    const status = order.paymentMode === 'Prepaid' ? 'paid' : 'pending';
    return this.paymentsRepository.create({
      orderId: order.id,
      type: 'charge',
      amount: order.amount,
      method: order.paymentMode,
      status,
    });
  }

  /** COD collection: mark the charge paid when delivery completes. */
  markCollectedOnDelivery(order: IOrder): IPayment | undefined {
    if (order.paymentMode !== 'COD') return undefined;
    const charge = this.paymentsRepository.findChargeForOrder(order.id);
    if (!charge) return undefined;
    if (charge.status === 'paid') return charge; // idempotent
    const updated = this.paymentsRepository.update(charge.id, { status: 'paid' });
    this.ordersRepository.update(order.id, { paymentStatus: 'paid' });
    return updated;
  }

  /**
   * Refund flow for cancellation / authorized return.
   * Flips the charge to 'refunded', appends a refund record, and updates
   * order.paymentStatus. Idempotent: refunding twice is rejected.
   */
  refundOrder(order: IOrder, reason: string): { charge: IPayment; refund: IPayment } {
    const charge = this.paymentsRepository.findChargeForOrder(order.id);
    if (!charge) {
      throw new NotFoundException(`No payment record found for order ${order.orderId}`);
    }
    if (charge.status === 'refunded') {
      throw new BadRequestException(`Order ${order.orderId} has already been refunded`);
    }

    const updatedCharge = this.paymentsRepository.update(charge.id, { status: 'refunded' });
    const refund = this.paymentsRepository.create({
      orderId: order.id,
      type: 'refund',
      amount: charge.amount,
      method: charge.method,
      status: 'refunded',
    });
    this.ordersRepository.update(order.id, { paymentStatus: 'refunded' });
    return { charge: updatedCharge!, refund };
  }

  /** Payment history for one order (owner or staff only — enforced by controller). */
  getPaymentsForOrder(orderId: string): IPayment[] {
    return this.paymentsRepository.findByOrder(orderId);
  }
}