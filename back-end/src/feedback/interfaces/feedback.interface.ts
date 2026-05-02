export interface IFeedback {
  id: string;
  userId: string;
  orderId?: string;
  rating: number;       // 1-5
  comments?: string;
  status: 'New' | 'Reviewed' | 'Actioned';
  createdAt: Date;
}
