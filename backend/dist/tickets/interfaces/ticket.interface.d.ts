export interface ITicket {
    id: string;
    ticketId: string;
    merchantId: string;
    subject: string;
    trackingId?: string;
    priority: 'low' | 'med' | 'high';
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}
