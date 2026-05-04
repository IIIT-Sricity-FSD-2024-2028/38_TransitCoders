import { OrdersRepository } from './orders.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrder } from './interfaces/order.interface';
import { IUser } from '../users/interfaces/user.interface';
import { OrderStatus } from '../common/constants/statuses.constant';
export declare class OrdersService {
    private readonly ordersRepository;
    private readonly agentsRepository;
    private readonly usersService;
    constructor(ordersRepository: OrdersRepository, agentsRepository: AgentsRepository, usersService: UsersService);
    findAll(user: IUser): IOrder[];
    findById(id: string): IOrder;
    create(dto: CreateOrderDto, user: IUser): Promise<IOrder>;
    update(id: string, dto: UpdateOrderDto, user: IUser): IOrder;
    updateStatus(orderId: string, newStatus: OrderStatus, user: IUser): IOrder;
    assignAgent(orderId: string, agentId: string, user: IUser): IOrder;
    cancel(orderId: string, user: IUser): void;
}
