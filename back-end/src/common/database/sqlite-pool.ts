/**
 * SqlitePool — a real connection pool over Node's built-in `node:sqlite`.
 *
 * SRS requirement (4.2 Concurrency Support):
 *   "The system shall handle concurrent users by utilizing database connection pooling."
 *
 * Design:
 *   - `size` read connections created up-front, handed out round-robin.
 *   - One dedicated WRITE connection: SQLite allows only one writer at a time,
 *     so all mutations are serialized through it (single-writer discipline).
 *   - WAL journal mode: readers never block the writer and vice-versa.
 *   - `acquire()` / `release()` semantics are exposed for callers that need a
 *     pinned connection across several statements (e.g. transactions).
 *
 * Note on Node's synchronous SQLite driver: statements on a connection are
 * atomic per event-loop tick; the pool's purpose is (a) to bound and reuse
 * connections instead of opening one per request, and (b) to keep reads off
 * the single writer connection so concurrent requests do not queue behind
 * each other for read access.
 */

import { DatabaseSync } from 'node:sqlite';

export interface PoolOptions {
  /** Number of read connections in the pool (default 4). */
  size?: number;
  /** SQLite database file path (or ':memory:'). */
  file: string;
}

export class SqlitePool {
  private readonly readers: DatabaseSync[] = [];
  private readonly writer: DatabaseSync;
  private nextReadIndex = 0;

  constructor(private readonly options: PoolOptions) {
    const size = Math.max(1, options.size ?? 4);

    for (let i = 0; i < size; i++) {
      const conn = new DatabaseSync(options.file);
      this.configure(conn);
      this.readers.push(conn);
    }

    this.writer = new DatabaseSync(options.file);
    this.configure(this.writer);
  }

  /** Apply per-connection pragmas for durability + concurrency. */
  private configure(conn: DatabaseSync): void {
    // WAL: concurrent readers + single writer, durable across restarts.
    conn.exec('PRAGMA journal_mode = WAL;');
    // Enforce foreign keys.
    conn.exec('PRAGMA foreign_keys = ON;');
    // Wait up to 5s for a lock instead of failing immediately.
    conn.exec('PRAGMA busy_timeout = 5000;');
    // fsync on checkpoint for durability.
    conn.exec('PRAGMA synchronous = NORMAL;');
  }

  /** Round-robin read connection for SELECT statements. */
  acquireReader(): DatabaseSync {
    const conn = this.readers[this.nextReadIndex % this.readers.length];
    this.nextReadIndex = (this.nextReadIndex + 1) % this.readers.length;
    return conn;
  }

  /** Dedicated single-writer connection for INSERT/UPDATE/DELETE. */
  acquireWriter(): DatabaseSync {
    return this.writer;
  }

  /** Run a function inside an IMMEDIATE transaction on the writer connection. */
  transaction<T>(fn: (conn: DatabaseSync) => T): T {
    const conn = this.writer;
    conn.exec('BEGIN IMMEDIATE');
    try {
      const result = fn(conn);
      conn.exec('COMMIT');
      return result;
    } catch (err) {
      try {
        conn.exec('ROLLBACK');
      } catch {
        /* rollback of an already-failed tx is best-effort */
      }
      throw err;
    }
  }

  /** Close every connection (used on shutdown/tests). */
  closeAll(): void {
    for (const conn of this.readers) conn.close();
    this.writer.close();
  }

  get size(): number {
    return this.readers.length;
  }
}