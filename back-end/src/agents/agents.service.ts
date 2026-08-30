import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { AgentsRepository } from './agents.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { IAgentProfile } from './interfaces/agent.interface';
import { IUser } from '../users/interfaces/user.interface';
import { IOrder } from '../orders/interfaces/order.interface';
import { Role } from '../common/constants/roles.constant';

@Injectable()
export class AgentsService {
  constructor(
    private readonly agentsRepository: AgentsRepository,
    @Inject(forwardRef(() => OrdersRepository))
    private readonly ordersRepository: OrdersRepository,
  ) {}

  findAll(): IAgentProfile[] {
    return this.agentsRepository.findAll();
  }

  findById(id: string): IAgentProfile {
    // Accept either the agent-profile id or the underlying user id —
    // the frontend session only knows the user id.
    const agent = this.agentsRepository.findById(id) ?? this.agentsRepository.findByUserId(id);
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  getWorklist(id: string, user: IUser): IOrder[] {
    const agent = this.findById(id);
    if (user.id !== agent.userId && user.role !== Role.SUPER_USER && user.role !== Role.HUB_MANAGER) {
      throw new ForbiddenException('You can only view your own worklist');
    }
    return this.ordersRepository.findByAgent(agent.userId);
  }

  updateAvailability(id: string, dto: UpdateAvailabilityDto, user: IUser): IAgentProfile {
    const agent = this.findById(id);
    if (user.id !== agent.userId && user.role !== Role.SUPER_USER && user.role !== Role.HUB_MANAGER) {
      throw new ForbiddenException('You can only update your own availability');
    }
    return this.agentsRepository.update(id, dto)!;
  }
}
