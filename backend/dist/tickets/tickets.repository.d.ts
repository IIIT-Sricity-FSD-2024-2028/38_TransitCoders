import { ITicket } from './interfaces/ticket.interface';
export declare class TicketsRepository {
    private readonly tickets;
    private ticketCounter;
    findAll(): ITicket[];
    findById(id: string): ITicket | undefined;
    findByMerchant(merchantId: string): ITicket[];
    create(data: Omit<ITicket, 'id' | 'ticketId' | 'createdAt' | 'updatedAt'>): ITicket;
    update(id: string, changes: Partial<ITicket>): ITicket | undefined;
    delete(id: string): boolean;
}
