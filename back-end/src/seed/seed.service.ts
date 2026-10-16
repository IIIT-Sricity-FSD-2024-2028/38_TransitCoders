import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RolesRepository } from '../roles/roles.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { HubsRepository } from '../hubs/hubs.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { ShipmentsRepository } from '../shipments/shipments.repository';
import { TicketsRepository } from '../tickets/tickets.repository';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { FeedbackRepository } from '../feedback/feedback.repository';
import { PricingService } from '../pricing/pricing.service';
import { DatabaseService } from '../common/database/database.service';
import { Role } from '../common/constants/roles.constant';
import { IStatusEvent } from '../orders/interfaces/order.interface';

/**
 * SeedService — idempotent demo-data seeding.
 *
 * With durable SQLite storage, seeding now runs ONLY when the target table
 * is empty. Restarting the server never wipes or duplicates data — the
 * previous in-memory implementation reseeded (and lost) everything on
 * every boot.
 */
@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly db: DatabaseService,
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly hubsRepository: HubsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly shipmentsRepository: ShipmentsRepository,
    private readonly ticketsRepository: TicketsRepository,
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly feedbackRepository: FeedbackRepository,
    private readonly pricingService: PricingService,
  ) {}

  async onModuleInit() {
    // Pricing config self-seeds on first access
    this.pricingService.getConfig();

    await this.seedRoles();
    await this.seedUsers();
    await this.seedHubs();
    await this.seedOrders();
    if (this.isDevelopmentOrTestEnvironment()) {
      try {
        await this.migrateHubManagerDevelopmentData();
        await this.seedExpandedMultiHubDevelopmentData();
      } catch (error) {
        console.error('⚠️ Development-data migration was not applied:', error);
      }
    }
    await this.seedShipments();
    await this.seedTickets();
    await this.seedComplaints();
    await this.seedFeedback();
  }

  /**
   * Determine whether development fixtures should be seeded.
   *
   * Development fixtures (e.g. dev accounts and the Hub Manager demo workflow fixture)
   * must NEVER be seeded in a production deployment, even if NODE_ENV is missing or misconfigured.
   *
   * Never rely on a filename alone (such as 'swifttrack.db') as proof of a development
   * environment, because production deployments may also default to or use that filename.
   *
   * Development seeding is allowed ONLY when explicitly verified by:
   * 1. NODE_ENV explicitly set to 'development' or 'test'.
   * 2. An explicit opt-in environment flag (SEED_DEV_DATA, SWIFTTRACK_DEV_FIXTURES, SWIFTTRACK_ENV).
   * 3. An explicit development/test npm script lifecycle event (e.g. start:dev, test, test:e2e).
   *
   * In all other cases (missing NODE_ENV, unknown environment, or production/staging),
   * development fixtures are strictly suppressed.
   */
  isDevelopmentOrTestEnvironment(): boolean {
    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase().trim();

    // 1. Strict blacklist: production or staging environments must NEVER seed dev fixtures
    if (
      nodeEnv === 'production' ||
      nodeEnv === 'staging' ||
      nodeEnv === 'prod' ||
      nodeEnv === 'release' ||
      nodeEnv === 'uat'
    ) {
      return false;
    }

    // 2. Extra safety: refuse if database path explicitly points to production
    const dbFile = (process.env.DB_FILE || '').toLowerCase();
    if (dbFile.includes('production') || dbFile.includes('prod.db')) {
      return false;
    }

    // 3. Compiled distribution protection: running from dist/ without explicit dev flags is blocked
    const isCompiledDist = __filename.includes('dist');
    const hasExplicitDevFlag =
      process.env.SEED_DEV_DATA === 'true' ||
      process.env.SWIFTTRACK_DEV_FIXTURES === 'true' ||
      process.env.SWIFTTRACK_ENV === 'development';

    if (isCompiledDist && !hasExplicitDevFlag) {
      return false;
    }

    // 4. Positive identification: explicit development or test NODE_ENV
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      return true;
    }

    // 5. Positive identification: explicit opt-in flag
    if (hasExplicitDevFlag) {
      return true;
    }

    // 6. Positive identification: running from recognized development or test npm scripts
    const lifecycle = (process.env.npm_lifecycle_event || '').toLowerCase().trim();
    if (
      lifecycle === 'start:dev' ||
      lifecycle === 'start:debug' ||
      lifecycle === 'test' ||
      lifecycle === 'test:e2e' ||
      lifecycle === 'test:watch'
    ) {
      return true;
    }

    // 7. DEFAULT CLOSED: If NODE_ENV is missing, empty, or unverified, NEVER seed dev fixtures.
    // Filename substrings (e.g. 'swifttrack.db') are NEVER accepted as proof of development.
    return false;
  }

  // ── 5 system roles with full permission maps ──────────────────────────────
  private seedRoles() {
    if (this.db.count('roles') > 0) return;
    const roles = [
      {
        roleId: 'super_user',
        name: 'Super User',
        description: 'Full system access — can manage all entities',
        isSystem: true,
        permissions: {
          view_users: true, create_users: true, update_users: true, delete_users: true, approve_users: true,
          view_orders: true, create_orders: true, update_orders: true, delete_orders: true, assign_agents: true,
          view_shipments: true, view_hubs: true, create_hubs: true, update_hubs: true,
          view_agents: true, view_tickets: true, update_tickets: true,
          view_complaints: true, update_complaints: true,
          view_feedback: true, update_feedback: true,
          view_roles: true, update_roles: true,
          view_reports: true, revenue_analytics: true,
        },
      },
      {
        roleId: 'hub_manager',
        name: 'Hub Manager',
        description: 'Manages hub operations, orders, and agents',
        isSystem: true,
        permissions: {
          view_users: true, create_users: true, update_users: true, delete_users: false, approve_users: true,
          view_orders: true, create_orders: false, update_orders: true, delete_orders: false, assign_agents: true,
          view_shipments: false, view_hubs: true, create_hubs: false, update_hubs: false,
          view_agents: true, view_tickets: false, update_tickets: false,
          view_complaints: true, update_complaints: true,
          view_feedback: false, update_feedback: false,
          view_roles: false, update_roles: false,
        },
      },
      {
        roleId: 'merchant',
        name: 'Merchant',
        description: 'Creates orders and shipments; manages tickets',
        isSystem: true,
        permissions: {
          view_users: false, create_users: false, update_users: false, delete_users: false, approve_users: false,
          view_orders: true, create_orders: true, update_orders: true, delete_orders: true, assign_agents: false,
          view_shipments: true, view_hubs: false, create_hubs: false, update_hubs: false,
          view_agents: false, view_tickets: true, update_tickets: true,
          view_complaints: false, update_complaints: false,
          view_feedback: false, update_feedback: false,
          view_roles: false, update_roles: false,
        },
      },
      {
        roleId: 'delivery_agent',
        name: 'Delivery Agent',
        description: 'Views assigned orders and updates availability',
        isSystem: true,
        permissions: {
          view_users: false, create_users: false, update_users: false, delete_users: false, approve_users: false,
          view_orders: true, create_orders: false, update_orders: false, delete_orders: false, assign_agents: false,
          view_shipments: false, view_hubs: false, create_hubs: false, update_hubs: false,
          view_agents: true, view_tickets: false, update_tickets: false,
          view_complaints: false, update_complaints: false,
          view_feedback: false, update_feedback: false,
          view_roles: false, update_roles: false,
        },
      },
      {
        roleId: 'customer',
        name: 'Customer',
        description: 'Views own orders; submits complaints and feedback',
        isSystem: true,
        permissions: {
          view_users: false, create_users: false, update_users: false, delete_users: false, approve_users: false,
          view_orders: true, create_orders: false, update_orders: false, delete_orders: false, assign_agents: false,
          view_shipments: false, view_hubs: false, create_hubs: false, update_hubs: false,
          view_agents: false, view_tickets: false, update_tickets: false,
          view_complaints: true, update_complaints: false,
          view_feedback: true, update_feedback: false,
          view_roles: false, update_roles: false,
        },
      },
      {
        roleId: 'admin',
        name: 'Admin',
        description: 'Business and operations oversight',
        isSystem: true,
        permissions: {
          view_users: true, create_users: true, update_users: true, delete_users: false, approve_users: true,
          view_orders: true, create_orders: false, update_orders: true, delete_orders: false, assign_agents: true,
          view_shipments: true, view_hubs: true, create_hubs: false, update_hubs: false,
          view_agents: true, view_tickets: true, update_tickets: true,
          view_complaints: true, update_complaints: true,
          view_feedback: true, update_feedback: true,
          view_roles: false, update_roles: false,
          view_reports: true, revenue_analytics: true,
        },
      },
    ];

    roles.forEach((r) => this.rolesRepository.create(r as any));
    console.log('✅ Seeded 6 system roles');
  }

  // ── Base users so the app is testable from day one ────────────────────────
  private async seedUsers() {
    if (this.db.count('users') > 0) return;
    const hash = (pw: string) => bcrypt.hash(pw, 10);
    const hashedPassword = await hash('password123');

    const users = [
      ...(this.isDevelopmentOrTestEnvironment() ? [
        { name: 'Super Admin', email: 'super@swifttrack.com', password: hashedPassword, role: 'super_user' as const, isActive: true },
        { name: 'Business Admin', email: 'admin@swifttrack.com', password: hashedPassword, role: 'admin' as const, isActive: true },
      ] : []),
      { name: 'Hub Manager Chennai', email: 'hm_chennai@swifttrack.com', password: hashedPassword, role: 'hub_manager' as const, hubId: 'H001', isActive: true },
      { name: 'Hub Manager Mumbai', email: 'hm_mumbai@swifttrack.com', password: hashedPassword, role: 'hub_manager' as const, hubId: 'H002', isActive: true },
      { name: 'Hub Manager Delhi', email: 'hm_delhi@swifttrack.com', password: hashedPassword, role: 'hub_manager' as const, hubId: 'H003', isActive: true },
      { name: 'Hub Manager Bengaluru', email: 'hm_bengaluru@swifttrack.com', password: hashedPassword, role: 'hub_manager' as const, hubId: 'H004', isActive: true },
      { name: 'Hub Manager Kolkata', email: 'hm_kolkata@swifttrack.com', password: hashedPassword, role: 'hub_manager' as const, hubId: 'H005', isActive: true },
      { name: 'Hub Manager Hyderabad', email: 'hm_hyderabad@swifttrack.com', password: hashedPassword, role: 'hub_manager' as const, hubId: 'H006', isActive: true },
      { name: 'Merchant One', email: 'merchant1@example.com', password: await hash('password123'), role: 'merchant' as const, company: 'Acme Corp', isActive: true },
      { name: 'Merchant Two', email: 'merchant2@example.com', password: await hash('password123'), role: 'merchant' as const, company: 'Beta Goods', isActive: true },
      { name: 'Agent One', email: 'agent1@swifttrack.com', password: await hash('password123'), role: 'delivery_agent' as const, hubId: 'H001', isActive: true },
      { name: 'Agent Two', email: 'agent2@swifttrack.com', password: await hash('password123'), role: 'delivery_agent' as const, hubId: 'H002', isActive: true },
      { name: 'Customer One', email: 'customer1@example.com', password: await hash('password123'), role: 'customer' as const, isActive: true },
      { name: 'Customer Two', email: 'customer2@example.com', password: await hash('password123'), role: 'customer' as const, isActive: true },
    ];

    const createdUsers = users.map((u) => this.usersRepository.create(u as any));

    createdUsers.forEach((u) => {
      if (u.role === 'delivery_agent') {
        this.agentsRepository.create({
          userId: u.id,
          name: u.name,
          phone: u.phone,
          hubId: u.hubId ?? '',
          availabilityStatus: 'Available',
          vehicleType: 'bike',
          currentTasksCount: 0,
        });
      }
    });

    console.log('✅ Seeded 13 users + 2 agent profiles');
  }

  // ── 6 hubs matching frontend H001–H006 format ─────────────────────────────
  private seedHubs() {
    if (this.db.count('hubs') > 0) return;
    const hubs = [
      { hubId: 'H001', name: 'Chennai Central Hub', address: 'No. 45, Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', phone: '044-23456789', email: 'chennai@swifttrack.com', managerId: null, status: 'active' as const, capacity: 500, currentLoad: 234 },
      { hubId: 'H002', name: 'Mumbai Gateway Hub', address: 'Plot 12, Dharavi Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400017', phone: '022-67891234', email: 'mumbai@swifttrack.com', managerId: null, status: 'active' as const, capacity: 750, currentLoad: 412 },
      { hubId: 'H003', name: 'Delhi NCR Hub', address: 'Block C, Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', phone: '011-45678901', email: 'delhi@swifttrack.com', managerId: null, status: 'active' as const, capacity: 600, currentLoad: 289 },
      { hubId: 'H004', name: 'Bengaluru Tech Hub', address: 'EPIP Zone, Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', phone: '080-23456781', email: 'bengaluru@swifttrack.com', managerId: null, status: 'active' as const, capacity: 450, currentLoad: 178 },
      { hubId: 'H005', name: 'Kolkata East Hub', address: 'Sector V, Salt Lake', city: 'Kolkata', state: 'West Bengal', pincode: '700091', phone: '033-45678902', email: 'kolkata@swifttrack.com', managerId: null, status: 'maintenance' as const, capacity: 300, currentLoad: 45 },
      { hubId: 'H006', name: 'Hyderabad Central Hub', address: 'Raheja Mindspace, HITEC City', city: 'Hyderabad', state: 'Telangana', pincode: '500081', phone: '040-23456780', email: 'hyderabad@swifttrack.com', managerId: null, status: 'active' as const, capacity: 400, currentLoad: 201 },
    ];
    for (const h of hubs) this.hubsRepository.create(h);
    console.log('✅ Seeded 6 hubs');
  }

  // ── 10 demo orders with backend-computed pricing ──────────────────────────
  private seedOrders() {
    if (this.db.count('orders') > 0) return;
    const merchant1 = this.usersRepository.findByEmail('merchant1@example.com');
    const merchant2 = this.usersRepository.findByEmail('merchant2@example.com');
    const customer1 = this.usersRepository.findByEmail('customer1@example.com');
    const customer2 = this.usersRepository.findByEmail('customer2@example.com');
    const agent1 = this.usersRepository.findByEmail('agent1@swifttrack.com');
    const agent2 = this.usersRepository.findByEmail('agent2@swifttrack.com');

    if (!merchant1 || !merchant2 || !customer1 || !customer2) {
      console.warn('⚠️ Users not found, skipping order seed');
      return;
    }

    const mk = (
      orderId: string,
      trackingId: string,
      merchantId: string,
      customerId: string,
      customerName: string,
      deliveryAddress: string,
      pickupHubId: string,
      deliveryHubId: string,
      status: string,
      assignedAgentId: string | undefined,
      packageType: string,
      serviceLevel: 'standard' | 'express' | 'same-day',
      weight: number,
      paymentMode: 'Prepaid' | 'COD',
      priority: 'Low' | 'Medium' | 'High',
      daysOffset: number,
    ) => {
      // Price is computed by the SAME authoritative PricingService used by the API
      const breakdown = this.pricingService.calculateQuote({ serviceLevel, weightKg: weight, paymentMode });
      const history: IStatusEvent[] = [{ status: 'Pending', timestamp: new Date(Date.now() - (daysOffset + 1) * 86400000).toISOString(), note: 'Order created' }];
      if (status !== 'Pending') {
        history.push({ status, timestamp: new Date(Date.now() - daysOffset * 86400000).toISOString(), note: `Seeded at ${status}` });
      }
      return {
        orderId,
        trackingId,
        merchantId,
        customerId,
        customerName,
        customerPhone: '+91 90000 00001',
        deliveryAddress,
        pickupHubId,
        deliveryHubId,
        status,
        assignedAgentId,
        packageType,
        serviceLevel,
        weight,
        amount: breakdown.total,
        pricingBreakdown: breakdown,
        paymentMode,
        paymentStatus: paymentMode === 'Prepaid' ? 'paid' : 'pending',
        priority,
        estimatedDelivery: new Date(Date.now() + 2 * 86400000),
        statusHistory: history,
      };
    };

    const orders = [
      mk('ORD-2024-0001', 'TRK-XK29BL7M', merchant1.id, customer1.id, 'Aarav Sharma', '42, Besant Nagar, Chennai - 600090', 'H001', 'H003', 'Delivered', agent1?.id, 'Electronics', 'express', 2.5, 'Prepaid', 'High', 2),
      mk('ORD-2024-0002', 'TRK-AB34CD56', merchant1.id, customer2.id, 'Preethi Venkataraman', '15, Andheri West, Mumbai - 400058', 'H002', 'H001', 'InTransit', agent2?.id, 'Clothing', 'standard', 1.2, 'COD', 'Medium', 1),
      mk('ORD-2024-0003', 'TRK-EF78GH90', merchant1.id, customer1.id, 'Manish Gupta', '8, Lajpat Nagar III, New Delhi - 110024', 'H003', 'H002', 'Pending', undefined, 'Documents', 'standard', 0.3, 'Prepaid', 'Low', 0),
      mk('ORD-2024-0004', 'TRK-IJ12KL34', merchant1.id, customer2.id, 'Divya Menon', '22, Koramangala 5th Block, Bengaluru - 560095', 'H004', 'H001', 'Assigned', agent1?.id, 'Electronics', 'express', 6.8, 'Prepaid', 'High', 1),
      mk('ORD-2024-0005', 'TRK-MN56OP78', merchant1.id, customer1.id, 'Rajesh Iyer', '7, T Nagar, Chennai - 600017', 'H001', 'H001', 'Pending', undefined, 'Medical Supplies', 'same-day', 0.8, 'Prepaid', 'High', 0),
      mk('ORD-2024-0006', 'TRK-QR90ST12', merchant2.id, customer2.id, 'Sunita Agarwal', '33, Park Street, Kolkata - 700016', 'H005', 'H002', 'Delivered', agent1?.id, 'Handicrafts', 'standard', 3.1, 'COD', 'Medium', 3),
      mk('ORD-2024-0007', 'TRK-UV34WX56', merchant2.id, customer1.id, 'Karthik Subramanian', 'Plot 9, Banjara Hills Road 12, Hyderabad - 500034', 'H006', 'H003', 'Cancelled', undefined, 'Automotive Parts', 'standard', 5.3, 'COD', 'Low', 2),
      mk('ORD-2024-0008', 'TRK-YZ78AB90', merchant2.id, customer2.id, 'Neha Joshi', '17, Powai Lake Drive, Mumbai - 400076', 'H002', 'H004', 'InTransit', agent2?.id, 'Furniture Component', 'standard', 12.5, 'Prepaid', 'Medium', 1),
      mk('ORD-2024-0009', 'TRK-CD12EF34', merchant2.id, customer1.id, 'Aryan Verma', '45, Sector 18, Noida - 201301', 'H003', 'H005', 'Assigned', agent2?.id, 'Sports Equipment', 'standard', 3.5, 'Prepaid', 'Medium', 1),
      mk('ORD-2024-0010', 'TRK-GH56IJ78', merchant2.id, customer2.id, 'Lakshmi Priya', '12, JP Nagar Phase 2, Bengaluru - 560078', 'H004', 'H006', 'OutForDelivery', agent1?.id, 'Clothing', 'express', 2.1, 'COD', 'High', 0),
    ];

    this.db.transaction((conn) => {
      for (const o of orders) {
        const created = this.ordersRepository.create(o as any, conn);
        // Ledger charge record for each seeded order (consistent financial model)
        conn.prepare(
          `INSERT INTO payments (id, orderId, type, amount, method, status, createdAt, updatedAt)
           VALUES (lower(hex(randomblob(16))), ?, 'charge', ?, ?, ?, ?, ?)`,
        ).run(
          created.id,
          created.amount,
          created.paymentMode,
          created.paymentMode === 'Prepaid' ? 'paid' : 'pending',
          new Date().toISOString(),
          new Date().toISOString(),
        );
      }
    });
    console.log('✅ Seeded 10 orders (backend-priced) + payment charges');
  }

  private async migrateHubManagerDevelopmentData() {
    const version = 'dev-hub-manager-fixture-v2';
    if (
      this.db.queryOne(
        'SELECT version FROM data_migrations WHERE version = ?',
        [version],
      )
    )
      return;

    const password = await bcrypt.hash('password123', 10);
    const agents = [
      {
        name: 'Agent One',
        email: 'agent1@swifttrack.com',
        hubId: 'H001',
        availabilityStatus: 'Available',
      },
      {
        name: 'Agent Two',
        email: 'agent2@swifttrack.com',
        hubId: 'H002',
        availabilityStatus: 'Available',
      },
      {
        name: 'Agent Three',
        email: 'agent3@swifttrack.com',
        hubId: 'H001',
        availabilityStatus: 'Busy',
      },
      {
        name: 'Agent Four',
        email: 'agent4@swifttrack.com',
        hubId: 'H002',
        availabilityStatus: 'Offline',
      },
    ] as const;
    const orderTargets = [
      {
        orderId: 'ORD-2024-0001',
        status: 'Delivered',
        pickupHubId: 'H001',
        deliveryHubId: 'H002',
        agentEmail: agents[0].email,
      },
      {
        orderId: 'ORD-2024-0002',
        status: 'InTransit',
        pickupHubId: 'H002',
        deliveryHubId: 'H001',
        agentEmail: agents[1].email,
      },
      {
        orderId: 'ORD-2024-0003',
        status: 'Pending',
        pickupHubId: 'H001',
        deliveryHubId: 'H002',
      },
      {
        orderId: 'ORD-2024-0004',
        status: 'Assigned',
        pickupHubId: 'H001',
        deliveryHubId: 'H002',
        agentEmail: agents[0].email,
      },
      {
        orderId: 'ORD-2024-0005',
        status: 'Pending',
        pickupHubId: 'H001',
        deliveryHubId: 'H001',
      },
      {
        orderId: 'ORD-2024-0006',
        status: 'Returned',
        pickupHubId: 'H002',
        deliveryHubId: 'H001',
        agentEmail: agents[1].email,
      },
      {
        orderId: 'ORD-2024-0008',
        status: 'PickedUp',
        pickupHubId: 'H002',
        deliveryHubId: 'H001',
        agentEmail: agents[1].email,
      },
      {
        orderId: 'ORD-2024-0010',
        status: 'OutForDelivery',
        pickupHubId: 'H001',
        deliveryHubId: 'H002',
        agentEmail: agents[0].email,
      },
    ] as const;

    this.db.transaction((conn) => {
      if (
        conn
          .prepare('SELECT version FROM data_migrations WHERE version = ?')
          .get(version)
      )
        return;

      const hubs = conn
        .prepare('SELECT hubId, status FROM hubs WHERE hubId IN (?, ?)')
        .all('H001', 'H002') as Array<{ hubId: string; status: string }>;
      if (hubs.length !== 2 || hubs.some((hub) => hub.status !== 'active')) {
        throw new Error('Active hubs H001 and H002 are required');
      }

      const orderIds = orderTargets.map((order) => order.orderId);
      const orderRows = conn
        .prepare(
          `SELECT id, orderId, status, pickupHubId, deliveryHubId, assignedAgentId, statusHistory
         FROM orders WHERE orderId IN (${orderIds.map(() => '?').join(', ')})`,
        )
        .all(...orderIds) as Array<{
        id: string;
        orderId: string;
        status: string;
        pickupHubId: string | null;
        deliveryHubId: string | null;
        assignedAgentId: string | null;
        statusHistory: string;
      }>;
      if (orderRows.length !== orderTargets.length) {
        const present = new Set(orderRows.map((order) => order.orderId));
        const missing = orderIds.filter((orderId) => !present.has(orderId));
        throw new Error(`Required orders are missing: ${missing.join(', ')}`);
      }

      const userIds = new Map<string, string>();
      for (const agent of agents) {
        let user = conn
          .prepare(
            'SELECT id, name, email, role, hubId, phone, isActive FROM users WHERE email = ?',
          )
          .get(agent.email) as
          | {
              id: string;
              name: string;
              email: string;
              role: string;
              hubId: string | null;
              phone: string | null;
              isActive: number;
            }
          | undefined;

        if (user && user.role !== 'delivery_agent') {
          throw new Error(
            `${agent.email} exists but is not a delivery-agent account`,
          );
        }
        if (
          !user &&
          (agent.email === agents[0].email || agent.email === agents[1].email)
        ) {
          throw new Error(
            `Required existing agent account is missing: ${agent.email}`,
          );
        }

        if (!user) {
          const created = this.usersRepository.create({
            name: agent.name,
            email: agent.email,
            password,
            role: Role.DELIVERY_AGENT,
            hubId: agent.hubId,
            isActive: true,
          });
          user = {
            id: created.id,
            name: created.name,
            email: created.email,
            role: created.role,
            hubId: created.hubId ?? null,
            phone: created.phone ?? null,
            isActive: 1,
          };
        } else if (
          user.name !== agent.name ||
          user.hubId !== agent.hubId ||
          user.isActive !== 1
        ) {
          this.usersRepository.update(user.id, {
            name: agent.name,
            hubId: agent.hubId,
            isActive: true,
          });
        }

        const profile = conn
          .prepare('SELECT id FROM agents WHERE userId = ?')
          .get(user.id) as { id: string } | undefined;
        if (profile) {
          this.agentsRepository.update(profile.id, {
            name: agent.name,
            hubId: agent.hubId,
            availabilityStatus: agent.availabilityStatus,
          });
        } else {
          this.agentsRepository.create({
            userId: user.id,
            name: agent.name,
            phone: user.phone ?? undefined,
            hubId: agent.hubId,
            availabilityStatus: agent.availabilityStatus,
            vehicleType: 'bike',
            currentTasksCount: 0,
          });
        }
        userIds.set(agent.email, user.id);
      }

      const profiles = conn
        .prepare(
          'SELECT userId, hubId FROM agents WHERE userId IN (?, ?, ?, ?)',
        )
        .all(...agents.map((agent) => userIds.get(agent.email)!)) as Array<{
        userId: string;
        hubId: string;
      }>;
      const profileHubs = new Map(
        profiles.map((profile) => [profile.userId, profile.hubId]),
      );

      const rowsByOrderId = new Map(
        orderRows.map((order) => [order.orderId, order]),
      );
      for (const target of orderTargets) {
        const current = rowsByOrderId.get(target.orderId)!;
        const assignedAgentId =
          'agentEmail' in target ? userIds.get(target.agentEmail)! : null;
        if (
          assignedAgentId &&
          profileHubs.get(assignedAgentId) !== target.pickupHubId
        ) {
          throw new Error(
            `Assigned agent for ${target.orderId} does not belong to ${target.pickupHubId}`,
          );
        }

        const changed =
          current.status !== target.status ||
          current.pickupHubId !== target.pickupHubId ||
          current.deliveryHubId !== target.deliveryHubId ||
          current.assignedAgentId !== assignedAgentId;
        if (!changed) continue;

        let statusHistory = current.statusHistory;
        if (current.status !== target.status) {
          const history = JSON.parse(
            current.statusHistory || '[]',
          ) as IStatusEvent[];
          if (!Array.isArray(history))
            throw new Error(`Invalid status history for ${target.orderId}`);
          history.push({
            status: target.status,
            timestamp: new Date().toISOString(),
            note: `Normalized by ${version}`,
          });
          statusHistory = JSON.stringify(history);
        }
        conn
          .prepare(
            `UPDATE orders
           SET status = ?, pickupHubId = ?, deliveryHubId = ?, assignedAgentId = ?, statusHistory = ?, updatedAt = ?
           WHERE id = ?`,
          )
          .run(
            target.status,
            target.pickupHubId,
            target.deliveryHubId,
            assignedAgentId,
            statusHistory,
            new Date().toISOString(),
            current.id,
          );
      }

      const now = new Date().toISOString();
      conn
        .prepare(
          `UPDATE agents
         SET currentTasksCount = (
           SELECT COUNT(*) FROM orders
           WHERE assignedAgentId = agents.userId
             AND status NOT IN ('Delivered', 'Cancelled', 'Returned', 'Failed')
         ), updatedAt = ?
         WHERE userId IN (?, ?, ?, ?)`,
        )
        .run(now, ...agents.map((agent) => userIds.get(agent.email)!));

      conn
        .prepare(
          'INSERT INTO data_migrations (version, appliedAt) VALUES (?, ?)',
        )
        .run(version, now);
    });
  }

  private async seedExpandedMultiHubDevelopmentData() {
    const version = 'dev-multi-hub-expanded-v1';
    if (
      this.db.queryOne(
        'SELECT version FROM data_migrations WHERE version = ?',
        [version],
      )
    )
      return;

    const password = await bcrypt.hash('password123', 10);

    // 1. Ensure additional customers & merchants exist
    const additionalUsers = [
      { name: 'Rohan Mehra', email: 'customer3@example.com', phone: '+91 90000 00003', role: Role.CUSTOMER },
      { name: 'Ananya Deshmukh', email: 'customer4@example.com', phone: '+91 90000 00004', role: Role.CUSTOMER },
      { name: 'Vikram Singhania', email: 'customer5@example.com', phone: '+91 90000 00005', role: Role.CUSTOMER },
      { name: 'Merchant Three', email: 'merchant3@example.com', company: 'Apex Retail', role: Role.MERCHANT },
    ];

    for (const u of additionalUsers) {
      if (!this.usersRepository.findByEmail(u.email)) {
        this.usersRepository.create({
          name: u.name,
          email: u.email,
          phone: (u as any).phone,
          company: (u as any).company,
          password,
          role: u.role,
          isActive: true,
        });
      }
    }

    // 2. Ensure delivery agents for H003 (Delhi), H004 (Bengaluru), H006 (Hyderabad) exist
    const additionalAgents: Array<{
      name: string;
      email: string;
      hubId: string;
      availabilityStatus: 'Available' | 'Busy' | 'Offline';
      vehicleType: string;
      phone: string;
    }> = [
      { name: 'Agent Five', email: 'agent5@swifttrack.com', hubId: 'H003', availabilityStatus: 'Available', vehicleType: 'bike', phone: '+91 91000 00005' },
      { name: 'Agent Six', email: 'agent6@swifttrack.com', hubId: 'H003', availabilityStatus: 'Available', vehicleType: 'van', phone: '+91 91000 00006' },
      { name: 'Agent Seven', email: 'agent7@swifttrack.com', hubId: 'H004', availabilityStatus: 'Available', vehicleType: 'bike', phone: '+91 91000 00007' },
      { name: 'Agent Eight', email: 'agent8@swifttrack.com', hubId: 'H004', availabilityStatus: 'Busy', vehicleType: 'bike', phone: '+91 91000 00008' },
      { name: 'Agent Nine', email: 'agent9@swifttrack.com', hubId: 'H006', availabilityStatus: 'Available', vehicleType: 'bike', phone: '+91 91000 00009' },
      { name: 'Agent Ten', email: 'agent10@swifttrack.com', hubId: 'H006', availabilityStatus: 'Available', vehicleType: 'van', phone: '+91 91000 00010' },
    ];

    for (const a of additionalAgents) {
      let user = this.usersRepository.findByEmail(a.email);
      if (!user) {
        user = this.usersRepository.create({
          name: a.name,
          email: a.email,
          phone: a.phone,
          password,
          role: Role.DELIVERY_AGENT,
          hubId: a.hubId,
          isActive: true,
        });
      }
      const profile = this.agentsRepository.findByUserId(user.id);
      if (!profile) {
        this.agentsRepository.create({
          userId: user.id,
          name: a.name,
          phone: a.phone,
          hubId: a.hubId,
          availabilityStatus: a.availabilityStatus,
          vehicleType: a.vehicleType,
          currentTasksCount: 0,
        });
      }
    }

    // Resolve user accounts
    const m1 = this.usersRepository.findByEmail('merchant1@example.com')!;
    const m2 = this.usersRepository.findByEmail('merchant2@example.com')!;
    const m3 = this.usersRepository.findByEmail('merchant3@example.com') || m1;
    const c1 = this.usersRepository.findByEmail('customer1@example.com')!;
    const c2 = this.usersRepository.findByEmail('customer2@example.com')!;
    const c3 = this.usersRepository.findByEmail('customer3@example.com') || c1;
    const c4 = this.usersRepository.findByEmail('customer4@example.com') || c2;
    const c5 = this.usersRepository.findByEmail('customer5@example.com') || c1;

    const a1 = this.usersRepository.findByEmail('agent1@swifttrack.com');
    const a2 = this.usersRepository.findByEmail('agent2@swifttrack.com');
    const a3 = this.usersRepository.findByEmail('agent3@swifttrack.com');
    const a5 = this.usersRepository.findByEmail('agent5@swifttrack.com');
    const a6 = this.usersRepository.findByEmail('agent6@swifttrack.com');
    const a7 = this.usersRepository.findByEmail('agent7@swifttrack.com');
    const a8 = this.usersRepository.findByEmail('agent8@swifttrack.com');
    const a9 = this.usersRepository.findByEmail('agent9@swifttrack.com');
    const a10 = this.usersRepository.findByEmail('agent10@swifttrack.com');

    // 50 new development orders (ORD-2024-0011 through ORD-2024-0060)
    const definitions: Array<{
      orderId: string;
      trackingId: string;
      merchant: typeof m1;
      customer: typeof c1;
      deliveryAddress: string;
      pickupHubId: string;
      deliveryHubId: string;
      status: string;
      assignedAgentId?: string;
      packageType: string;
      serviceLevel: 'standard' | 'express' | 'same-day';
      weight: number;
      paymentMode: 'Prepaid' | 'COD';
      priority: 'Low' | 'Medium' | 'High';
      daysOffset: number;
    }> = [
      // H001 Chennai: 3 Pending unassigned + 3 active/terminal
      { orderId: 'ORD-2024-0011', trackingId: 'TRK-AA11BB22', merchant: m1, customer: c1, deliveryAddress: '55 Barakhamba Road, Connaught Place, New Delhi - 110001', pickupHubId: 'H001', deliveryHubId: 'H003', status: 'Pending', packageType: 'Electronics', serviceLevel: 'standard', weight: 1.5, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 0 },
      { orderId: 'ORD-2024-0012', trackingId: 'TRK-CC33DD44', merchant: m2, customer: c2, deliveryAddress: '10 100 Feet Road, Indiranagar, Bengaluru - 560038', pickupHubId: 'H001', deliveryHubId: 'H004', status: 'Pending', packageType: 'Clothing', serviceLevel: 'express', weight: 3.2, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 0 },
      { orderId: 'ORD-2024-0013', trackingId: 'TRK-EE55FF66', merchant: m3, customer: c3, deliveryAddress: '16 Jubilee Hills Check Post, Hyderabad - 500033', pickupHubId: 'H001', deliveryHubId: 'H006', status: 'Pending', packageType: 'Medical Supplies', serviceLevel: 'same-day', weight: 0.7, paymentMode: 'COD', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0018', trackingId: 'TRK-OO55PP66', merchant: m2, customer: c3, deliveryAddress: '73 Outer Ring Road, Bellandur, Bengaluru - 560103', pickupHubId: 'H001', deliveryHubId: 'H004', status: 'Assigned', assignedAgentId: a3?.id, packageType: 'Electronics', serviceLevel: 'express', weight: 3.5, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0019', trackingId: 'TRK-QQ77RR88', merchant: m1, customer: c4, deliveryAddress: '14 Ring Road, South Extension Part II, New Delhi - 110049', pickupHubId: 'H001', deliveryHubId: 'H003', status: 'InTransit', assignedAgentId: a3?.id, packageType: 'Industrial Tools', serviceLevel: 'standard', weight: 6.2, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 1 },
      { orderId: 'ORD-2024-0020', trackingId: 'TRK-SS99TT00', merchant: m2, customer: c5, deliveryAddress: '42 Gachibowli Stadium Road, Hyderabad - 500032', pickupHubId: 'H001', deliveryHubId: 'H006', status: 'Delivered', assignedAgentId: a3?.id, packageType: 'Clothing', serviceLevel: 'standard', weight: 2.0, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 2 },

      // H002 Mumbai: 4 Pending unassigned + 4 active/terminal
      { orderId: 'ORD-2024-0014', trackingId: 'TRK-GG77HH88', merchant: m2, customer: c4, deliveryAddress: '12 Velachery Main Road, Chennai - 600042', pickupHubId: 'H002', deliveryHubId: 'H001', status: 'Pending', packageType: 'Handicrafts', serviceLevel: 'express', weight: 2.4, paymentMode: 'Prepaid', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0015', trackingId: 'TRK-II99JJ00', merchant: m1, customer: c5, deliveryAddress: '88 Netaji Subhash Place, Pitampura, New Delhi - 110034', pickupHubId: 'H002', deliveryHubId: 'H003', status: 'Pending', packageType: 'Documents', serviceLevel: 'standard', weight: 0.5, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 0 },
      { orderId: 'ORD-2024-0016', trackingId: 'TRK-KK11LL22', merchant: m2, customer: c1, deliveryAddress: '45 Brigade Road, Ashok Nagar, Bengaluru - 560025', pickupHubId: 'H002', deliveryHubId: 'H004', status: 'Pending', packageType: 'Auto Parts', serviceLevel: 'same-day', weight: 4.0, paymentMode: 'COD', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0017', trackingId: 'TRK-MM33NN44', merchant: m3, customer: c2, deliveryAddress: '80 Banjara Hills Road No 10, Hyderabad - 500034', pickupHubId: 'H002', deliveryHubId: 'H006', status: 'Pending', packageType: 'Books', serviceLevel: 'standard', weight: 1.8, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 0 },
      { orderId: 'ORD-2024-0042', trackingId: 'TRK-VW34XY56', merchant: m2, customer: c2, deliveryAddress: '21 Mall Road, Civil Lines, Delhi - 110054', pickupHubId: 'H002', deliveryHubId: 'H003', status: 'Assigned', assignedAgentId: a2?.id, packageType: 'Smart Watches', serviceLevel: 'express', weight: 1.1, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 1 },
      { orderId: 'ORD-2024-0043', trackingId: 'TRK-ZA78BC90', merchant: m1, customer: c3, deliveryAddress: '92 Electronic City Phase 1, Bengaluru - 560100', pickupHubId: 'H002', deliveryHubId: 'H004', status: 'OutForDelivery', assignedAgentId: a2?.id, packageType: 'Audio Gear', serviceLevel: 'express', weight: 2.6, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0044', trackingId: 'TRK-DE12FG34', merchant: m2, customer: c4, deliveryAddress: '34 Anna Nagar 2nd Avenue, Chennai - 600040', pickupHubId: 'H002', deliveryHubId: 'H001', status: 'Delivered', assignedAgentId: a2?.id, packageType: 'Kitchen Appliances', serviceLevel: 'standard', weight: 5.8, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 3 },
      { orderId: 'ORD-2024-0045', trackingId: 'TRK-HI56JK78', merchant: m1, customer: c5, deliveryAddress: '25 Madhapur Main Road, HITEC City, Hyderabad - 500081', pickupHubId: 'H002', deliveryHubId: 'H006', status: 'Returned', assignedAgentId: a2?.id, packageType: 'Footwear', serviceLevel: 'standard', weight: 1.6, paymentMode: 'COD', priority: 'Medium', daysOffset: 2 },

      // H003 Delhi: 4 Pending unassigned + 6 active/terminal
      { orderId: 'ORD-2024-0021', trackingId: 'TRK-UU11VV22', merchant: m1, customer: c1, deliveryAddress: '78 OMR IT Highway, Sholinganallur, Chennai - 600119', pickupHubId: 'H003', deliveryHubId: 'H001', status: 'Pending', packageType: 'Documents', serviceLevel: 'express', weight: 0.6, paymentMode: 'Prepaid', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0022', trackingId: 'TRK-WW33XX44', merchant: m2, customer: c2, deliveryAddress: '28 Linking Road, Bandra West, Mumbai - 400050', pickupHubId: 'H003', deliveryHubId: 'H002', status: 'Pending', packageType: 'Consumer Goods', serviceLevel: 'standard', weight: 3.8, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 0 },
      { orderId: 'ORD-2024-0023', trackingId: 'TRK-YY55ZZ66', merchant: m3, customer: c3, deliveryAddress: '10 100 Feet Road, Indiranagar, Bengaluru - 560038', pickupHubId: 'H003', deliveryHubId: 'H004', status: 'Pending', packageType: 'Medical Supplies', serviceLevel: 'express', weight: 1.2, paymentMode: 'COD', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0024', trackingId: 'TRK-AB12CD34', merchant: m2, customer: c4, deliveryAddress: '16 Jubilee Hills Check Post, Hyderabad - 500033', pickupHubId: 'H003', deliveryHubId: 'H006', status: 'Pending', packageType: 'Sports Gear', serviceLevel: 'standard', weight: 2.7, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 0 },
      { orderId: 'ORD-2024-0025', trackingId: 'TRK-EF56GH78', merchant: m1, customer: c5, deliveryAddress: '19 Gandhi Irwin Road, Egmore, Chennai - 600008', pickupHubId: 'H003', deliveryHubId: 'H001', status: 'Assigned', assignedAgentId: a5?.id, packageType: 'Electronics', serviceLevel: 'same-day', weight: 2.3, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0026', trackingId: 'TRK-IJ90KL12', merchant: m2, customer: c1, deliveryAddress: '9 Nariman Point, Marine Drive, Mumbai - 400021', pickupHubId: 'H003', deliveryHubId: 'H002', status: 'InTransit', assignedAgentId: a5?.id, packageType: 'Hardware', serviceLevel: 'standard', weight: 5.5, paymentMode: 'COD', priority: 'Medium', daysOffset: 1 },
      { orderId: 'ORD-2024-0027', trackingId: 'TRK-MN34OP56', merchant: m1, customer: c2, deliveryAddress: '73 Outer Ring Road, Bellandur, Bengaluru - 560103', pickupHubId: 'H003', deliveryHubId: 'H004', status: 'PickedUp', assignedAgentId: a6?.id, packageType: 'Fashion', serviceLevel: 'express', weight: 1.9, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0046', trackingId: 'TRK-LM90NO12', merchant: m2, customer: c1, deliveryAddress: '42 Gachibowli Stadium Road, Hyderabad - 500032', pickupHubId: 'H003', deliveryHubId: 'H006', status: 'OutForDelivery', assignedAgentId: a5?.id, packageType: 'Network Switches', serviceLevel: 'express', weight: 4.1, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0047', trackingId: 'TRK-PQ34RS56', merchant: m1, customer: c2, deliveryAddress: '12 Velachery Main Road, Chennai - 600042', pickupHubId: 'H003', deliveryHubId: 'H001', status: 'Delivered', assignedAgentId: a6?.id, packageType: 'Ceramic Tiles', serviceLevel: 'standard', weight: 9.5, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 2 },
      { orderId: 'ORD-2024-0048', trackingId: 'TRK-TU78VW90', merchant: m2, customer: c3, deliveryAddress: '64 SV Road, Malad West, Mumbai - 400064', pickupHubId: 'H003', deliveryHubId: 'H002', status: 'Failed', assignedAgentId: a6?.id, packageType: 'Fragile Glassware', serviceLevel: 'standard', weight: 2.2, paymentMode: 'COD', priority: 'Medium', daysOffset: 2 },

      // H004 Bengaluru: 4 Pending unassigned + 6 active/terminal
      { orderId: 'ORD-2024-0028', trackingId: 'TRK-QR78ST90', merchant: m2, customer: c3, deliveryAddress: '34 Anna Nagar 2nd Avenue, Chennai - 600040', pickupHubId: 'H004', deliveryHubId: 'H001', status: 'Pending', packageType: 'Electronics', serviceLevel: 'same-day', weight: 1.4, paymentMode: 'Prepaid', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0029', trackingId: 'TRK-UV12WX34', merchant: m1, customer: c4, deliveryAddress: '102 Hiranandani Gardens, Powai, Mumbai - 400076', pickupHubId: 'H004', deliveryHubId: 'H002', status: 'Pending', packageType: 'Office Supplies', serviceLevel: 'express', weight: 2.8, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 0 },
      { orderId: 'ORD-2024-0030', trackingId: 'TRK-YZ56AB78', merchant: m2, customer: c5, deliveryAddress: '55 Barakhamba Road, Connaught Place, New Delhi - 110001', pickupHubId: 'H004', deliveryHubId: 'H003', status: 'Pending', packageType: 'Lab Equipment', serviceLevel: 'standard', weight: 4.6, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 0 },
      { orderId: 'ORD-2024-0031', trackingId: 'TRK-CD90EF12', merchant: m3, customer: c1, deliveryAddress: '80 Banjara Hills Road No 10, Hyderabad - 500034', pickupHubId: 'H004', deliveryHubId: 'H006', status: 'Pending', packageType: 'Perishables', serviceLevel: 'express', weight: 3.0, paymentMode: 'COD', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0032', trackingId: 'TRK-GH34IJ56', merchant: m2, customer: c2, deliveryAddress: '78 OMR IT Highway, Sholinganallur, Chennai - 600119', pickupHubId: 'H004', deliveryHubId: 'H001', status: 'Assigned', assignedAgentId: a7?.id, packageType: 'Components', serviceLevel: 'standard', weight: 3.2, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 1 },
      { orderId: 'ORD-2024-0033', trackingId: 'TRK-KL78MN90', merchant: m1, customer: c3, deliveryAddress: '28 Linking Road, Bandra West, Mumbai - 400050', pickupHubId: 'H004', deliveryHubId: 'H002', status: 'OutForDelivery', assignedAgentId: a7?.id, packageType: 'Cosmetics', serviceLevel: 'express', weight: 1.5, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0034', trackingId: 'TRK-OP12QR34', merchant: m2, customer: c4, deliveryAddress: '14 Ring Road, South Extension Part II, New Delhi - 110049', pickupHubId: 'H004', deliveryHubId: 'H003', status: 'InTransit', assignedAgentId: a8?.id, packageType: 'Machine Parts', serviceLevel: 'standard', weight: 8.4, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 2 },
      { orderId: 'ORD-2024-0049', trackingId: 'TRK-XY12ZA34', merchant: m1, customer: c4, deliveryAddress: '25 Madhapur Main Road, HITEC City, Hyderabad - 500081', pickupHubId: 'H004', deliveryHubId: 'H006', status: 'PickedUp', assignedAgentId: a7?.id, packageType: 'Sensor Modules', serviceLevel: 'same-day', weight: 0.8, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0050', trackingId: 'TRK-BC56DE78', merchant: m2, customer: c5, deliveryAddress: '19 Gandhi Irwin Road, Egmore, Chennai - 600008', pickupHubId: 'H004', deliveryHubId: 'H001', status: 'Delivered', assignedAgentId: a8?.id, packageType: 'Educational Kits', serviceLevel: 'standard', weight: 3.6, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 3 },
      { orderId: 'ORD-2024-0051', trackingId: 'TRK-FG90HI12', merchant: m1, customer: c1, deliveryAddress: '9 Nariman Point, Marine Drive, Mumbai - 400021', pickupHubId: 'H004', deliveryHubId: 'H002', status: 'Cancelled', packageType: 'Fitness Trackers', serviceLevel: 'standard', weight: 1.3, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 2 },

      // H006 Hyderabad: 4 Pending unassigned + 6 active/terminal
      { orderId: 'ORD-2024-0035', trackingId: 'TRK-ST56UV78', merchant: m1, customer: c5, deliveryAddress: '12 Velachery Main Road, Chennai - 600042', pickupHubId: 'H006', deliveryHubId: 'H001', status: 'Pending', packageType: 'Pharmaceuticals', serviceLevel: 'express', weight: 1.8, paymentMode: 'Prepaid', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0036', trackingId: 'TRK-WX90YZ12', merchant: m2, customer: c1, deliveryAddress: '64 SV Road, Malad West, Mumbai - 400064', pickupHubId: 'H006', deliveryHubId: 'H002', status: 'Pending', packageType: 'Textiles', serviceLevel: 'same-day', weight: 2.1, paymentMode: 'Prepaid', priority: 'High', daysOffset: 0 },
      { orderId: 'ORD-2024-0037', trackingId: 'TRK-BC34DE56', merchant: m3, customer: c2, deliveryAddress: '88 Netaji Subhash Place, Pitampura, New Delhi - 110034', pickupHubId: 'H006', deliveryHubId: 'H003', status: 'Pending', packageType: 'Heavy Hardware', serviceLevel: 'standard', weight: 6.7, paymentMode: 'COD', priority: 'Medium', daysOffset: 0 },
      { orderId: 'ORD-2024-0038', trackingId: 'TRK-FG78HI90', merchant: m2, customer: c3, deliveryAddress: '45 Brigade Road, Ashok Nagar, Bengaluru - 560025', pickupHubId: 'H006', deliveryHubId: 'H004', status: 'Pending', packageType: 'Retail Apparel', serviceLevel: 'express', weight: 2.5, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 0 },
      { orderId: 'ORD-2024-0039', trackingId: 'TRK-JK12LM34', merchant: m1, customer: c4, deliveryAddress: '34 Anna Nagar 2nd Avenue, Chennai - 600040', pickupHubId: 'H006', deliveryHubId: 'H001', status: 'Assigned', assignedAgentId: a9?.id, packageType: 'Solar Parts', serviceLevel: 'standard', weight: 5.1, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 1 },
      { orderId: 'ORD-2024-0040', trackingId: 'TRK-NO56PQ78', merchant: m2, customer: c5, deliveryAddress: '102 Hiranandani Gardens, Powai, Mumbai - 400076', pickupHubId: 'H006', deliveryHubId: 'H002', status: 'InTransit', assignedAgentId: a9?.id, packageType: 'Telecom Gear', serviceLevel: 'express', weight: 3.4, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0041', trackingId: 'TRK-RS90TU12', merchant: m1, customer: c1, deliveryAddress: '21 Mall Road, Civil Lines, Delhi - 110054', pickupHubId: 'H006', deliveryHubId: 'H003', status: 'PickedUp', assignedAgentId: a10?.id, packageType: 'Luxury Goods', serviceLevel: 'same-day', weight: 1.0, paymentMode: 'COD', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0052', trackingId: 'TRK-JK34LM56', merchant: m2, customer: c2, deliveryAddress: '92 Electronic City Phase 1, Bengaluru - 560100', pickupHubId: 'H006', deliveryHubId: 'H004', status: 'OutForDelivery', assignedAgentId: a9?.id, packageType: 'Drone Accessories', serviceLevel: 'express', weight: 2.9, paymentMode: 'Prepaid', priority: 'High', daysOffset: 1 },
      { orderId: 'ORD-2024-0053', trackingId: 'TRK-NO78PQ90', merchant: m1, customer: c3, deliveryAddress: '78 OMR IT Highway, Sholinganallur, Chennai - 600119', pickupHubId: 'H006', deliveryHubId: 'H001', status: 'Delivered', assignedAgentId: a10?.id, packageType: 'Craft Supplies', serviceLevel: 'standard', weight: 1.7, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 2 },
      { orderId: 'ORD-2024-0054', trackingId: 'TRK-RS12TU34', merchant: m2, customer: c4, deliveryAddress: '28 Linking Road, Bandra West, Mumbai - 400050', pickupHubId: 'H006', deliveryHubId: 'H002', status: 'Returned', assignedAgentId: a10?.id, packageType: 'Designer Apparel', serviceLevel: 'standard', weight: 1.9, paymentMode: 'COD', priority: 'Medium', daysOffset: 2 },

      // H005 Kolkata (Maintenance Hub): Historical terminal orders only — zero pending unassigned
      { orderId: 'ORD-2024-0055', trackingId: 'TRK-VW56XY78', merchant: m1, customer: c5, deliveryAddress: '11 Park Street, Kolkata - 700016', pickupHubId: 'H001', deliveryHubId: 'H005', status: 'Delivered', assignedAgentId: a1?.id, packageType: 'Printing Paper', serviceLevel: 'standard', weight: 8.0, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 4 },
      { orderId: 'ORD-2024-0056', trackingId: 'TRK-ZA90BC12', merchant: m2, customer: c1, deliveryAddress: '50 Salt Lake Sector V, Kolkata - 700091', pickupHubId: 'H003', deliveryHubId: 'H005', status: 'Delivered', assignedAgentId: a5?.id, packageType: 'Books & Journals', serviceLevel: 'express', weight: 4.3, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 3 },
      { orderId: 'ORD-2024-0057', trackingId: 'TRK-DE34FG56', merchant: m1, customer: c2, deliveryAddress: '22 Camac Street, Kolkata - 700017', pickupHubId: 'H004', deliveryHubId: 'H005', status: 'Returned', assignedAgentId: a7?.id, packageType: 'Test Probes', serviceLevel: 'standard', weight: 1.5, paymentMode: 'COD', priority: 'Low', daysOffset: 3 },
      { orderId: 'ORD-2024-0058', trackingId: 'TRK-HI78JK90', merchant: m2, customer: c3, deliveryAddress: '11 Park Street, Kolkata - 700016', pickupHubId: 'H006', deliveryHubId: 'H005', status: 'Delivered', assignedAgentId: a9?.id, packageType: 'Handloom Fabrics', serviceLevel: 'express', weight: 3.8, paymentMode: 'Prepaid', priority: 'Medium', daysOffset: 4 },
      { orderId: 'ORD-2024-0059', trackingId: 'TRK-LM12NO34', merchant: m1, customer: c4, deliveryAddress: '50 Salt Lake Sector V, Kolkata - 700091', pickupHubId: 'H002', deliveryHubId: 'H005', status: 'Cancelled', packageType: 'Ceramic Mugs', serviceLevel: 'standard', weight: 2.7, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 3 },
      { orderId: 'ORD-2024-0060', trackingId: 'TRK-PQ56RS78', merchant: m2, customer: c5, deliveryAddress: '22 Camac Street, Kolkata - 700017', pickupHubId: 'H002', deliveryHubId: 'H005', status: 'Delivered', assignedAgentId: a2?.id, packageType: 'Packaged Snacks', serviceLevel: 'standard', weight: 5.0, paymentMode: 'Prepaid', priority: 'Low', daysOffset: 5 },
    ];

    // Insert orders and payments inside transaction
    this.db.transaction((conn) => {
      // Re-check version inside transaction for strict concurrency safety
      if (
        conn
          .prepare('SELECT version FROM data_migrations WHERE version = ?')
          .get(version)
      ) {
        return;
      }

      for (const d of definitions) {
        const existing = conn.prepare('SELECT id FROM orders WHERE orderId = ?').get(d.orderId);
        if (existing) continue;

        const breakdown = this.pricingService.calculateQuote({
          serviceLevel: d.serviceLevel,
          weightKg: d.weight,
          paymentMode: d.paymentMode,
        });

        const history: IStatusEvent[] = [
          {
            status: 'Pending',
            timestamp: new Date(Date.now() - (d.daysOffset + 1) * 86400000).toISOString(),
            note: 'Order created',
          },
        ];
        if (d.status !== 'Pending') {
          history.push({
            status: d.status,
            timestamp: new Date(Date.now() - d.daysOffset * 86400000).toISOString(),
            note: `Seeded at ${d.status}`,
          });
        }

        const orderRow = this.ordersRepository.create({
          orderId: d.orderId,
          trackingId: d.trackingId,
          merchantId: d.merchant.id,
          customerId: d.customer.id,
          customerName: d.customer.name,
          customerPhone: d.customer.phone || '+91 90000 00001',
          deliveryAddress: d.deliveryAddress,
          pickupHubId: d.pickupHubId,
          deliveryHubId: d.deliveryHubId,
          status: d.status,
          assignedAgentId: d.assignedAgentId,
          packageType: d.packageType,
          serviceLevel: d.serviceLevel,
          weight: d.weight,
          amount: breakdown.total,
          pricingBreakdown: breakdown,
          paymentMode: d.paymentMode,
          paymentStatus: d.paymentMode === 'Prepaid' ? 'paid' : 'pending',
          priority: d.priority,
          estimatedDelivery: new Date(Date.now() + 2 * 86400000),
          statusHistory: history,
        } as any, conn);

        conn
          .prepare(
            `INSERT INTO payments (id, orderId, type, amount, method, status, createdAt, updatedAt)
             VALUES (lower(hex(randomblob(16))), ?, 'charge', ?, ?, ?, ?, ?)`,
          )
          .run(
            orderRow.id,
            orderRow.amount,
            orderRow.paymentMode,
            orderRow.paymentMode === 'Prepaid' ? 'paid' : 'pending',
            new Date().toISOString(),
            new Date().toISOString(),
          );
      }

      // Recalculate currentTasksCount for all agents from active orders
      const now = new Date().toISOString();
      conn
        .prepare(
          `UPDATE agents
           SET currentTasksCount = (
             SELECT COUNT(*) FROM orders
             WHERE assignedAgentId = agents.userId
               AND status NOT IN ('Delivered', 'Cancelled', 'Returned', 'Failed')
           ), updatedAt = ?`,
        )
        .run(now);

      conn
        .prepare(
          'INSERT INTO data_migrations (version, appliedAt) VALUES (?, ?)',
        )
        .run(version, now);
    });

    console.log(`✅ Applied development data migration ${version} (expanded 60-order multi-hub dataset)`);
  }

  // ── 4 demo shipments ──────────────────────────────────────────────────────
  private seedShipments() {
    if (this.db.count('shipments') > 0) return;
    const merchant1 = this.usersRepository.findByEmail('merchant1@example.com');
    const merchant2 = this.usersRepository.findByEmail('merchant2@example.com');
    if (!merchant1 || !merchant2) return;

    const shipments = [
      {
        shipmentId: 'SHP-2024-0001', merchantId: merchant1.id,
        originHubId: 'H001', destinationHubId: 'H003', serviceType: 'express', weight: 5.2, status: 'in-transit',
        trackingTimeline: [
          { status: 'pending', location: 'Chennai Central Hub', timestamp: new Date(Date.now() - 5 * 86400000), note: 'Shipment created and booked' },
          { status: 'in-transit', location: 'Bengaluru Tech Hub', timestamp: new Date(Date.now() - 2 * 86400000), note: 'Package in transit to Delhi' },
        ],
      },
      {
        shipmentId: 'SHP-2024-0002', merchantId: merchant2.id,
        originHubId: 'H002', destinationHubId: 'H004', serviceType: 'standard', weight: 12.0, status: 'delivered',
        trackingTimeline: [
          { status: 'pending', location: 'Mumbai Gateway Hub', timestamp: new Date(Date.now() - 10 * 86400000), note: 'Shipment registered' },
          { status: 'delivered', location: 'Bengaluru Tech Hub', timestamp: new Date(Date.now() - 5 * 86400000), note: 'Delivered successfully' },
        ],
      },
      {
        shipmentId: 'SHP-2024-0003', merchantId: merchant1.id,
        originHubId: 'H004', destinationHubId: 'H006', serviceType: 'same-day', weight: 1.5, status: 'pending',
        trackingTimeline: [
          { status: 'pending', location: 'Bengaluru Tech Hub', timestamp: new Date(), note: 'Shipment created, awaiting pickup' },
        ],
      },
      {
        shipmentId: 'SHP-2024-0004', merchantId: merchant2.id,
        originHubId: 'H003', destinationHubId: 'H005', serviceType: 'standard', weight: 8.0, status: 'processing',
        trackingTimeline: [
          { status: 'pending', location: 'Delhi NCR Hub', timestamp: new Date(Date.now() - 3 * 86400000), note: 'Shipment booked' },
          { status: 'processing', location: 'Delhi NCR Hub', timestamp: new Date(Date.now() - 2 * 86400000), note: 'Package being sorted' },
        ],
      },
    ];

    for (const s of shipments) {
      // Shipment price also comes from the authoritative PricingService
      const amount = this.pricingService.calculateTotal({
        serviceLevel: s.serviceType as any,
        weightKg: s.weight,
      });
      this.shipmentsRepository.create({ ...s, amount } as any);
    }
    console.log('✅ Seeded 4 shipments (backend-priced)');
  }

  // ── 6 demo tickets ────────────────────────────────────────────────────────
  private seedTickets() {
    if (this.db.count('tickets') > 0) return;
    const merchant1 = this.usersRepository.findByEmail('merchant1@example.com');
    const merchant2 = this.usersRepository.findByEmail('merchant2@example.com');
    if (!merchant1) return;

    const tickets = [
      { merchantId: merchant1.id, subject: 'Order ORD-2024-0002 not delivered on time', trackingId: 'TRK-AB34CD56', priority: 'high', status: 'open' },
      { merchantId: merchant2?.id ?? '', subject: 'Wrong package delivered for ORD-2024-0006', trackingId: 'TRK-QR90ST12', priority: 'high', status: 'in-progress' },
      { merchantId: merchant1.id, subject: 'Tracking not updating for ORD-2024-0005', trackingId: 'TRK-MN56OP78', priority: 'med', status: 'open' },
      { merchantId: merchant1.id, subject: 'Damaged goods - ORD-2024-0004', trackingId: 'TRK-IJ12KL34', priority: 'high', status: 'in-progress' },
      { merchantId: merchant1.id, subject: 'Invoice discrepancy for SHP-2024-0001', trackingId: 'SHP-2024-0001', priority: 'med', status: 'open' },
      { merchantId: merchant2?.id ?? '', subject: 'Bulk shipment partially missing', trackingId: 'SHP-2024-0004', priority: 'high', status: 'open' },
    ];

    for (const t of tickets) this.ticketsRepository.create(t as any);
    console.log('✅ Seeded 6 tickets');
  }

  // ── 6 demo complaints ─────────────────────────────────────────────────────
  private seedComplaints() {
    if (this.db.count('complaints') > 0) return;
    const customer1 = this.usersRepository.findByEmail('customer1@example.com');
    const customer2 = this.usersRepository.findByEmail('customer2@example.com');
    if (!customer1 || !customer2) return;

    const complaints = [
      { userId: customer1.id, orderId: 'ORD-2024-0006', description: 'Ordered Sony headphones but received wrong brand. Package seal was broken on delivery.', status: 'In Progress' },
      { userId: customer2.id, orderId: 'ORD-2024-0002', description: 'Agent demanded Rs 200 extra cash not included in order. Had already paid online.', status: 'Resolved' },
      { userId: customer1.id, orderId: 'ORD-2024-0003', description: 'Package left outside without calling. Was stolen before I got home.', status: 'Open' },
      { userId: customer2.id, orderId: 'ORD-2024-0004', description: 'Cricket equipment arrived broken. Package clearly mishandled in transit.', status: 'In Progress' },
      { userId: customer1.id, orderId: 'ORD-2024-0005', description: 'High value order with no tracking update for 5 days. Very concerned.', status: 'In Progress' },
      { userId: customer2.id, orderId: 'ORD-2024-0009', description: 'Agent attempted delivery at completely wrong address. Was home all day waiting.', status: 'Resolved' },
    ];

    for (const c of complaints) this.complaintsRepository.create(c as any);
    console.log('✅ Seeded 6 complaints');
  }

  // ── 8 demo feedback entries ───────────────────────────────────────────────
  private seedFeedback() {
    if (this.db.count('feedback') > 0) return;
    const customer1 = this.usersRepository.findByEmail('customer1@example.com');
    const customer2 = this.usersRepository.findByEmail('customer2@example.com');
    if (!customer1 || !customer2) return;

    const feedbacks = [
      { userId: customer1.id, orderId: 'ORD-2024-0001', rating: 5, comments: 'Excellent! Package arrived early. Agent was professional and called ahead.', status: 'Reviewed' },
      { userId: customer2.id, orderId: 'ORD-2024-0006', rating: 2, comments: 'Very disappointing. Late by 3 days, damaged packaging.', status: 'New' },
      { userId: customer1.id, orderId: 'ORD-2024-0003', rating: 4, comments: 'Good experience. Tracking accurate, smooth delivery.', status: 'New' },
      { userId: customer2.id, orderId: 'ORD-2024-0001', rating: 5, comments: 'Agent was fantastic. On time, very polite.', status: 'Actioned' },
      { userId: customer1.id, orderId: 'ORD-2024-0005', rating: 3, comments: 'Packaging average. Box had dents but items safe inside.', status: 'New' },
      { userId: customer2.id, orderId: 'ORD-2024-0002', rating: 1, comments: 'Terrible. Not delivered after a week. No support response.', status: 'New' },
      { userId: customer1.id, orderId: 'ORD-2024-0009', rating: 4, comments: 'Medicines delivered safely and on time. Temperature packaging intact.', status: 'New' },
      { userId: customer2.id, orderId: 'ORD-2024-0008', rating: 2, comments: 'Tracking system unreliable. Wrong location shown throughout.', status: 'Reviewed' },
    ];

    for (const f of feedbacks) this.feedbackRepository.create(f as any);
    console.log('✅ Seeded 8 feedback entries');
  }
}