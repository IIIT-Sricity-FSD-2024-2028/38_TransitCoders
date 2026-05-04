import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { OrderStatus } from '../common/constants/statuses.constant';
import type { IUser } from '../users/interfaces/user.interface';
import type { IOrder } from './interfaces/order.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findAll(user: IUser): IApiResponse<IOrder[]>;
    findById(id: string): IApiResponse<IOrder>;
    create(dto: CreateOrderDto, user: IUser): Promise<IApiResponse<IOrder>>;
    update(id: string, dto: UpdateOrderDto, user: IUser): IApiResponse<IOrder>;
    updateStatus(id: string, status: OrderStatus, user: IUser): IApiResponse<IOrder>;
    assignAgent(id: string, dto: AssignAgentDto, user: IUser): IApiResponse<IOrder>;
    cancel(id: string, user: IUser): IApiResponse<null>;
}
