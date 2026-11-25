import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { DatabaseSync } from 'node:sqlite';
import { DatabaseService } from '../common/database/database.service';
import { OrdersRepository } from './orders.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { AGENT_TASK_CAPACITY } from '../agents/interfaces/agent.interface';
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
 *   - The assignment transaction checks both the order and the agent's workload.
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
      case Role.ADMIN:
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
    const order = this.ordersRepository.findById(id) ??
      this.ordersRepository.findByOrderId(id) ??
      this.ordersRepository.findByTrackingId(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    switch (user.role) {
      case Role.SUPER_USER:
      case Role.ADMIN:
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
    const customer = dto.customerId
      ? this.usersService.findById(dto.customerId)
      : this.usersService.findCustomerByEmail(dto.customerEmail ?? '');
    if (customer.role !== Role.CUSTOMER || !customer.isActive) {
      throw new BadRequestException('An active customer account is required');
    }

    // ── Authoritative backend pricing ──────────────────────────────────────
    // The client may suggest inputs, but the final charge is computed here.
    const serviceLevel: ServiceLevel = dto.serviceLevel ?? 'standard';
    const paymentMode = dto.paymentMode ?? 'Prepaid';
    const pickupHubId = dto.pickupHubId?.trim() || undefined;
    const deliveryHubId = dto.deliveryHubId?.trim() || pickupHubId;
    if (deliveryHubId && !pickupHubId) {
      throw new BadRequestException('Select a pickup hub before selecting a destination hub');
    }
    if (pickupHubId && dto.weight == null) {
      throw new BadRequestException('Enter a parcel weight between 0.1 and 50 kg');
    }
    const routeHubs = pickupHubId ? [...new Set([pickupHubId, deliveryHubId!])] : [];

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const generateCommonTrackingId = (): string => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';
      const rL = () => letters[Math.floor(Math.random() * letters.length)];
      const rD = () => digits[Math.floor(Math.random() * digits.length)];
      return `TRK-${rL()}${rL()}${rD()}${rD()}${rL()}${rL()}${rD()}${rD()}`;
    };
    const trackingId = dto.trackingId || generateCommonTrackingId();

    const history: IStatusEvent[] = [
      {
        status: OrderStatus.PENDING,
        timestamp: new Date().toISOString(),
        note: 'Order created',
        by: user.id,
      },
    ];

    const order = this.db.transaction((conn) => {
      const breakdown = this.pricingService.calculateQuote({
        serviceLevel, weightKg: dto.weight ?? 0, paymentMode,
      });
      if (dto.quotedTotal !== undefined && dto.quotedTotal !== breakdown.total) {
        throw new ConflictException('Shipping rates changed. Review the updated quote before booking.');
      }
      for (const hubId of routeHubs) this.requireWarehouseSlot(conn, hubId);
      const created = this.ordersRepository.create({
        orderId,
        trackingId,
        merchantId: user.id,
        customerId: customer.id,
        customerName: dto.recipientName?.trim() || customer.name,
        customerPhone: dto.recipientPhone?.trim() || customer.phone,
        pickupAddress: dto.pickupAddress,
        deliveryAddress: dto.deliveryAddress,
        pickupHubId,
        deliveryHubId,
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
      });
      for (const hubId of routeHubs) {
        conn.prepare('INSERT INTO warehouse_visits (orderId, hubId) VALUES (?, ?)').run(created.id, hubId);
      }
      this.paymentsService.createChargeForOrder(created);
      return created;
    });

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

    return this.ordersRepository.findById(order.id)!;
  }

  update(id: string, dto: UpdateOrderDto, user: IUser): IOrder {
    const order = this.getAuthorizedOrder(id, user);
    if (user.role === Role.CUSTOMER || user.role === Role.DELIVERY_AGENT) {
      throw new ForbiddenException('You do not have permission to update this order');
    }
    // Address/package edits are allowed; financial, lifecycle, and hub ownership fields are NOT editable here.
    const {
      amount: _a,
      paymentStatus: _ps,
      pricingBreakdown: _pb,
      status: _s,
      assignedAgentId: _ag,
      statusHistory: _sh,
      pickupHubId: _ph,
      deliveryHubId: _dh,
      quotedTotal: _qt,
      serviceLevel: _sl,
      weight: _w,
      paymentMode: _pm,
      customerId: _c,
      trackingId: _t,
      ...safeChanges
    } = dto as any;
    return this.ordersRepository.update(order.id, safeChanges)!;
  }

  /**
   * Status transition with role + ownership enforcement and history tracking.
   */
  updateStatus(orderId: string, newStatus: OrderStatus, user: IUser, deliveryPhoto?: string): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    const validNextStatuses = VALID_TRANSITIONS[order.status as OrderStatus];

    if (!validNextStatuses || !validNextStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}`,
      );
    }
    if ([OrderStatus.ASSIGNED, OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.FAILED].includes(newStatus)) {
      throw new BadRequestException('Use the dedicated action for this status change');
    }
    if (newStatus === OrderStatus.PICKED_UP && order.warehouse && !order.warehouse.checkedOutAt) {
      throw new BadRequestException('Ask your hub to check out this parcel before marking it picked up');
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
        ...(deliveryPhoto ? { deliveryPhoto } : {}),
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

      // Idempotent payout creation
      if (updated.assignedAgentId) {
        const now = new Date().toISOString();
        const payoutAmount = updated.pricingBreakdown?.agentPayoutAmount || 0;
        this.db.run(
          `INSERT OR IGNORE INTO payouts (id, orderId, agentId, amount, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), updated.id, updated.assignedAgentId, payoutAmount, 'pending', now, now]
        );
      }

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

  private assignmentOrder(orderId: string, user: IUser): IOrder {
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
    if (order.warehouse && (order.pickupHubId !== order.deliveryHubId ||
      !order.warehouse.checkedInAt || order.warehouse.checkedOutAt)) {
      throw new BadRequestException('Check the parcel in at its destination hub before assigning an agent');
    }
    return order;
  }

  private saveAssignment(order: IOrder, agent: { userId: string; hubId: string }, user: IUser): IOrder {
    const assigned = this.ordersRepository.update(order.id, {
      assignedAgentId: agent.userId,
      status: OrderStatus.ASSIGNED,
      pickupHubId: order.pickupHubId || agent.hubId || undefined,
      statusHistory: [...order.statusHistory, {
        status: OrderStatus.ASSIGNED, timestamp: new Date().toISOString(), by: user.id,
        note: 'Delivery agent assigned',
      }],
    })!;
    this.notificationsService.notify(
      agent.userId,
      'assignment',
      `New delivery assigned: ${assigned.orderId} → ${assigned.deliveryAddress}`,
      assigned.id,
    );
    return assigned;
  }

  assignAgent(orderId: string, agentId: string, user: IUser): IOrder {
    return this.db.transaction(() => {
      const order = this.assignmentOrder(orderId, user);
      const agent = this.agentsRepository.findByUserId(agentId);
      const agentUser = agent && this.usersService.findById(agent.userId);
      if (!agent || agentUser?.role !== Role.DELIVERY_AGENT || !agentUser.isActive) {
        throw new BadRequestException('Invalid agent');
      }
      const hubId = order.pickupHubId || (user.role === Role.HUB_MANAGER ? user.hubId : undefined);
      if (hubId && agent.hubId !== hubId) throw new BadRequestException(`Select an agent from hub ${hubId}`);
      if (agent.availabilityStatus !== 'Available') throw new BadRequestException('This agent is unavailable');
      if (agent.currentTasksCount >= AGENT_TASK_CAPACITY) {
        throw new ConflictException(`This agent already has ${agent.currentTasksCount} active deliveries. Choose another agent.`);
      }
      return this.saveAssignment(order, agent, user);
    });
  }

  autoAssign(orderId: string, user: IUser): IOrder {
    return this.db.transaction(() => {
      const order = this.assignmentOrder(orderId, user);
      const hubId = order.pickupHubId || user.hubId;
      if (!hubId) throw new BadRequestException('Order has no pickup hub');

      const agent = this.nextAvailableAgent(hubId);
      if (!agent) throw new ConflictException(`No available agents with capacity in hub ${hubId}`);
      return this.saveAssignment(order, agent, user);
    });
  }

  private nextAvailableAgent(hubId: string) {
    return this.agentsRepository.findByHub(hubId).find(candidate =>
      candidate.availabilityStatus === 'Available' && candidate.currentTasksCount < AGENT_TASK_CAPACITY,
    );
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
    if (updated.paymentStatus === 'pending') {
      this.paymentsService.cancelUncollectedCharge(updated);
    } else if (updated.paymentStatus === 'paid') {
      try {
        refund = this.paymentsService.refundOrder(updated, 'cancellation');
      } catch (err) {
        if (!(err instanceof NotFoundException)) throw err;
      }
    }

    this.notificationsService.notify(
      updated.customerId,
      'order',
      `Order ${updated.orderId} was cancelled. Refund initiated if payment was made.`,
      updated.id,
    );

    return { order: this.ordersRepository.findById(order.id)!, refund };
  }

  /**
   * Hub-manager authorized return (SRS: "Authorize Returns/Refunds").
   * Only Delivered orders can be returned; triggers a refund.
   */
  authorizeReturn(orderId: string, user: IUser, reason?: string): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (user.role !== Role.HUB_MANAGER && user.role !== Role.SUPER_USER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only hub managers, super users, and admins can authorize returns');
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

    if (updated.paymentStatus === 'paid') {
      try {
        this.paymentsService.refundOrder(updated, reason || 'return');
      } catch (err) {
        if (!(err instanceof NotFoundException)) throw err;
      }
    }

    this.notificationsService.notify(
      updated.customerId,
      'order',
      `Return authorized for order ${updated.orderId}. Refund initiated.`,
      updated.id,
    );
    return this.ordersRepository.findById(order.id)!;
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

  private requireWarehouseSlot(conn: DatabaseSync, hubId: string): void {
    const hub = conn.prepare(
      'SELECT status, capacity, storedParcels, reservedParcels FROM hub_inventory WHERE hubId = ?',
    ).get(hubId);
    if (!hub || hub.status !== 'active') {
      throw new BadRequestException(`Hub ${hubId} is unavailable. Choose an active hub.`);
    }
    if (Number(hub.storedParcels) + Number(hub.reservedParcels) >= Number(hub.capacity)) {
      throw new ConflictException(`Hub ${hubId} has no warehouse slots left. Choose another hub or try again later.`);
    }
  }

  scanWarehouse(reference: string, action: 'check-in' | 'check-out', user: IUser, autoAssign = false): IOrder {
    const orderId = this.db.transaction(conn => {
      const order = this.getAuthorizedOrder(reference.trim(), user);
      const visit = order.warehouse;
      if (!visit || visit.hubId !== user.hubId) {
        throw new ForbiddenException('This parcel is not scheduled to be scanned at your hub');
      }

      const checkingIn = action === 'check-in';
      if (checkingIn && visit.checkedOutAt) throw new BadRequestException('This parcel has already left this hub');
      const agent = checkingIn && autoAssign && order.status === OrderStatus.PENDING && order.deliveryHubId === visit.hubId
        ? this.nextAvailableAgent(visit.hubId)
        : undefined;
      if (checkingIn ? visit.checkedInAt : visit.checkedOutAt) {
        if (agent) this.saveAssignment(order, agent, user);
        return order.id;
      }
      if (checkingIn && order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Only incoming pending parcels can be checked in');
      }
      if (!checkingIn) {
        if (!visit.checkedInAt) throw new BadRequestException('Check in the parcel before checking it out');
        const isTransfer = order.status === OrderStatus.PENDING && order.deliveryHubId !== visit.hubId;
        const canRelease = [OrderStatus.ASSIGNED, OrderStatus.CANCELLED, OrderStatus.FAILED].includes(order.status as OrderStatus);
        if (!isTransfer && !canRelease) {
          throw new BadRequestException('Assign an agent before checking this parcel out');
        }
      }

      const timestamp = new Date().toISOString();
      const column = checkingIn ? 'checkedInAt' : 'checkedOutAt';
      conn.prepare(`UPDATE warehouse_visits SET ${column} = ? WHERE orderId = ? AND hubId = ?`)
        .run(timestamp, order.id, visit.hubId);
      const statusHistory = [...order.statusHistory, {
        status: order.status,
        timestamp,
        location: visit.hubId,
        note: checkingIn ? 'Warehouse check-in' : 'Warehouse check-out',
        by: user.id,
      }];
      if (agent) {
        this.saveAssignment({ ...order, statusHistory }, agent, user);
      } else {
        this.ordersRepository.update(order.id, { statusHistory });
      }
      if (!checkingIn && order.status === OrderStatus.ASSIGNED) {
        this.notificationsService.notify(order.assignedAgentId!, 'tracking', `Parcel ${order.orderId} is ready for pickup.`, order.id);
      }
      return order.id;
    });
    return this.ordersRepository.findById(orderId)!;
  }

  getAllMishaps(user: IUser): Array<{
    id: string;
    orderId: string;
    orderNumber?: string;
    trackingId?: string;
    customerName?: string;
    reportedBy: string;
    type: string;
    description?: string;
    createdAt: string;
  }> {
    const isAgent = user.role === Role.DELIVERY_AGENT;
    const isHubManager = user.role === Role.HUB_MANAGER;
    if (isHubManager && !user.hubId) return [];
    const scope = isAgent ? 'WHERE m.reportedBy = ?' : isHubManager ? 'WHERE o.pickupHubId = ? OR o.deliveryHubId = ?' : '';
    const parameters = isAgent ? [user.id] : isHubManager ? [user.hubId, user.hubId] : [];
    return this.db.query<any>(
      `SELECT m.id, m.orderId, m.reportedBy, m.type, m.description, m.createdAt,
              o.orderId AS orderNumber, o.trackingId, o.customerName, o.status as orderStatus
       FROM mishaps m
       LEFT JOIN orders o ON m.orderId = o.id
       ${scope}
       ORDER BY m.createdAt DESC`,
      parameters,
    );
  }

  /**
   * "Send to different hub" (SRS Hub Manager). Records the transfer,
   * moves the order's current hub, and appends a timeline entry.
   */
  transferToHub(orderId: string, toHubId: string, reason: string | undefined, user: IUser): IOrder {
    const updatedId = this.db.transaction(() => this.recordTransfer(orderId, toHubId, reason, user).id);
    return this.ordersRepository.findById(updatedId)!;
  }

  private recordTransfer(orderId: string, toHubId: string, reason: string | undefined, user: IUser): IOrder {
    const order = this.getAuthorizedOrder(orderId, user);
    if (user.role === Role.HUB_MANAGER && (!user.hubId || (order.pickupHubId && order.pickupHubId !== user.hubId))) {
      throw new ForbiddenException('You can only transfer orders currently at your hub');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Only Pending orders can be transferred. This order is ${order.status}.`,
      );
    }
    if (order.assignedAgentId) {
      throw new BadRequestException(
        'This order already has an assigned agent. Unassign the agent before transferring.',
      );
    }
    if (!toHubId || toHubId === order.pickupHubId) {
      throw new BadRequestException('Destination hub must differ from the current hub');
    }
    if (order.warehouse) {
      if (toHubId !== order.deliveryHubId) {
        throw new BadRequestException('Transfer this parcel to its reserved destination hub');
      }
      if (!order.warehouse.checkedOutAt) {
        throw new BadRequestException('Check the parcel out of the current warehouse before transferring');
      }
    }

    const destHub = this.db.queryOne<{ status: string; address?: string; city?: string }>(
      'SELECT status, address, city FROM hubs WHERE hubId = ?',
      [toHubId],
    );
    if (!destHub) {
      throw new BadRequestException(`Destination hub ${toHubId} does not exist`);
    }
    if (destHub.status !== 'active') {
      throw new BadRequestException(
        `Destination hub ${toHubId} is not active (status: ${destHub.status})`,
      );
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
      pickupAddress: [destHub.address, destHub.city].filter(Boolean).join(', ') || toHubId,
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
    this.db.transaction(() => {
      const order = this.findById(id);
      if (order.warehouse?.checkedInAt && !order.warehouse.checkedOutAt) {
        throw new ConflictException('Check the parcel out of the warehouse before deleting the order');
      }
      this.ordersRepository.delete(order.id);
    });
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
    if (order.statusHistory?.some(event => event.note === 'Receipt confirmed by customer' && event.by === user.id)) {
      return order;
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
    const lastLocation = order.statusHistory?.findLast(event => event.location)?.location;
    return {
      trackingId: order.trackingId,
      orderId: order.orderId,
      status: order.status,
      currentLocation: lastLocation,
      estimatedDelivery: order.estimatedDelivery,
      timeline: (order.statusHistory ?? []).map(({ status, timestamp, location }) => ({ status, timestamp, location })),
      createdAt: order.createdAt,
    };
  }
}
