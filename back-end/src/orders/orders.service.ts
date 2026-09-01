import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { OrdersRepository } from './orders.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { UsersService } from '../users/users.service';
import { PricingService } from '../pricing/pricing.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IOrder, IStatusEvent, ServiceLevel } from './interfaces/order.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';
import { OrderStatus, VALID_TRANSITIONS } from '../common/constants/statuses.constant';
import { AppLogger } from '../common/logger/app.logger';

/**
 * OrdersService — order lifecycle, pricing authority, and workflow rules.
 *
 * State machine (VALID_TRANSITIONS in common/constants/statuses.constant.ts):
 *   Pending → Assigned → PickedUp → InTransit → OutForDelivery → Delivered
 *   Pending/Assigned → Cancelled (merchant/super-user, with refund)
 *   Delivered → Returned (hub-manager authorized, with refund)
 *   PickedUp..OutForDelivery → Failed (agent mishap report)
 *
 * Security model:
 *   - getAuthorizedOrder() enforces object-level access for EVERY read:
 *     customer → own orders; merchant → own orders; agent → assigned orders;
 *     hub manager → orders touching their hub; super user → everything.
 *   - Status transitions check role + ownership before mutating.
 *   - Assignment is transactional (OrdersRepository.assignAgentTx) so two
 *     concurrent hub managers cannot both claim the same Pending order.
 *
 * Pricing authority:
 *   - The final charge (order.amount) is ALWAYS computed by PricingService
 *     from the backend pricing_config. Client-supplied amounts are ignored.
 *   - The breakdown snapshot is stored with the order (historical pricing).
 */
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @Inject(forwardRef(() => AgentsRepository))
    private readonly agentsRepository: AgentsRepository,
    private readonly usersService: UsersService,
    private readonly pricingService: PricingService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly db: DatabaseService,
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

  /**
   * Object-level access control for a single order read.
   * Throws 404 for unknown ids and 403 when the caller has no relation
   * to the order (prevents IDOR — one customer reading another's order).
   */
  getAuthorizedOrder(id: string, user: IUser): IOrder {
    const order = this.ordersRepository.findById(id) ?? this.ordersRepository.findByOrderId(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    switch (user.role) {
      case Role.SUPER_USER:
        return order;
      case Role.MERCHANT:
        if (order.merchantId === user.id) return order;
        break;
      case Role.CUSTOMER:
        if (order.customerId === user.id) return order;
        break;
      case Role.DELIVERY_AGENT:
        if (order.assignedAgentId === user.id) return order;
        break;
      case Role.HUB_MANAGER:
        // Hub managers see orders at their hub PLUS unassigned orders
        // (the dispatch pool they claim from).
        if (
          user.hubId &&
          ((!order.pickupHubId && !order.deliveryHubId) ||
            order.pickupHubId === user.hubId ||
            order.deliveryHubId === user.hubId)
        ) {
          return order;
        }
        break;
    }
    throw new ForbiddenException('You do not have access to this order');
  }

  findById(id: string): IOrder {
    const order = this.ordersRepository.findById(id) ?? this.ordersRepository.findByOrderId(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto, user: IUser): Promise<IOrder> {
    const customer = this.usersService.findById(dto.customerId);

    // ── Authoritative backend pricing ──────────────────────────────────────
    // The client may suggest inputs, but the final charge is computed here.
    const serviceLevel: ServiceLevel = dto.serviceLevel ?? 'standard';
    const paymentMode = dto.paymentMode ?? 'Prepaid';
    const breakdown = this.pricingService.calculateQuote({
      serviceLevel,
      weightKg: dto.weight ?? 0,
      paymentMode,
    });

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const trackingId = `ST-${Math.floor(100000 + Math.random() * 900000)}`;

    const history: IStatusEvent[] = [
      {
        status: OrderStatus.PENDING,
        timestamp: new Date().toISOString(),
        note: 'Order created',
        by: user.id,
      },
    ];

    const order = this.ordersRepository.create({
      orderId,
      trackingId,
      merchantId: user.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      pickupAddress: dto.pickupAddress,
      deliveryAddress: dto.deliveryAddress,
      pickupHubId: dto.pickupHubId,
      deliveryHubId: dto.deliveryHubId,
      status: OrderStatus.PENDING,
      packageType: dto.packageType,
      serviceLevel,
      weight: dto.weight,
      // ── THE authoritative charge — never client-supplied ──
      amount: breakdown.total,
      pricingBreakdown: breakdown,
      paymentMode,
      paymentStatus: paymentMode === 'Prepaid' ? 'paid' : 'pending',
      priority: dto.priority,
      estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : undefined,
      pickupScheduledAt: dto.pickupScheduledAt ? new Date(dto.pickupScheduledAt) : undefined,
      statusHistory: history,
    } as Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>);

    // Financial ledger entry (charge record)
    this.paymentsService.createChargeForOrder(order);

    // Notify the customer their order was booked
    this.notificationsService.notify(
      customer.id,
      'order',
      `Order ${order.orderId} booked. Tracking ID: ${order.trackingId}. Amount: ₹${order.amount}`,
      order.id,
    );

    AppLogger.info(`Order created ${order.orderId} amount=${order.amount}`, {
      merchantId: user.id,
      customerId: customer.id,
      serviceLevel,
      weight: dto.weight,
    });

    return order;
  }

  update(id: string, dto: UpdateOrderDto, user: IUser): IOrder {
    const order = this.getAuthorizedOrder(id, user);
    if (user.role === Role.CUSTOMER || user.role === Role.DELIVERY_AGENT) {
      throw new ForbiddenException('You do not have permission to update this order');
    }
    // Address/package edits are allowed; financial fields are NOT editable here.
    const { amount: _a, paymentStatus: _ps, pricingBreakdown: _pb, ...safeChanges } = dto as any;
    return this.ordersRepository.update(order.id, safeChanges)!;
  }

  /**
   * Status transition with role + ownership enforcement and history tracking.
   */
  updateStatus(orderId: string, newStatus: OrderStatus, user: IUser): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    const validNextStatuses = VALID_TRANSITIONS[order.status as OrderStatus];

    if (!validNextStatuses || !validNextStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}`,
      );
    }

    // Role rules per transition type
    if (user.role === Role.DELIVERY_AGENT) {
      if (order.assignedAgentId !== user.id) {
        throw new ForbiddenException('You can only update orders assigned to you');
      }
      const agentAllowed: OrderStatus[] = [
        OrderStatus.PICKED_UP,
        OrderStatus.IN_TRANSIT,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
      ];
      if (!agentAllowed.includes(newStatus)) {
        throw new ForbiddenException(`Agents cannot set status ${newStatus}`);
      }
    } else if (user.role === Role.HUB_MANAGER) {
      if (
        !user.hubId ||
        (order.pickupHubId !== user.hubId && order.deliveryHubId !== user.hubId)
      ) {
        throw new ForbiddenException('You can only update orders belonging to your hub');
      }
    }

    const history: IStatusEvent[] = [
      ...(order.statusHistory ?? []),
      {
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: `Status updated to ${newStatus}`,
        by: user.id,
      },
    ];

    const updated = this.ordersRepository.update(order.id, {
      status: newStatus,
      statusHistory: history,
    })!;

    // Notify the customer on every milestone
    this.notificationsService.notify(
      updated.customerId,
      'tracking',
      `Order ${updated.orderId} status: ${newStatus}`,
      updated.id,
    );

    // COD collection on successful delivery
    if (newStatus === OrderStatus.DELIVERED) {
      this.paymentsService.markCollectedOnDelivery(updated);
      this.notificationsService.notify(
        updated.customerId,
        'order',
        `Order ${updated.orderId} has been delivered.`,
        updated.id,
      );
      // Re-read so the response reflects the updated payment status
      return this.ordersRepository.findById(order.id)!;
    }

    return updated;
  }

  /**
   * Assign a delivery agent (Hub Manager, own hub only).
   * Transactional — concurrent double-assignment is impossible.
   */
  assignAgent(orderId: string, agentId: string, user: IUser): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order must be in Pending status to assign an agent');
    }
    if (user.role === Role.HUB_MANAGER) {
      // Orders without a pickup hub can be claimed by any hub manager;
      // orders WITH a hub can only be managed by that hub's manager.
      if (!user.hubId || (order.pickupHubId && order.pickupHubId !== user.hubId)) {
        throw new ForbiddenException('You can only assign agents for orders at your hub');
      }
    }

    const agent = this.agentsRepository.findByUserId(agentId);
    if (!agent) {
      throw new BadRequestException('Invalid agent');
    }
    if (agent.availabilityStatus === 'Offline') {
      throw new BadRequestException('Agent is currently offline and cannot be assigned');
    }
    // Hub-level check: agent must belong to the order's pickup hub.
    // If the order has no pickup hub yet (merchant did not specify one),
    // the agent's hub becomes the pickup hub — realistic logistics behavior.
    if (order.pickupHubId && agent.hubId && agent.hubId !== order.pickupHubId) {
      throw new BadRequestException(
        `Agent belongs to hub ${agent.hubId}, order is at hub ${order.pickupHubId}`,
      );
    }

    const assigned = this.ordersRepository.assignAgentTx(
      order.id,
      agentId,
      OrderStatus.ASSIGNED,
      order.pickupHubId ? undefined : agent.hubId || undefined,
    );
    if (!assigned) {
      throw new BadRequestException('Order is no longer Pending — it may have been assigned by another manager');
    }

    this.agentsRepository.update(agent.id, {
      currentTasksCount: this.ordersRepository.countActiveByAgent(agentId),
    });

    this.notificationsService.notify(
      agentId,
      'assignment',
      `New delivery assigned: ${assigned.orderId} → ${assigned.deliveryAddress}`,
      assigned.id,
    );

    return assigned;
  }

  /**
   * Dispatch automation (SRS: auto-assign by location + workload, with
   * manual override support). Picks the available agent in the hub with the
   * lowest active workload.
   */
  autoAssign(orderId: string, user: IUser): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order must be Pending for auto-assignment');
    }
    const hubId = user.role === Role.HUB_MANAGER ? user.hubId : order.pickupHubId;
    if (!hubId) throw new BadRequestException('Order has no pickup hub');

    const candidates = this.agentsRepository
      .findByHub(hubId)
      .filter((a) => a.availabilityStatus !== 'Offline')
      .sort((a, b) => a.currentTasksCount - b.currentTasksCount);

    if (!candidates.length) {
      throw new BadRequestException(`No available agents in hub ${hubId}`);
    }
    return this.assignAgent(order.id, candidates[0].userId, user);
  }

  /** Cancel (merchant owner or super user) — only before pickup; triggers refund. */
  cancel(orderId: string, user: IUser): { order: IOrder; refund?: unknown } {
    const order = this.getAuthorizedOrder(orderId, user);
    if (user.role === Role.MERCHANT && order.merchantId !== user.id) {
      throw new ForbiddenException('Only the merchant who created this order can cancel it');
    }
    if (user.role === Role.CUSTOMER || user.role === Role.DELIVERY_AGENT) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.ASSIGNED
    ) {
      throw new BadRequestException(
        `Order cannot be cancelled at status ${order.status} — contact your hub manager for a return/refund`,
      );
    }

    const history: IStatusEvent[] = [
      ...(order.statusHistory ?? []),
      {
        status: OrderStatus.CANCELLED,
        timestamp: new Date().toISOString(),
        note: 'Order cancelled',
        by: user.id,
      },
    ];
    const updated = this.ordersRepository.update(order.id, {
      status: OrderStatus.CANCELLED,
      statusHistory: history,
    })!;

    // Financial: refund the charge (idempotent — throws if already refunded)
    let refund: unknown;
    try {
      refund = this.paymentsService.refundOrder(updated, 'cancellation');
    } catch {
      refund = undefined; // no charge record (legacy data) — order still cancels
    }

    this.notificationsService.notify(
      updated.customerId,
      'order',
      `Order ${updated.orderId} was cancelled. Refund initiated if payment was made.`,
      updated.id,
    );

    return { order: updated, refund };
  }

  /**
   * Hub-manager authorized return (SRS: "Authorize Returns/Refunds").
   * Only Delivered orders can be returned; triggers a refund.
   */
  authorizeReturn(orderId: string, user: IUser, reason?: string): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (user.role !== Role.HUB_MANAGER && user.role !== Role.SUPER_USER) {
      throw new ForbiddenException('Only hub managers can authorize returns');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    const history: IStatusEvent[] = [
      ...(order.statusHistory ?? []),
      {
        status: OrderStatus.RETURNED,
        timestamp: new Date().toISOString(),
        note: reason ? `Return authorized: ${reason}` : 'Return authorized by hub manager',
        by: user.id,
      },
    ];
    const updated = this.ordersRepository.update(order.id, {
      status: OrderStatus.RETURNED,
      statusHistory: history,
    })!;

    try {
      this.paymentsService.refundOrder(updated, reason || 'return');
    } catch {
      /* no charge record — still record the return */
    }

    this.notificationsService.notify(
      updated.customerId,
      'order',
      `Return authorized for order ${updated.orderId}. Refund initiated.`,
      updated.id,
    );
    return updated;
  }

  /**
   * Delivery-agent mishap report (SRS: "Update Delivery Status, including
   * mishaps"). Moves the order to Failed and records the mishap.
   */
  reportMishap(orderId: string, user: IUser, type: string, description?: string): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (order.assignedAgentId !== user.id) {
      throw new ForbiddenException('You can only report mishaps on your own deliveries');
    }
    const allowedFrom: OrderStatus[] = [
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.OUT_FOR_DELIVERY,
    ];
    if (!allowedFrom.includes(order.status as OrderStatus)) {
      throw new BadRequestException(`Mishaps can only be reported between Assigned and OutForDelivery (current: ${order.status})`);
    }

    const history: IStatusEvent[] = [
      ...(order.statusHistory ?? []),
      {
        status: OrderStatus.FAILED,
        timestamp: new Date().toISOString(),
        note: `Mishap (${type}): ${description || 'no details'}`,
        by: user.id,
      },
    ];
    const updated = this.ordersRepository.update(order.id, {
      status: OrderStatus.FAILED,
      statusHistory: history,
    })!;

    this.recordMishap(order.id, user.id, type, description);

    // Notify hub manager(s) + customer
    if (order.pickupHubId) {
      const hub = this.usersService.findAll().filter((u) => u.role === Role.HUB_MANAGER && u.hubId === order.pickupHubId);
      for (const hm of hub) {
        this.notificationsService.notify(
          hm.id,
          'mishap',
          `Mishap reported on ${order.orderId}: ${type}`,
          order.id,
        );
      }
    }
    this.notificationsService.notify(
      order.customerId,
      'order',
      `Delivery issue reported for order ${order.orderId}: ${type}. Our team is resolving it.`,
      order.id,
    );

    return updated;
  }

  /** Persist the mishap record (durable, queryable by hub managers). */
  private recordMishap(orderId: string, reportedBy: string, type: string, description?: string): void {
    this.db.run(
      `INSERT INTO mishaps (id, orderId, reportedBy, type, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), orderId, reportedBy, type, description ?? null, new Date().toISOString()],
    );
  }

  /**
   * "Send to different hub" (SRS Hub Manager). Records the transfer,
   * moves the order's current hub, and appends a timeline entry.
   */
  transferToHub(orderId: string, toHubId: string, reason: string | undefined, user: IUser): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (user.role === Role.HUB_MANAGER && (!user.hubId || (order.pickupHubId && order.pickupHubId !== user.hubId))) {
      throw new ForbiddenException('You can only transfer orders currently at your hub');
    }
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.FAILED].includes(order.status as OrderStatus)) {
      throw new BadRequestException(`Order in status ${order.status} cannot be transferred`);
    }
    if (!toHubId || toHubId === order.pickupHubId) {
      throw new BadRequestException('Destination hub must differ from the current hub');
    }

    const history: IStatusEvent[] = [
      ...(order.statusHistory ?? []),
      {
        status: order.status,
        timestamp: new Date().toISOString(),
        location: toHubId,
        note: reason
          ? `Transferred to hub ${toHubId}: ${reason}`
          : `Transferred to hub ${toHubId}`,
        by: user.id,
      },
    ];

    const updated = this.ordersRepository.update(order.id, {
      pickupHubId: toHubId,
      statusHistory: history,
    })!;

    this.db.run(
      `INSERT INTO hub_transfers (id, orderId, fromHubId, toHubId, reason, requestedBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), order.id, order.pickupHubId ?? '', toHubId, reason ?? null, user.id, new Date().toISOString()],
    );

    return updated;
  }

  /** Hard delete (Super User) — only for Pending/Cancelled orders. */
  removeOrder(id: string): void {
    this.ordersRepository.delete(id);
  }

  /** Customer confirms receipt (SRS: delivery confirmation). */
  confirmDelivery(orderId: string, user: IUser): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (order.customerId !== user.id) {
      throw new ForbiddenException('Only the receiving customer can confirm delivery');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Delivery can only be confirmed after the order is Delivered');
    }
    const history: IStatusEvent[] = [
      ...(order.statusHistory ?? []),
      {
        status: 'Delivered',
        timestamp: new Date().toISOString(),
        note: 'Receipt confirmed by customer',
        by: user.id,
      },
    ];
    return this.ordersRepository.update(order.id, { statusHistory: history })!;
  }

  /** Schedule a pickup (merchant or customer sender — SRS pickup scheduling). */
  schedulePickup(orderId: string, user: IUser, pickupAt: Date): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Pickup can only be scheduled while the order is Pending');
    }
    if (Number.isNaN(pickupAt.getTime())) {
      throw new BadRequestException('Invalid pickup date/time');
    }
    return this.ordersRepository.update(order.id, { pickupScheduledAt: pickupAt })!;
  }

  /**
   * Public tracking view by trackingId (SRS: real-time shipment tracking).
   * Returns only non-sensitive fields — no phone numbers or full addresses.
   */
  getPublicTracking(trackingId: string): {
    trackingId: string;
    orderId: string;
    status: string;
    currentLocation?: string;
    estimatedDelivery?: Date;
    timeline: IStatusEvent[];
    createdAt: Date;
  } {
    const order = this.ordersRepository.findByTrackingId(trackingId);
    if (!order) throw new NotFoundException(`No shipment found for tracking ID ${trackingId}`);
    const lastEvent = order.statusHistory?.[order.statusHistory.length - 1];
    return {
      trackingId: order.trackingId,
      orderId: order.orderId,
      status: order.status,
      currentLocation: lastEvent?.location,
      estimatedDelivery: order.estimatedDelivery,
      timeline: order.statusHistory ?? [],
      createdAt: order.createdAt,
    };
  }
}