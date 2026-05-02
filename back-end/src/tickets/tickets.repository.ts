import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ITicket } from './interfaces/ticket.interface';

// ODDT-301 — TicketsRepository
@Injectable()
export class TicketsRepository {
  private readonly tickets = new Map<string, ITicket>();
  private ticketCounter = 1000;

  findAll(): ITicket[] {
    return Array.from(this.tickets.values());
  }

  findById(id: string): ITicket | undefined {
    return this.tickets.get(id);
  }

  findByMerchant(merchantId: string): ITicket[] {
    return Array.from(this.tickets.values()).filter(
      (t) => t.merchantId === merchantId,
    );
  }

  create(data: Omit<ITicket, 'id' | 'ticketId' | 'createdAt' | 'updatedAt'>): ITicket {
    this.ticketCounter++;
    const ticket: ITicket = {
      ...data,
      id: uuidv4(),
      ticketId: `TKT-${this.ticketCounter}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  update(id: string, changes: Partial<ITicket>): ITicket | undefined {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    const updated = { ...ticket, ...changes, updatedAt: new Date() };
    this.tickets.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.tickets.delete(id);
  }
}
