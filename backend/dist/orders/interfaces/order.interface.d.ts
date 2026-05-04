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
    status: 'Pending' | 'Assigned' | 'PickedUp' | 'InTransit' | 'OutForDelivery' | 'Delivered' | 'Cancelled';
    assignedAgentId?: string;
    packageType?: string;
    weight?: number;
    amount?: number;
    paymentMode?: 'Prepaid' | 'COD';
    priority: 'Low' | 'Medium' | 'High';
    estimatedDelivery?: Date;
    createdAt: Date;
    updatedAt: Date;
}
