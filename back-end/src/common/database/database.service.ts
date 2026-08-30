/**
 * DatabaseService — durable persistence layer (SQLite via node:sqlite).
 *
 * Replaces the previous in-memory Map stores. All data now survives
 * server restarts (SRS: durable storage; FDFED: real persistence).
 *
 * - File: <project>/data/swifttrack.db (git-ignored)
 * - WAL mode + busy_timeout via SqlitePool
 * - Connection pool: 4 read connections + 1 writer (see sqlite-pool.ts)
 * - Schema created idempotently at startup (CREATE TABLE IF NOT EXISTS)
 * - Indexes on every lookup column used by repositories
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { DatabaseSync } from 'node:sqlite';
import { SqlitePool } from './sqlite-pool';

const DATA_DIR = join(process.cwd(), 'data');
const DB_FILE = join(process.env.DB_FILE || join(DATA_DIR, 'swifttrack.db'));

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  hubId TEXT,
  isActive INTEGER NOT NULL DEFAULT 0,
  authToken TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_token ON users (authToken);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  isSystem INTEGER NOT NULL DEFAULT 0,
  permissions TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  hubId TEXT,
  availabilityStatus TEXT NOT NULL DEFAULT 'Available',
  vehicleType TEXT,
  currentTasksCount INTEGER NOT NULL DEFAULT 0,
  rating REAL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agents_user ON agents (userId);
CREATE INDEX IF NOT EXISTS idx_agents_hub ON agents (hubId);

CREATE TABLE IF NOT EXISTS hubs (
  id TEXT PRIMARY KEY,
  hubId TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  managerId TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  capacity INTEGER,
  currentLoad INTEGER,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hubs_hubId ON hubs (hubId);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL UNIQUE,
  trackingId TEXT NOT NULL UNIQUE,
  merchantId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  customerName TEXT,
  customerPhone TEXT,
  pickupAddress TEXT,
  deliveryAddress TEXT NOT NULL,
  pickupHubId TEXT,
  deliveryHubId TEXT,
  status TEXT NOT NULL,
  assignedAgentId TEXT,
  packageType TEXT,
  serviceLevel TEXT NOT NULL DEFAULT 'standard',
  weight REAL,
  amount REAL NOT NULL DEFAULT 0,
  pricingBreakdown TEXT,
  paymentMode TEXT NOT NULL DEFAULT 'Prepaid',
  paymentStatus TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'Medium',
  estimatedDelivery TEXT,
  pickupScheduledAt TEXT,
  statusHistory TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_orderId ON orders (orderId);
CREATE INDEX IF NOT EXISTS idx_orders_trackingId ON orders (trackingId);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders (merchantId);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customerId);
CREATE INDEX IF NOT EXISTS idx_orders_agent ON orders (assignedAgentId);
CREATE INDEX IF NOT EXISTS idx_orders_pickupHub ON orders (pickupHubId);
CREATE INDEX IF NOT EXISTS idx_orders_deliveryHub ON orders (deliveryHubId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  shipmentId TEXT NOT NULL UNIQUE,
  merchantId TEXT NOT NULL,
  recipient TEXT,
  originHubId TEXT,
  destinationHubId TEXT,
  serviceType TEXT NOT NULL DEFAULT 'standard',
  weight REAL,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  trackingTimeline TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shipments_shipmentId ON shipments (shipmentId);
CREATE INDEX IF NOT EXISTS idx_shipments_merchant ON shipments (merchantId);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL UNIQUE,
  merchantId TEXT NOT NULL,
  subject TEXT NOT NULL,
  trackingId TEXT,
  priority TEXT NOT NULL DEFAULT 'med',
  status TEXT NOT NULL DEFAULT 'open',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tickets_merchant ON tickets (merchantId);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  customerName TEXT,
  orderId TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints (userId);
CREATE INDEX IF NOT EXISTS idx_complaints_order ON complaints (orderId);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  customerName TEXT,
  orderId TEXT,
  rating INTEGER NOT NULL,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback (userId);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'charge',
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'Prepaid',
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (orderId);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  orderId TEXT,
  isRead INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (userId);

CREATE TABLE IF NOT EXISTS hub_transfers (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  fromHubId TEXT NOT NULL,
  toHubId TEXT NOT NULL,
  reason TEXT,
  requestedBy TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transfers_order ON hub_transfers (orderId);

CREATE TABLE IF NOT EXISTS mishaps (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  reportedBy TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mishaps_order ON mishaps (orderId);

CREATE TABLE IF NOT EXISTS pricing_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  baseFee REAL NOT NULL,
  perKgStandard REAL NOT NULL,
  perKgExpress REAL NOT NULL,
  perKgSameDay REAL NOT NULL,
  codFee REAL NOT NULL,
  discountPercent REAL NOT NULL DEFAULT 0,
  taxPercent REAL NOT NULL DEFAULT 0,
  minCharge REAL NOT NULL,
  updatedAt TEXT NOT NULL
);
`;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: SqlitePool;

  constructor() {
    mkdirSync(DATA_DIR, { recursive: true });
    const size = Number(process.env.DB_POOL_SIZE || 4);
    this.pool = new SqlitePool({ file: DB_FILE, size });
    this.pool.acquireWriter().exec(SCHEMA);
  }

  /** SELECT via the read pool (round-robin connection). */
  query<T = any>(sql: string, params: readonly any[] = []): T[] {
    const conn = this.pool.acquireReader();
    const stmt = conn.prepare(sql);
    return stmt.all(...params) as T[];
  }

  /** SELECT a single row (or undefined). */
  queryOne<T = any>(sql: string, params: readonly any[] = []): T | undefined {
    const rows = this.query<T>(sql, params);
    return rows.length ? rows[0] : undefined;
  }

  /** INSERT/UPDATE/DELETE via the single writer connection. */
  run(sql: string, params: readonly any[] = []): { changes: number | bigint } {
    const conn = this.pool.acquireWriter();
    const stmt = conn.prepare(sql);
    const info = stmt.run(...params);
    return { changes: Number(info.changes) };
  }

  /** Multi-statement atomic operation (IMMEDIATE transaction). */
  transaction<T>(fn: (conn: DatabaseSync) => T): T {
    return this.pool.transaction(fn);
  }

  /** Number of rows in a table — used by the seed service for idempotency. */
  count(table: string): number {
    const row = this.queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
    return row ? Number(row.n) : 0;
  }

  onModuleDestroy(): void {
    this.pool.closeAll();
  }
}