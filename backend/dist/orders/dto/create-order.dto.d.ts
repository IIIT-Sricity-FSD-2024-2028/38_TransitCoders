export declare class CreateOrderDto {
    customerId: string;
    deliveryAddress: string;
    priority: 'Low' | 'Medium' | 'High';
    pickupAddress?: string;
    packageType?: string;
    weight?: number;
    amount?: number;
    paymentMode?: 'Prepaid' | 'COD';
}
