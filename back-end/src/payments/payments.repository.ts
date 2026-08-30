import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IPayment } from './interfaces/payment.interface';

/**
 * PaymentsRepository — durable SQLite-backed financial ledger.
 *
 * Every monetary event on an order is recorded here:
 *   - type 'charge'  : the customer charge (created at order creation)
 *   - type 'refund'  : a refund issued on cancellation/return
 *
 * Revenue reporting (ReportsService) reconciles exclusively from these
 * records + the authoritative order.amount — never from client input.
 */
@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: DatabaseService) {}

  private toPayment(row: any): IPayment {
    return {
      id: row.id,
      orderId: row.orderId,
      type: row.type ?? 'charge',
      amount: Number(row.amount) || 0,
      method: row.method ?? 'Prepaid',
      status: row.status ?? 'pending',
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IPayment[] {
    return this.db.query('SELECT * FROM payments ORDER BY createdAt DESC').map((r) => this.toPayment(r));
  }

  findById(id: string): IPayment | undefined {
    const row = this.db.queryOne('SELECT * FROM payments WHERE id = ?', [id]);
    return row ? this.toPayment(row) : undefined;
  }

  findByOrder(orderId: string): IPayment[] {
    return this.db
      .query('SELECT * FROM payments WHERE orderId = ? ORDER BY createdAt', [orderId])
      .map((r) => this.toPayment(r));
  }

  /** The primary charge record for an order. */
  findChargeForOrder(orderId: string): IPayment | undefined {
    const row = this.db.queryOne(
      `SELECT * FROM payments WHERE orderId = ? AND type = 'charge' ORDER BY createdAt LIMIT 1`,
      [orderId],
    );
    return row ? this.toPayment(row) : undefined;
  }

  create(data: Omit<IPayment, 'id' | 'createdAt' | 'updatedAt'>): IPayment {
    const payment: IPayment = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.run(
      `INSERT INTO payments (id, orderId, type, amount, method, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.id,
        payment.orderId,
        payment.type,
        payment.amount,
        payment.method,
        payment.status,
        payment.createdAt.toISOString(),
        payment.updatedAt.toISOString(),
      ],
    );
    return payment;
  }

  update(id: string, changes: Partial<IPayment>): IPayment | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: IPayment = { ...existing, ...changes, updatedAt: new Date() };
    this.db.run(`UPDATE payments SET type = ?, amount = ?, method = ?, status = ?, updatedAt = ? WHERE id = ?`, [
      merged.type,
      merged.amount,
      merged.method,
      merged.status,
      merged.updatedAt.toISOString(),
      id,
    ]);
    return merged;
  }
}