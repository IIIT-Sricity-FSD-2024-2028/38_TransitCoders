import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrder } from './interfaces/order.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';
import { OrderStatus, VALID_TRANSITIONS } from '../common/constants/statuses.constant';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @Inject(forwardRef(() => AgentsRepository))
    private readonly agentsRepository: AgentsRepository,
    private readonly usersService: UsersService,
  ) {}

  findAll(user: IUser): IOrder[] {
    switch (user.role) {
      case Role.MERCHANT:
        return this.ordersRepository.findByMerchant(user.id);
      case Role.CUSTOMER:
        return this.ordersRepository.findByCustomer(user.id);
      case Role.HUB_MANAGER:
        if (!user.hubId) return [];
        return this.ordersRepository.findByHub(user.hubId);
      case Role.DELIVERY_AGENT:
        return this.ordersRepository.findByAgent(user.id);
      case Role.SUPER_USER:
        return this.ordersRepository.findAll();
      default:
        return [];
    }
  }

  findById(id: string): IOrder {
    const order = this.ordersRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto, user: IUser): Promise<IOrder> {
    const customer = this.usersService.findById(dto.customerId);
    
    const orderId = `ORD_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const trackingId = `ST-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.ordersRepository.create({
      ...dto,
      orderId,
      trackingId,
      merchantId: user.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      status: OrderStatus.PENDING,
    });
  }

  update(id: string, dto: UpdateOrderDto, user: IUser): IOrder {
    const order = this.findById(id);
    if (order.merchantId !== user.id && user.role !== Role.SUPER_USER && user.role !== Role.HUB_MANAGER) {
      throw new ForbiddenException('You do not have permission to update this order');
    }
    return this.ordersRepository.update(id, dto)!;
  }

  updateStatus(orderId: string, newStatus: OrderStatus, user: IUser): IOrder {
    const order = this.findById(orderId);
    const validNextStatuses = VALID_TRANSITIONS[order.status as OrderStatus];
    
    if (!validNextStatuses || !validNextStatuses.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    return this.ordersRepository.update(orderId, { status: newStatus })!;
  }

  assignAgent(orderId: string, agentId: string, user: IUser): IOrder {
    const order = this.findById(orderId);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order must be in Pending status to assign an agent');
    }

    const agent = this.agentsRepository.findByUserId(agentId);
    if (!agent) {
      throw new BadRequestException('Invalid agent');
    }

    this.agentsRepository.update(agent.id, { currentTasksCount: agent.currentTasksCount + 1 });

    return this.ordersRepository.update(orderId, {
      assignedAgentId: agentId,
      status: OrderStatus.ASSIGNED,
    })!;
  }

  cancel(orderId: string, user: IUser): void {
    const order = this.findById(orderId);
    if (order.merchantId !== user.id && user.role !== Role.SUPER_USER) {
      throw new ForbiddenException('Only the merchant or a super user can cancel this order');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be cancelled after it has been assigned to an agent');
    }
    
    this.ordersRepository.update(orderId, { status: OrderStatus.CANCELLED });
  }
}
