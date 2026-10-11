export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved';

export interface IComplaint {
  id: string;
  userId: string;
  orderId?: string;
  type: string;
  priority: ComplaintPriority;
  description: string;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
}