import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { ServiceLevel, IPricingBreakdown } from '../orders/interfaces/order.interface';

/**
 * PricingService — the SINGLE AUTHORITATIVE source for shipping prices.
 *
 * SRS context: the SRS requires "Calculate shipping prices" (Customer/Sender)
 * but does NOT define a numerical formula. This model is the project's
 * documented business rule set (see docs/FDFED_READINESS_REPORT.md §4):
 *
 *   subtotal  = baseFee + (weight × perKgRate[serviceLevel]) + (codFee if COD)
 *   discount  = subtotal × discountPercent / 100
 *   tax       = (subtotal − discount) × taxPercent / 100
 *   total     = max(subtotal − discount + tax, minCharge)
 *
 * All amounts are INR, rounded to 2 decimals. The configuration is stored in
 * the `pricing_config` table and can be changed by the Super User (admin)
 * at runtime via PUT /pricing/config. Historical orders keep the breakdown
 * snapshot captured at creation, so rule changes never rewrite past charges.
 */
export interface IPricingConfig {
  baseFee: number;
  perKgStandard: number;
  perKgExpress: number;
  perKgSameDay: number;
  codFee: number;
  discountPercent: number;
  taxPercent: number;
  minCharge: number;
}

export const DEFAULT_PRICING_CONFIG: IPricingConfig = {
  baseFee: 40,
  perKgStandard: 25,
  perKgExpress: 45,
  perKgSameDay: 80,
  codFee: 30,
  discountPercent: 0,
  taxPercent: 5,
  minCharge: 60,
};

export interface QuoteInput {
  serviceLevel: ServiceLevel;
  weightKg: number;
  paymentMode?: 'Prepaid' | 'COD';
}

@Injectable()
export class PricingService {
  constructor(private readonly db: DatabaseService) {}

  /** Load the active pricing configuration (seeds defaults on first access). */
  getConfig(): IPricingConfig {
    const row = this.db.queryOne<any>('SELECT * FROM pricing_config WHERE id = 1');
    if (!row) {
      this.db.run(
        `INSERT INTO pricing_config (id, baseFee, perKgStandard, perKgExpress, perKgSameDay, codFee, discountPercent, taxPercent, minCharge, updatedAt)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          DEFAULT_PRICING_CONFIG.baseFee,
          DEFAULT_PRICING_CONFIG.perKgStandard,
          DEFAULT_PRICING_CONFIG.perKgExpress,
          DEFAULT_PRICING_CONFIG.perKgSameDay,
          DEFAULT_PRICING_CONFIG.codFee,
          DEFAULT_PRICING_CONFIG.discountPercent,
          DEFAULT_PRICING_CONFIG.taxPercent,
          DEFAULT_PRICING_CONFIG.minCharge,
          new Date().toISOString(),
        ],
      );
      return { ...DEFAULT_PRICING_CONFIG };
    }
    return {
      baseFee: Number(row.baseFee),
      perKgStandard: Number(row.perKgStandard),
      perKgExpress: Number(row.perKgExpress),
      perKgSameDay: Number(row.perKgSameDay),
      codFee: Number(row.codFee),
      discountPercent: Number(row.discountPercent),
      taxPercent: Number(row.taxPercent),
      minCharge: Number(row.minCharge),
    };
  }

  /** Admin updates the pricing rules. Only provided fields change. */
  updateConfig(changes: Partial<IPricingConfig>): IPricingConfig {
    const current = this.getConfig();
    const merged: IPricingConfig = { ...current, ...changes };
    // Guard against nonsensical values
    for (const key of Object.keys(merged) as (keyof IPricingConfig)[]) {
      if (!Number.isFinite(merged[key]) || merged[key] < 0) {
        merged[key] = current[key];
      }
    }
    const existing = this.db.queryOne('SELECT id FROM pricing_config WHERE id = 1');
    if (!existing) {
      this.db.run(
        `INSERT INTO pricing_config (id, baseFee, perKgStandard, perKgExpress, perKgSameDay, codFee, discountPercent, taxPercent, minCharge, updatedAt)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          merged.baseFee,
          merged.perKgStandard,
          merged.perKgExpress,
          merged.perKgSameDay,
          merged.codFee,
          merged.discountPercent,
          merged.taxPercent,
          merged.minCharge,
          new Date().toISOString(),
        ],
      );
    } else {
      this.db.run(
        `UPDATE pricing_config SET baseFee = ?, perKgStandard = ?, perKgExpress = ?, perKgSameDay = ?, codFee = ?, discountPercent = ?, taxPercent = ?, minCharge = ?, updatedAt = ?
         WHERE id = 1`,
        [
          merged.baseFee,
          merged.perKgStandard,
          merged.perKgExpress,
          merged.perKgSameDay,
          merged.codFee,
          merged.discountPercent,
          merged.taxPercent,
          merged.minCharge,
          new Date().toISOString(),
        ],
      );
    }
    return merged;
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /**
   * THE authoritative price calculation.
   * Used by: POST /pricing/quote (customer/merchant quote),
   *          OrdersService.create (final order charge),
   *          ShipmentsService.create (shipment charge).
   * The client can never set the final amount — it can only supply inputs.
   */
  calculateQuote(input: QuoteInput): IPricingBreakdown {
    const cfg = this.getConfig();
    const serviceLevel: ServiceLevel = ['standard', 'express', 'same-day'].includes(input.serviceLevel)
      ? input.serviceLevel
      : 'standard';
    const weightKg = Math.max(0, Number(input.weightKg) || 0);
    const isCod = input.paymentMode === 'COD';

    const perKg =
      serviceLevel === 'express'
        ? cfg.perKgExpress
        : serviceLevel === 'same-day'
          ? cfg.perKgSameDay
          : cfg.perKgStandard;

    const baseFee = this.round2(cfg.baseFee);
    const weightFee = this.round2(weightKg * perKg);
    const codFee = isCod ? this.round2(cfg.codFee) : 0;

    const subtotal = this.round2(baseFee + weightFee + codFee);
    const discount = this.round2((subtotal * cfg.discountPercent) / 100);
    const taxable = this.round2(subtotal - discount);
    const tax = this.round2((taxable * cfg.taxPercent) / 100);
    const total = Math.max(this.round2(taxable + tax), cfg.minCharge);

    return {
      baseFee,
      weightFee,
      codFee,
      discount,
      tax,
      total,
      serviceLevel,
      weightKg,
      configSnapshotAt: new Date().toISOString(),
    };
  }

  /** Convenience: just the final number. */
  calculateTotal(input: QuoteInput): number {
    return this.calculateQuote(input).total;
  }
}