export type PaymentType = 'charge' | 'refund';
export type PaymentMethod = 'Prepaid' | 'COD';
export type PaymentRecordStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface IPayment {
  id: string;
  orderId: string;
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  status: PaymentRecordStatus;
  createdAt: Date;
  updatedAt: Date;
}