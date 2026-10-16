import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IFeedback } from './interfaces/feedback.interface';

/**
 * FeedbackRepository — durable SQLite-backed feedback store.
 * Same method contract as the previous in-memory implementation.
 */
@Injectable()
export class FeedbackRepository {
  constructor(private readonly db: DatabaseService) {}

  private toFeedback(row: any): IFeedback {
    return {
      id: row.id,
      userId: row.userId,
      orderId: row.orderId ?? undefined,
      rating: Number(row.rating),
      comments: row.comments ?? undefined,
      status: row.status ?? 'New',
      createdAt: new Date(row.createdAt),
    };
  }

  findAll(): IFeedback[] {
    return this.db.query('SELECT * FROM feedback ORDER BY createdAt DESC').map((r) => this.toFeedback(r));
  }

  findById(id: string): IFeedback | undefined {
    const row = this.db.queryOne('SELECT * FROM feedback WHERE id = ?', [id]);
    return row ? this.toFeedback(row) : undefined;
  }

  findByUser(userId: string): IFeedback[] {
    return this.db
      .query('SELECT * FROM feedback WHERE userId = ? ORDER BY createdAt DESC', [userId])
      .map((r) => this.toFeedback(r));
  }

  create(data: Omit<IFeedback, 'id' | 'createdAt'>): IFeedback {
    const feedback: IFeedback = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.db.run(
      `INSERT INTO feedback (id, userId, orderId, rating, comments, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedback.id,
        feedback.userId,
        feedback.orderId ?? null,
        feedback.rating,
        feedback.comments ?? null,
        feedback.status ?? 'New',
        feedback.createdAt.toISOString(),
        feedback.createdAt.toISOString(),
      ],
    );
    return feedback;
  }

  update(id: string, changes: Partial<IFeedback>): IFeedback | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: IFeedback = { ...existing, ...changes };
    this.db.run(`UPDATE feedback SET rating = ?, comments = ?, status = ? WHERE id = ?`, [
      merged.rating,
      merged.comments ?? null,
      merged.status ?? 'New',
      id,
    ]);
    return merged;
  }
}