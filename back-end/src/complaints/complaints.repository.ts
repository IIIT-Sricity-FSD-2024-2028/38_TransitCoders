import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IComplaint } from './interfaces/complaint.interface';

/**
 * ComplaintsRepository — durable SQLite-backed complaint store.
 * Same method contract as the previous in-memory implementation.
 */
@Injectable()
export class ComplaintsRepository {
  constructor(private readonly db: DatabaseService) {}

  private toComplaint(row: any): IComplaint {
    return {
      id: row.id,
      userId: row.userId,
      orderId: row.orderId ?? undefined,
      description: row.description,
      status: row.status ?? 'Open',
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IComplaint[] {
    return this.db.query('SELECT * FROM complaints ORDER BY createdAt DESC').map((r) => this.toComplaint(r));
  }

  findById(id: string): IComplaint | undefined {
    const row = this.db.queryOne('SELECT * FROM complaints WHERE id = ?', [id]);
    return row ? this.toComplaint(row) : undefined;
  }

  findByUser(userId: string): IComplaint[] {
    return this.db
      .query('SELECT * FROM complaints WHERE userId = ? ORDER BY createdAt DESC', [userId])
      .map((r) => this.toComplaint(r));
  }

  create(data: Omit<IComplaint, 'id' | 'createdAt' | 'updatedAt'>): IComplaint {
    const complaint: IComplaint = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.run(
      `INSERT INTO complaints (id, userId, orderId, description, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        complaint.id,
        complaint.userId,
        complaint.orderId ?? null,
        complaint.description,
        complaint.status ?? 'Open',
        complaint.createdAt.toISOString(),
        complaint.updatedAt.toISOString(),
      ],
    );
    return complaint;
  }

  update(id: string, changes: Partial<IComplaint>): IComplaint | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: IComplaint = { ...existing, ...changes, updatedAt: new Date() };
    this.db.run(
      `UPDATE complaints SET orderId = ?, description = ?, status = ?, updatedAt = ? WHERE id = ?`,
      [
        merged.orderId ?? null,
        merged.description,
        merged.status ?? 'Open',
        merged.updatedAt.toISOString(),
        id,
      ],
    );
    return merged;
  }
}