export type ServiceLevel = 'standard' | 'express' | 'same-day';
export type PaymentMode = 'Prepaid' | 'COD';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface IStatusEvent {
  status: string;
  timestamp: string;
  note?: string;
  location?: string;
  by?: string;
}

export interface IPricingBreakdown {
  baseFee: number;
  weightFee: number;
  codFee: number;
  discount: number;
  tax: number;
  total: number;
  agentPayoutAmount: number;
  serviceLevel: ServiceLevel;
  weightKg: number;
  configSnapshotAt: string;
}

export interface IOrder {
  id: string;
  orderId: string;
  trackingId: string;
  merchantId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  pickupAddress?: string;
  deliveryAddress: string;
  pickupHubId?: string;
  deliveryHubId?: string;
  status:
    | 'Pending'
    | 'Assigned'
    | 'PickedUp'
    | 'InTransit'
    | 'OutForDelivery'
    | 'Delivered'
    | 'Cancelled'
    | 'Returned'
    | 'Failed';
  assignedAgentId?: string;
  packageType?: string;
  serviceLevel: ServiceLevel;
  weight?: number;
  /** Final authoritative customer charge — computed by the backend PricingService at creation. */
  amount: number;
  pricingBreakdown?: IPricingBreakdown;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  priority: 'Low' | 'Medium' | 'High';
  estimatedDelivery?: Date;
  pickupScheduledAt?: Date;
  statusHistory: IStatusEvent[];
  createdAt: Date;
  updatedAt: Date;
}