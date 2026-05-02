import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IShipment } from './interfaces/shipment.interface';

@Injectable()
export class ShipmentsRepository {
  private shipments = new Map<string, IShipment>();
  private shipmentCounter = 0;

  findAll(): IShipment[] {
    return Array.from(this.shipments.values());
  }

  findById(id: string): IShipment | undefined {
    return this.shipments.get(id);
  }

  findByMerchant(merchantId: string): IShipment[] {
    return this.findAll().filter(s => s.merchantId === merchantId);
  }

  nextShipmentId(): string {
    this.shipmentCounter++;
    const year = new Date().getFullYear();
    return `SHP-${year}-${String(this.shipmentCounter).padStart(4, '0')}`;
  }

  create(data: Omit<IShipment, 'id' | 'createdAt' | 'updatedAt'>): IShipment {
    const shipment: IShipment = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.shipments.set(shipment.id, shipment);
    return shipment;
  }

  update(id: string, changes: Partial<IShipment>): IShipment | undefined {
    const existing = this.shipments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...changes, updatedAt: new Date() };
    this.shipments.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.shipments.delete(id);
  }
}
