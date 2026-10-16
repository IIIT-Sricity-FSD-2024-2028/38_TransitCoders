import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IComplaint } from './interfaces/complaint.interface';

/**
 * ComplaintsRepository — durable SQLite-backed complaint store.
 */
@Injectable()
export class ComplaintsRepository {
  constructor(private readonly db: DatabaseService) {
    // Non-destructive auto-migration: Adds missing columns silently on boot
    try {
      this.db.run(`ALTER TABLE complaints ADD COLUMN type TEXT DEFAULT 'General Issue'`);
    } catch {}
    try {
      this.db.run(`ALTER TABLE complaints ADD COLUMN priority TEXT DEFAULT 'Medium'`);
    } catch {}
  }

  private toComplaint(row: any): IComplaint {
    return {
      id: row.id,
      userId: row.userId,
      orderId: row.orderId ?? undefined,
      type: row.type || 'General Issue',
      priority: row.priority || 'Medium',
      description: row.description,
      status: row.status ?? 'Open',
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IComplaint[] {
    return this.db
      .query('SELECT * FROM complaints ORDER BY createdAt DESC')
      .map((r) => this.toComplaint(r));
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
      type: data.type || 'General Issue',
      priority: data.priority || 'Medium',
      status: data.status || 'Open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.run(
      `INSERT INTO complaints (id, userId, orderId, type, priority, description, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        complaint.id,
        complaint.userId,
        complaint.orderId ?? null,
        complaint.type,
        complaint.priority,
        complaint.description,
        complaint.status,
        complaint.createdAt.toISOString(),
        complaint.updatedAt.toISOString(),
      ],
    );
    return complaint;
  }

  update(id: string, changes: Partial<IComplaint>): IComplaint | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    // Fields allowed to be partially updated
    const allowedKeys: (keyof IComplaint)[] = [
      'orderId',
      'type',
      'priority',
      'description',
      'status',
    ];

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const key of allowedKeys) {
      if (changes[key] !== undefined) {
        setClauses.push(`${key} = ?`);
        // If orderId is explicitly undefined/null, map to null for SQLite
        values.push(changes[key] ?? null);
      }
    }

    const now = new Date();
    setClauses.push(`updatedAt = ?`);
    values.push(now.toISOString());

    // Final parameter is the WHERE id condition
    values.push(id);

    this.db.run(
      `UPDATE complaints SET ${setClauses.join(', ')} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }
}