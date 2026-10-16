import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';

/**
 * ReportsService — revenue & operations reporting built EXCLUSIVELY on
 * authoritative stored data (orders.amount + payments ledger). No client
 * input participates in any financial figure.
 *
 * Definitions (documented business model):
 *   GROSS REVENUE  = Σ charge.amount where charge.status = 'paid'
 *   REFUNDS        = Σ refund.amount where refund.status = 'refunded'
 *   NET REVENUE    = GROSS − REFUNDS
 *   PENDING (COD)  = Σ charge.amount where status = 'pending' (COD awaiting collection)
 */
export interface IRevenueSummary {
  grossCollections: number;
  refunds: number;
  netCollections: number;
  totalTax: number;
  netRevenue: number;
  totalAgentPayouts: number;
  totalOperatingExpenses: number;
  operatingProfit: number;
  profitMargin: number;

  pendingCodAmount: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  failedOrders: number;
  byServiceLevel: Record<string, { orders: number; revenue: number }>;
  byHub: Record<string, { orders: number; revenue: number }>;
  byDay: Array<{ day: string; revenue: number; orders: number }>;
}

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  getRevenueSummary(): IRevenueSummary {
    // ── Financial ledger aggregates ────────────────────────────────────────
    const charges = this.db.queryOne<any>(`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('paid', 'refunded') THEN amount ELSE 0 END), 0) AS gross,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pendingCod
      FROM payments WHERE type = 'charge'
    `);
    const refunds = this.db.queryOne<any>(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments WHERE type = 'refund' AND status = 'refunded'
    `);

    const grossCollections = Number(charges?.gross || 0);
    const refundTotal = Number(refunds?.total || 0);
    const netCollections = grossCollections - refundTotal;
    const pendingCodAmount = Number(charges?.pendingCod || 0);

    // ── Tax Calculation ────────────────────────────────────────────────────
    // Only count tax for orders that remain 'paid'. Refunded orders don't contribute to net revenue.
    const ordersWithBreakdown = this.db.query<{ pricingBreakdown: string }>(
      `SELECT pricingBreakdown FROM orders WHERE paymentStatus = 'paid' AND pricingBreakdown IS NOT NULL`
    );
    let totalTax = 0;
    for (const row of ordersWithBreakdown) {
      try {
        const breakdown = JSON.parse(row.pricingBreakdown);
        if (breakdown.tax) {
          totalTax += Number(breakdown.tax);
        }
      } catch (e) {
        // ignore invalid json
      }
    }

    const netRevenue = netCollections - totalTax;

    // ── Expenses & Payouts ─────────────────────────────────────────────────
    const payoutsRow = this.db.queryOne<any>('SELECT COALESCE(SUM(amount), 0) AS total FROM payouts');
    const totalAgentPayouts = Number(payoutsRow?.total || 0);

    const expensesRow = this.db.queryOne<any>('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses');
    const totalOperatingExpenses = Number(expensesRow?.total || 0);

    const operatingProfit = netRevenue - totalAgentPayouts - totalOperatingExpenses;
    const profitMargin = netRevenue > 0 ? (operatingProfit / netRevenue) * 100 : 0;

    // ── Order status counts ────────────────────────────────────────────────
    const statusRows = this.db.query<{ status: string; n: number }>(
      'SELECT status, COUNT(*) AS n FROM orders GROUP BY status',
    );
    const statusCounts: Record<string, number> = {};
    for (const r of statusRows) statusCounts[r.status] = Number(r.n);

    // ── Revenue by service level (authoritative order.amount snapshot) ────
    const byServiceLevel: Record<string, { orders: number; revenue: number }> = {};
    const serviceRows = this.db.query<any>(`
      SELECT serviceLevel, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS revenue
      FROM orders GROUP BY serviceLevel
    `);
    for (const r of serviceRows) {
      byServiceLevel[r.serviceLevel || 'standard'] = {
        orders: Number(r.n),
        revenue: Number(r.revenue),
      };
    }

    // ── Revenue by hub ─────────────────────────────────────────────────────
    const byHub: Record<string, { orders: number; revenue: number }> = {};
    const hubRows = this.db.query<any>(`
      SELECT pickupHubId AS hub, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS revenue
      FROM orders WHERE pickupHubId IS NOT NULL GROUP BY pickupHubId
    `);
    for (const r of hubRows) {
      byHub[r.hub] = { orders: Number(r.n), revenue: Number(r.revenue) };
    }

    // ── Revenue by day (last 14 days) ──────────────────────────────────────
    const dayRows = this.db.query<any>(`
      SELECT substr(createdAt, 1, 10) AS day, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS revenue
      FROM orders
      WHERE createdAt >= date('now', '-14 days')
      GROUP BY day ORDER BY day
    `);
    const byDay = dayRows.map((r) => ({
      day: r.day,
      revenue: Number(r.revenue),
      orders: Number(r.n),
    }));

    const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return {
      grossCollections,
      refunds: refundTotal,
      netCollections,
      totalTax,
      netRevenue,
      totalAgentPayouts,
      totalOperatingExpenses,
      operatingProfit,
      profitMargin,
      pendingCodAmount,
      totalOrders,
      deliveredOrders: statusCounts['Delivered'] || 0,
      cancelledOrders: statusCounts['Cancelled'] || 0,
      returnedOrders: statusCounts['Returned'] || 0,
      failedOrders: statusCounts['Failed'] || 0,
      byServiceLevel,
      byHub,
      byDay,
    };
  }

  /** Operations snapshot for the admin monitoring dashboard. */
  getOperationsSummary(): Record<string, unknown> {
    const users = this.db.queryOne<any>(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS active
      FROM users
    `);
    const agents = this.db.queryOne<any>(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN availabilityStatus = 'Available' THEN 1 ELSE 0 END) AS available
      FROM agents
    `);
    const hubs = this.db.queryOne<any>(`SELECT COUNT(*) AS total FROM hubs`);
    const complaints = this.db.queryOne<any>(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN status != 'Resolved' THEN 1 ELSE 0 END) AS open
      FROM complaints
    `);
    const mishaps = this.db.queryOne<any>(`SELECT COUNT(*) AS total FROM mishaps`);
    const transfers = this.db.queryOne<any>(`SELECT COUNT(*) AS total FROM hub_transfers`);

    return {
      users: { total: Number(users?.total || 0), active: Number(users?.active || 0) },
      agents: { total: Number(agents?.total || 0), available: Number(agents?.available || 0) },
      hubs: { total: Number(hubs?.total || 0) },
      complaints: { total: Number(complaints?.total || 0), open: Number(complaints?.open || 0) },
      mishaps: { total: Number(mishaps?.total || 0) },
      hubTransfers: { total: Number(transfers?.total || 0) },
    };
  }

  /** Raw payment ledger (Super User audit view). */
  getPaymentLedger(limit = 200): Array<Record<string, unknown>> {
    return this.db.query(
      `SELECT p.id, p.orderId, o.orderId AS orderRef, p.type, p.amount, p.method, p.status, p.createdAt
       FROM payments p LEFT JOIN orders o ON o.id = p.orderId
       ORDER BY p.createdAt DESC LIMIT ?`,
      [limit],
    );
  }
}