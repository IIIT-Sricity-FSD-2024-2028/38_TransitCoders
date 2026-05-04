import { AgentsService } from './agents.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import type { IUser } from '../users/interfaces/user.interface';
import type { IAgentProfile } from './interfaces/agent.interface';
import type { IOrder } from '../orders/interfaces/order.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
export declare class AgentsController {
    private readonly agentsService;
    constructor(agentsService: AgentsService);
    findAll(): IApiResponse<IAgentProfile[]>;
    findById(id: string): IApiResponse<IAgentProfile>;
    getWorklist(id: string, user: IUser): IApiResponse<IOrder[]>;
    updateAvailability(id: string, dto: UpdateAvailabilityDto, user: IUser): IApiResponse<IAgentProfile>;
}
