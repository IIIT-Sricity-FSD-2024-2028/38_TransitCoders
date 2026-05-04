import { IOrder } from './interfaces/order.interface';
export declare class OrdersRepository {
    private readonly orders;
    findAll(): IOrder[];
    findById(id: string): IOrder | undefined;
    findByMerchant(merchantId: string): IOrder[];
    findByCustomer(customerId: string): IOrder[];
    findByHub(hubId: string): IOrder[];
    findByAgent(agentId: string): IOrder[];
    create(order: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>): IOrder;
    update(id: string, changes: Partial<IOrder>): IOrder | undefined;
    delete(id: string): boolean;
}
