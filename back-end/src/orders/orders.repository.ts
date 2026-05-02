import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IOrder } from './interfaces/order.interface';

@Injectable()
export class OrdersRepository {
  private readonly orders = new Map<string, IOrder>();

  findAll(): IOrder[] {
    return Array.from(this.orders.values());
  }

  findById(id: string): IOrder | undefined {
    return this.orders.get(id);
  }

  findByMerchant(merchantId: string): IOrder[] {
    return this.findAll().filter(order => order.merchantId === merchantId);
  }

  findByCustomer(customerId: string): IOrder[] {
    return this.findAll().filter(order => order.customerId === customerId);
  }

  findByHub(hubId: string): IOrder[] {
    return this.findAll().filter(
      order => order.pickupHubId === hubId || order.deliveryHubId === hubId
    );
  }

  findByAgent(agentId: string): IOrder[] {
    return this.findAll().filter(order => order.assignedAgentId === agentId);
  }

  create(order: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>): IOrder {
    const id = uuidv4();
    const newOrder: IOrder = {
      ...order,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  update(id: string, changes: Partial<IOrder>): IOrder | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...changes,
      updatedAt: new Date(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.orders.delete(id);
  }
}
