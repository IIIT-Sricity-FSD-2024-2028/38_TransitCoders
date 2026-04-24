export interface IFeedback {
    id: string;
    userId: string;
    orderId?: string;
    rating: number;
    comments?: string;
    status: 'New' | 'Reviewed' | 'Actioned';
    createdAt: Date;
}
