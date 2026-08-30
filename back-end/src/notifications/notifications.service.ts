import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';

/**
 * NotificationsService — SRS "Notification Logic":
 *   "The system shall automatically notify Local Delivery Partners and
 *    generate worklists when orders reach their territory."
 *
 * Implemented as a durable in-app notification feed:
 *   - assignment → notifies the agent (worklist generation signal)
 *   - tracking   → notifies the customer on every status milestone
 *   - order      → booking / delivery / cancellation / refund events
 *   - mishap     → notifies the hub manager
 */
export interface INotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  private toNotification(row: any): INotification {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      message: row.message,
      orderId: row.orderId ?? undefined,
      isRead: Number(row.isRead) === 1,
      createdAt: new Date(row.createdAt),
    };
  }

  /** Create a notification for a user (fire-and-forget, never throws). */
  notify(userId: string, type: string, message: string, orderId?: string): void {
    if (!userId) return;
    try {
      this.db.run(
        `INSERT INTO notifications (id, userId, type, message, orderId, isRead, createdAt)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [uuidv4(), userId, type, message, orderId ?? null, new Date().toISOString()],
      );
    } catch (err) {
      // Notification failures must never break the business operation
      console.error('Notification insert failed:', (err as Error).message);
    }
  }

  /** Unread + read notifications for the logged-in user. */
  findAllForUser(userId: string): INotification[] {
    return this.db
      .query('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 100', [userId])
      .map((r) => this.toNotification(r));
  }

  countUnread(userId: string): number {
    const row = this.db.queryOne<{ n: number }>(
      'SELECT COUNT(*) AS n FROM notifications WHERE userId = ? AND isRead = 0',
      [userId],
    );
    return row ? Number(row.n) : 0;
  }

  markRead(id: string, userId: string): boolean {
    const result = this.db.run(
      'UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?',
      [id, userId],
    );
    return result.changes > 0;
  }

  markAllRead(userId: string): number {
    const result = this.db.run('UPDATE notifications SET isRead = 1 WHERE userId = ?', [userId]);
    return Number(result.changes);
  }
}