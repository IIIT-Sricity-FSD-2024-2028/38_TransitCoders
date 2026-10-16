import { Injectable } from '@nestjs/common';
import type { DatabaseSync } from 'node:sqlite';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IOrder, IStatusEvent, IPricingBreakdown } from './interfaces/order.interface';

/**
 * OrdersRepository — durable SQLite-backed order store.
 *
 * Same method contract as the previous in-memory implementation plus:
 *  - findByTrackingId (public tracking lookups)
 *  - countActiveByAgent (workload queries for dispatch automation)
 *  - assignAgentTx (atomic assignment inside a transaction — prevents
 *    two hub managers assigning the same order concurrently)
 */
@Injectable()
export class OrdersRepository {
  constructor(private readonly db: DatabaseService) {}

  private toOrder(row: any): IOrder {
    return {
      id: row.id,
      orderId: row.orderId,
      trackingId: row.trackingId,
      merchantId: row.merchantId,
      customerId: row.customerId,
      customerName: row.customerName ?? undefined,
      customerPhone: row.customerPhone ?? undefined,
      pickupAddress: row.pickupAddress ?? undefined,
      deliveryAddress: row.deliveryAddress,
      pickupHubId: row.pickupHubId ?? undefined,
      deliveryHubId: row.deliveryHubId ?? undefined,
      status: row.status,
      assignedAgentId: row.assignedAgentId ?? undefined,
      packageType: row.packageType ?? undefined,
      serviceLevel: row.serviceLevel ?? 'standard',
      weight: row.weight ?? undefined,
      amount: Number(row.amount) || 0,
      pricingBreakdown: row.pricingBreakdown
        ? (JSON.parse(row.pricingBreakdown) as IPricingBreakdown)
        : undefined,
      paymentMode: row.paymentMode ?? 'Prepaid',
      paymentStatus: row.paymentStatus ?? 'pending',
      priority: row.priority ?? 'Medium',
      estimatedDelivery: row.estimatedDelivery ? new Date(row.estimatedDelivery) : undefined,
      pickupScheduledAt: row.pickupScheduledAt ? new Date(row.pickupScheduledAt) : undefined,
      statusHistory: row.statusHistory ? (JSON.parse(row.statusHistory) as IStatusEvent[]) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IOrder[] {
    return this.db.query('SELECT * FROM orders ORDER BY createdAt DESC').map((r) => this.toOrder(r));
  }

  findById(id: string): IOrder | undefined {
    const row = this.db.queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    return row ? this.toOrder(row) : undefined;
  }

  findByOrderId(orderId: string): IOrder | undefined {
    const row = this.db.queryOne('SELECT * FROM orders WHERE orderId = ?', [orderId]);
    return row ? this.toOrder(row) : undefined;
  }

  findByTrackingId(trackingId: string): IOrder | undefined {
    const row = this.db.queryOne('SELECT * FROM orders WHERE trackingId = ?', [trackingId]);
    return row ? this.toOrder(row) : undefined;
  }

  findByMerchant(merchantId: string): IOrder[] {
    return this.db
      .query('SELECT * FROM orders WHERE merchantId = ? ORDER BY createdAt DESC', [merchantId])
      .map((r) => this.toOrder(r));
  }

  findByCustomer(customerId: string): IOrder[] {
    return this.db
      .query('SELECT * FROM orders WHERE customerId = ? ORDER BY createdAt DESC', [customerId])
      .map((r) => this.toOrder(r));
  }

  findByHub(hubId: string): IOrder[] {
    return this.db
      .query(
        'SELECT * FROM orders WHERE pickupHubId = ? OR deliveryHubId = ? ORDER BY createdAt DESC',
        [hubId, hubId],
      )
      .map((r) => this.toOrder(r));
  }

  findByAgent(agentId: string): IOrder[] {
    return this.db
      .query('SELECT * FROM orders WHERE assignedAgentId = ? ORDER BY createdAt DESC', [agentId])
      .map((r) => this.toOrder(r));
  }

  findByStatus(status: string): IOrder[] {
    return this.db
      .query('SELECT * FROM orders WHERE status = ? ORDER BY createdAt', [status])
      .map((r) => this.toOrder(r));
  }

  /** Active (non-terminal) task count for an agent — used by dispatch automation. */
  countActiveByAgent(agentId: string): number {
    const row = this.db.queryOne<{ n: number }>(
      `SELECT COUNT(*) AS n FROM orders
       WHERE assignedAgentId = ? AND status NOT IN ('Delivered','Cancelled','Returned','Failed')`,
      [agentId],
    );
    return row ? Number(row.n) : 0;
  }

  create(
    order: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>,
    conn?: DatabaseSync,
  ): IOrder {
    const id = uuidv4();
    const now = new Date();
    const newOrder: IOrder = {
      ...order,
      id,
      createdAt: now,
      updatedAt: now,
    };
    const sql = `INSERT INTO orders (id, orderId, trackingId, merchantId, customerId, customerName, customerPhone,
         pickupAddress, deliveryAddress, pickupHubId, deliveryHubId, status, assignedAgentId, packageType,
         serviceLevel, weight, amount, pricingBreakdown, paymentMode, paymentStatus, priority,
         estimatedDelivery, pickupScheduledAt, statusHistory, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      newOrder.id,
      newOrder.orderId,
      newOrder.trackingId,
      newOrder.merchantId,
      newOrder.customerId,
      newOrder.customerName ?? null,
      newOrder.customerPhone ?? null,
      newOrder.pickupAddress ?? null,
      newOrder.deliveryAddress,
      newOrder.pickupHubId ?? null,
      newOrder.deliveryHubId ?? null,
      newOrder.status,
      newOrder.assignedAgentId ?? null,
      newOrder.packageType ?? null,
      newOrder.serviceLevel ?? 'standard',
      newOrder.weight ?? null,
      newOrder.amount ?? 0,
      newOrder.pricingBreakdown ? JSON.stringify(newOrder.pricingBreakdown) : null,
      newOrder.paymentMode ?? 'Prepaid',
      newOrder.paymentStatus ?? 'pending',
      newOrder.priority ?? 'Medium',
      newOrder.estimatedDelivery ? newOrder.estimatedDelivery.toISOString() : null,
      newOrder.pickupScheduledAt ? newOrder.pickupScheduledAt.toISOString() : null,
      JSON.stringify(newOrder.statusHistory ?? []),
      newOrder.createdAt.toISOString(),
      newOrder.updatedAt.toISOString(),
    ];

    if (conn) {
      conn.prepare(sql).run(...params);
    } else {
      this.db.run(sql, params);
    }
    return newOrder;
  }

  update(id: string, changes: Partial<IOrder>): IOrder | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: IOrder = { ...existing, ...changes, updatedAt: new Date() };
    this.db.run(
      `UPDATE orders SET orderId = ?, trackingId = ?, merchantId = ?, customerId = ?, customerName = ?, customerPhone = ?,
         pickupAddress = ?, deliveryAddress = ?, pickupHubId = ?, deliveryHubId = ?, status = ?, assignedAgentId = ?,
         packageType = ?, serviceLevel = ?, weight = ?, amount = ?, pricingBreakdown = ?, paymentMode = ?, paymentStatus = ?,
         priority = ?, estimatedDelivery = ?, pickupScheduledAt = ?, statusHistory = ?, updatedAt = ?
       WHERE id = ?`,
      [
        merged.orderId,
        merged.trackingId,
        merged.merchantId,
        merged.customerId,
        merged.customerName ?? null,
        merged.customerPhone ?? null,
        merged.pickupAddress ?? null,
        merged.deliveryAddress,
        merged.pickupHubId ?? null,
        merged.deliveryHubId ?? null,
        merged.status,
        merged.assignedAgentId ?? null,
        merged.packageType ?? null,
        merged.serviceLevel ?? 'standard',
        merged.weight ?? null,
        merged.amount ?? 0,
        merged.pricingBreakdown ? JSON.stringify(merged.pricingBreakdown) : null,
        merged.paymentMode ?? 'Prepaid',
        merged.paymentStatus ?? 'pending',
        merged.priority ?? 'Medium',
        merged.estimatedDelivery ? merged.estimatedDelivery.toISOString() : null,
        merged.pickupScheduledAt ? merged.pickupScheduledAt.toISOString() : null,
        JSON.stringify(merged.statusHistory ?? []),
        merged.updatedAt.toISOString(),
        id,
      ],
    );
    return merged;
  }

  /**
   * Atomic agent assignment. Runs inside an IMMEDIATE transaction so two
   * concurrent hub-manager assignments cannot both succeed (the second sees
   * the order no longer Pending and fails cleanly).
   */
  assignAgentTx(orderId: string, agentId: string, newStatus: string, pickupHubId?: string): IOrder | undefined {
    return this.db.transaction((conn) => {
      const row = conn.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
      if (!row) return undefined;
      if (row.status !== 'Pending') return undefined; // already assigned/transitioned

      const history = JSON.parse(row.statusHistory || '[]');
      history.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: `Assigned to agent ${agentId}`,
      });

      conn.prepare(
        `UPDATE orders SET assignedAgentId = ?, status = ?, pickupHubId = COALESCE(?, pickupHubId), statusHistory = ?, updatedAt = ? WHERE id = ?`,
      ).run(agentId, newStatus, pickupHubId ?? null, JSON.stringify(history), new Date().toISOString(), orderId);

      const updated = conn.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
      return this.toOrder(updated);
    });
  }

  delete(id: string): boolean {
    const result = this.db.run('DELETE FROM orders WHERE id = ?', [id]);
    return result.changes > 0;
  }
}