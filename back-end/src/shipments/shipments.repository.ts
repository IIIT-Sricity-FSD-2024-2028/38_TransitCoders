import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IShipment } from './interfaces/shipment.interface';

/**
 * ShipmentsRepository — durable SQLite-backed shipment store.
 * Same method contract as the previous in-memory implementation.
 */
@Injectable()
export class ShipmentsRepository {
  constructor(private readonly db: DatabaseService) {}

  private toShipment(row: any): IShipment {
    return {
      id: row.id,
      shipmentId: row.shipmentId,
      merchantId: row.merchantId,
      recipient: row.recipient ?? undefined,
      originHubId: row.originHubId ?? '',
      destinationHubId: row.destinationHubId ?? '',
      serviceType: row.serviceType ?? 'standard',
      weight: Number(row.weight) || 0,
      amount: Number(row.amount) || 0,
      status: row.status ?? 'pending',
      trackingTimeline: row.trackingTimeline
        ? JSON.parse(row.trackingTimeline).map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
        : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IShipment[] {
    return this.db.query('SELECT * FROM shipments ORDER BY createdAt DESC').map((r) => this.toShipment(r));
  }

  findById(id: string): IShipment | undefined {
    const row = this.db.queryOne('SELECT * FROM shipments WHERE id = ?', [id]);
    return row ? this.toShipment(row) : undefined;
  }

  findByShipmentId(shipmentId: string): IShipment | undefined {
    const row = this.db.queryOne('SELECT * FROM shipments WHERE shipmentId = ?', [shipmentId]);
    return row ? this.toShipment(row) : undefined;
  }

  findByMerchant(merchantId: string): IShipment[] {
    return this.db
      .query('SELECT * FROM shipments WHERE merchantId = ? ORDER BY createdAt DESC', [merchantId])
      .map((r) => this.toShipment(r));
  }

  /** Sequential human-readable shipment id: SHP-YYYY-NNNN */
  nextShipmentId(): string {
    const year = new Date().getFullYear();
    const row = this.db.queryOne<{ n: number }>(
      `SELECT COUNT(*) AS n FROM shipments WHERE shipmentId LIKE ?`,
      [`SHP-${year}-%`],
    );
    const next = (row ? Number(row.n) : 0) + 1;
    return `SHP-${year}-${String(next).padStart(4, '0')}`;
  }

  create(data: Omit<IShipment, 'id' | 'createdAt' | 'updatedAt'>): IShipment {
    const shipment: IShipment = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.run(
      `INSERT INTO shipments (id, shipmentId, merchantId, recipient, originHubId, destinationHubId, serviceType, weight, amount, status, trackingTimeline, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shipment.id,
        shipment.shipmentId,
        shipment.merchantId,
        shipment.recipient ?? null,
        shipment.originHubId ?? null,
        shipment.destinationHubId ?? null,
        shipment.serviceType ?? 'standard',
        shipment.weight ?? null,
        shipment.amount ?? 0,
        shipment.status ?? 'pending',
        JSON.stringify(shipment.trackingTimeline ?? []),
        shipment.createdAt.toISOString(),
        shipment.updatedAt.toISOString(),
      ],
    );
    return shipment;
  }

  update(id: string, changes: Partial<IShipment>): IShipment | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: IShipment = { ...existing, ...changes, updatedAt: new Date() };
    this.db.run(
      `UPDATE shipments SET shipmentId = ?, merchantId = ?, recipient = ?, originHubId = ?, destinationHubId = ?, serviceType = ?, weight = ?, amount = ?, status = ?, trackingTimeline = ?, updatedAt = ?
       WHERE id = ?`,
      [
        merged.shipmentId,
        merged.merchantId,
        merged.recipient ?? null,
        merged.originHubId ?? null,
        merged.destinationHubId ?? null,
        merged.serviceType ?? 'standard',
        merged.weight ?? null,
        merged.amount ?? 0,
        merged.status ?? 'pending',
        JSON.stringify(merged.trackingTimeline ?? []),
        merged.updatedAt.toISOString(),
        existing.id,
      ],
    );
    return merged;
  }

  delete(id: string): boolean {
    const result = this.db.run('DELETE FROM shipments WHERE id = ?', [id]);
    return result.changes > 0;
  }
}