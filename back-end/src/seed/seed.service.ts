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
    await this.seedShipments();
    await this.seedTickets();
    await this.seedComplaints();
    await this.seedFeedback();
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
      ...(process.env.NODE_ENV !== 'production' ? [
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

    for (const o of orders) {
      const created = this.ordersRepository.create(o as any);
      // Ledger charge record for each seeded order (consistent financial model)
      this.db.run(
        `INSERT INTO payments (id, orderId, type, amount, method, status, createdAt, updatedAt)
         VALUES (lower(hex(randomblob(16))), ?, 'charge', ?, ?, ?, ?, ?)`,
        [
          created.id,
          created.amount,
          created.paymentMode,
          created.paymentMode === 'Prepaid' ? 'paid' : 'pending',
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );
    }
    console.log('✅ Seeded 10 orders (backend-priced) + payment charges');
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