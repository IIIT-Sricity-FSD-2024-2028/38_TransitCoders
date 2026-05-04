import { AgentsRepository } from './agents.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { IAgentProfile } from './interfaces/agent.interface';
import { IUser } from '../users/interfaces/user.interface';
import { IOrder } from '../orders/interfaces/order.interface';
export declare class AgentsService {
    private readonly agentsRepository;
    private readonly ordersRepository;
    constructor(agentsRepository: AgentsRepository, ordersRepository: OrdersRepository);
    findAll(): IAgentProfile[];
    findById(id: string): IAgentProfile;
    getWorklist(id: string, user: IUser): IOrder[];
    updateAvailability(id: string, dto: UpdateAvailabilityDto, user: IUser): IAgentProfile;
}
