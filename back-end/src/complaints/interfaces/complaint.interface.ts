export interface IComplaint {
  id: string;
  userId: string;
  orderId?: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: Date;
  updatedAt: Date;
}
