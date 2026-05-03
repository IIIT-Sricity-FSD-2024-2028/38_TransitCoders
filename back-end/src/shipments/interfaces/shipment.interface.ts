export interface IShipment {
  id: string;
  shipmentId: string;       // e.g. "SHP-2024-0001"
  merchantId: string;
  recipient?: string;        // Name of the recipient
  originHubId: string;
  destinationHubId: string;
  serviceType: 'standard' | 'express' | 'same-day';
  weight: number;
  amount: number;
  status: 'pending' | 'processing' | 'in-transit' | 'delivered' | 'cancelled';
  trackingTimeline: Array<{
    status: string;
    location: string;
    timestamp: Date;
    note: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
