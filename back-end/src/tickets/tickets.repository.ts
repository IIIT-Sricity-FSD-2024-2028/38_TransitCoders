import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { ITicket } from './interfaces/ticket.interface';

/**
 * TicketsRepository — durable SQLite-backed ticket store.
 * Same method contract as the previous in-memory implementation.
 */
@Injectable()
export class TicketsRepository {
  constructor(private readonly db: DatabaseService) {}

  private toTicket(row: any): ITicket {
    return {
      id: row.id,
      ticketId: row.ticketId,
      merchantId: row.merchantId,
      subject: row.subject,
      trackingId: row.trackingId ?? undefined,
      priority: row.priority ?? 'med',
      status: row.status ?? 'open',
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): ITicket[] {
    return this.db.query('SELECT * FROM tickets ORDER BY createdAt DESC').map((r) => this.toTicket(r));
  }

  findById(id: string): ITicket | undefined {
    const row = this.db.queryOne('SELECT * FROM tickets WHERE id = ?', [id]);
    return row ? this.toTicket(row) : undefined;
  }

  findByMerchant(merchantId: string): ITicket[] {
    return this.db
      .query('SELECT * FROM tickets WHERE merchantId = ? ORDER BY createdAt DESC', [merchantId])
      .map((r) => this.toTicket(r));
  }

  create(data: Omit<ITicket, 'id' | 'ticketId' | 'createdAt' | 'updatedAt'>): ITicket {
    const id = uuidv4();
    const now = new Date();
    // Sequential ticket number based on current row count
    const countRow = this.db.queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM tickets');
    const ticketId = `TKT-${1000 + (countRow ? Number(countRow.n) : 0) + 1}`;
    const ticket: ITicket = {
      ...data,
      id,
      ticketId,
      createdAt: now,
      updatedAt: now,
    };
    this.db.run(
      `INSERT INTO tickets (id, ticketId, merchantId, subject, trackingId, priority, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket.id,
        ticket.ticketId,
        ticket.merchantId,
        ticket.subject,
        ticket.trackingId ?? null,
        ticket.priority ?? 'med',
        ticket.status ?? 'open',
        ticket.createdAt.toISOString(),
        ticket.updatedAt.toISOString(),
      ],
    );
    return ticket;
  }

  update(id: string, changes: Partial<ITicket>): ITicket | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: ITicket = { ...existing, ...changes, updatedAt: new Date() };
    this.db.run(
      `UPDATE tickets SET subject = ?, trackingId = ?, priority = ?, status = ?, updatedAt = ? WHERE id = ?`,
      [
        merged.subject,
        merged.trackingId ?? null,
        merged.priority ?? 'med',
        merged.status ?? 'open',
        merged.updatedAt.toISOString(),
        id,
      ],
    );
    return merged;
  }

  delete(id: string): boolean {
    const result = this.db.run('DELETE FROM tickets WHERE id = ?', [id]);
    return result.changes > 0;
  }
}