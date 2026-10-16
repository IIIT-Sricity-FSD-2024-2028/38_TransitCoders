import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IHub } from './interfaces/hub.interface';

/**
 * HubsRepository — durable SQLite-backed hub store.
 * Same method contract as the previous in-memory implementation.
 */
@Injectable()
export class HubsRepository {
  constructor(private readonly db: DatabaseService) {}

  private toHub(row: any): IHub {
    return {
      id: row.id,
      hubId: row.hubId,
      name: row.name,
      address: row.address ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      pincode: row.pincode ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      managerId: row.managerId ?? null,
      status: row.status ?? 'active',
      capacity: Number(row.capacity) || 0,
      currentLoad: Number(row.currentLoad) || 0,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IHub[] {
    return this.db.query('SELECT * FROM hubs ORDER BY hubId').map((r) => this.toHub(r));
  }

  findById(idOrHubId: string): IHub | undefined {
    const row = this.db.queryOne('SELECT * FROM hubs WHERE id = ? OR hubId = ?', [
      idOrHubId,
      idOrHubId,
    ]);
    return row ? this.toHub(row) : undefined;
  }

  /** Alias kept for HubsService compatibility. */
  findByHubId(hubId: string): IHub | undefined {
    return this.findById(hubId);
  }

  create(data: Omit<IHub, 'id' | 'createdAt' | 'updatedAt'>): IHub {
    const hub: IHub = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.run(
      `INSERT INTO hubs (id, hubId, name, address, city, state, pincode, phone, email, managerId, status, capacity, currentLoad, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hub.id,
        hub.hubId,
        hub.name,
        hub.address ?? null,
        hub.city ?? null,
        hub.state ?? null,
        hub.pincode ?? null,
        hub.phone ?? null,
        hub.email ?? null,
        hub.managerId ?? null,
        hub.status ?? 'active',
        hub.capacity ?? null,
        hub.currentLoad ?? null,
        hub.createdAt.toISOString(),
        hub.updatedAt.toISOString(),
      ],
    );
    return hub;
  }

  update(id: string, changes: Partial<IHub>): IHub | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: IHub = { ...existing, ...changes, updatedAt: new Date() };
    this.db.run(
      `UPDATE hubs SET hubId = ?, name = ?, address = ?, city = ?, state = ?, pincode = ?, phone = ?, email = ?, managerId = ?, status = ?, capacity = ?, currentLoad = ?, updatedAt = ?
       WHERE id = ?`,
      [
        merged.hubId,
        merged.name,
        merged.address ?? null,
        merged.city ?? null,
        merged.state ?? null,
        merged.pincode ?? null,
        merged.phone ?? null,
        merged.email ?? null,
        merged.managerId ?? null,
        merged.status ?? 'active',
        merged.capacity ?? null,
        merged.currentLoad ?? null,
        merged.updatedAt.toISOString(),
        existing.id,
      ],
    );
    return merged;
  }

  delete(id: string): boolean {
    const hub = this.findById(id);
    if (!hub) return false;
    const result = this.db.run('DELETE FROM hubs WHERE id = ?', [hub.id]);
    return result.changes > 0;
  }
}