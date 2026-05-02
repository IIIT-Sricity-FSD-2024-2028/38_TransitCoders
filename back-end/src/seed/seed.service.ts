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

/**
 * SeedService — ODDT-315, ODDT-318 to ODDT-323
 * Runs automatically via OnModuleInit after all modules initialise.
 * Seeds roles, users, hubs, orders, shipments, tickets, complaints, feedback.
 */
@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly hubsRepository: HubsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly shipmentsRepository: ShipmentsRepository,
    private readonly ticketsRepository: TicketsRepository,
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedUsers();
    await this.seedHubs();
    await this.seedOrders();
    await this.seedShipments();
    await this.seedTickets();
    await this.seedComplaints();
    await this.seedFeedback();
  }

  // ODDT-315 — Seed 5 system roles with full permissions maps
  private seedRoles() {
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
          view_complaints: false, update_complaints: false,
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
    ];

    roles.forEach((r) => this.rolesRepository.create(r));
    console.log('✅ Seeded 5 system roles');
  }

  // Seed base users so the app is testable from day one
  private async seedUsers() {
    const hash = (pw: string) => bcrypt.hash(pw, 10);

    const users = [
      { name: 'Super Admin', email: 'super@swifttrack.com', password: await hash('password123'), role: 'super_user' as const, isActive: true },
      { name: 'Hub Manager Delhi', email: 'hm1@swifttrack.com', password: await hash('password123'), role: 'hub_manager' as const, hubId: 'H001', isActive: true },
      { name: 'Hub Manager Mumbai', email: 'hm2@swifttrack.com', password: await hash('password123'), role: 'hub_manager' as const, hubId: 'H002', isActive: true },
      { name: 'Merchant One', email: 'merchant1@example.com', password: await hash('password123'), role: 'merchant' as const, company: 'Acme Corp', isActive: true },
      { name: 'Merchant Two', email: 'merchant2@example.com', password: await hash('password123'), role: 'merchant' as const, company: 'Beta Goods', isActive: true },
      { name: 'Agent One', email: 'agent1@swifttrack.com', password: await hash('password123'), role: 'delivery_agent' as const, hubId: 'H001', isActive: true },
      { name: 'Agent Two', email: 'agent2@swifttrack.com', password: await hash('password123'), role: 'delivery_agent' as const, hubId: 'H002', isActive: true },
      { name: 'Customer One', email: 'customer1@example.com', password: await hash('password123'), role: 'customer' as const, isActive: true },
      { name: 'Customer Two', email: 'customer2@example.com', password: await hash('password123'), role: 'customer' as const, isActive: true },
    ];

    const createdUsers = users.map((u) => this.usersRepository.create(u as any));

    createdUsers.forEach(u => {
      if (u.role === 'delivery_agent') {
        this.agentsRepository.create({
          userId: u.id,
          name: u.name,
          phone: u.phone,
          hubId: u.hubId ?? '',
          availabilityStatus: 'Available',
          vehicleType: 'bike',
        });
      }
    });

    console.log('✅ Seeded 9 users');
  }

  // ODDT-320 — Seed 6 hubs matching frontend H001–H006 format
  private async seedHubs() {
    try {
      const hubs = [
        { hubId: 'H001', name: 'Chennai Central Hub', address: 'No. 45, Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', phone: '044-23456789', email: 'chennai@swifttrack.com', managerId: null, status: 'active' as const, capacity: 500, currentLoad: 234 },
        { hubId: 'H002', name: 'Mumbai Gateway Hub', address: 'Plot 12, Dharavi Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400017', phone: '022-67891234', email: 'mumbai@swifttrack.com', managerId: null, status: 'active' as const, capacity: 750, currentLoad: 412 },
        { hubId: 'H003', name: 'Delhi NCR Hub', address: 'Block C, Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', phone: '011-45678901', email: 'delhi@swifttrack.com', managerId: null, status: 'active' as const, capacity: 600, currentLoad: 289 },
        { hubId: 'H004', name: 'Bengaluru Tech Hub', address: 'EPIP Zone, Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', phone: '080-23456781', email: 'bengaluru@swifttrack.com', managerId: null, status: 'active' as const, capacity: 450, currentLoad: 178 },
        { hubId: 'H005', name: 'Kolkata East Hub', address: 'Sector V, Salt Lake', city: 'Kolkata', state: 'West Bengal', pincode: '700091', phone: '033-45678902', email: 'kolkata@swifttrack.com', managerId: null, status: 'maintenance' as const, capacity: 300, currentLoad: 45 },
        { hubId: 'H006', name: 'Hyderabad Central Hub', address: 'Raheja Mindspace, HITEC City', city: 'Hyderabad', state: 'Telangana', pincode: '500081', phone: '040-23456780', email: 'hyderabad@swifttrack.com', managerId: null, status: 'active' as const, capacity: 400, currentLoad: 201 },
      ];
      for (const h of hubs) { this.hubsRepository.create(h); }
      console.log('✅ Seeded 6 hubs');
    } catch (e) { console.error('❌ Seed error (hubs):', e); }
  }

  // ODDT-321 — Seed 10 orders with real UUID lookups
  private async seedOrders() {
    try {
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

      const orders: Array<Omit<import('../orders/interfaces/order.interface').IOrder, 'id' | 'createdAt' | 'updatedAt'>> = [
        { orderId: 'ORD-2024-0001', trackingId: 'TRK-XK29BL7M', merchantId: merchant1.id, customerId: customer1.id, customerName: 'Aarav Sharma', deliveryAddress: '42, Besant Nagar, Chennai - 600090', pickupHubId: 'H001', deliveryHubId: 'H003', status: 'Delivered', assignedAgentId: agent1?.id, packageType: 'Electronics', weight: 2.5, amount: 45000, priority: 'High', paymentMode: 'Prepaid', estimatedDelivery: new Date(Date.now() - 2 * 86400000) },
        { orderId: 'ORD-2024-0002', trackingId: 'TRK-AB34CD56', merchantId: merchant1.id, customerId: customer2.id, customerName: 'Preethi Venkataraman', deliveryAddress: '15, Andheri West, Mumbai - 400058', pickupHubId: 'H002', deliveryHubId: 'H001', status: 'InTransit', assignedAgentId: agent2?.id, packageType: 'Clothing', weight: 1.2, amount: 3500, priority: 'Medium', paymentMode: 'COD', estimatedDelivery: new Date(Date.now() + 2 * 86400000) },
        { orderId: 'ORD-2024-0003', trackingId: 'TRK-EF78GH90', merchantId: merchant1.id, customerId: customer1.id, customerName: 'Manish Gupta', deliveryAddress: '8, Lajpat Nagar III, New Delhi - 110024', pickupHubId: 'H003', deliveryHubId: 'H002', status: 'Pending', assignedAgentId: undefined, packageType: 'Documents', weight: 0.3, amount: 500, priority: 'Low', paymentMode: 'Prepaid', estimatedDelivery: new Date(Date.now() + 3 * 86400000) },
        { orderId: 'ORD-2024-0004', trackingId: 'TRK-IJ12KL34', merchantId: merchant1.id, customerId: customer2.id, customerName: 'Divya Menon', deliveryAddress: '22, Koramangala 5th Block, Bengaluru - 560095', pickupHubId: 'H004', deliveryHubId: 'H001', status: 'Assigned', assignedAgentId: agent1?.id, packageType: 'Electronics', weight: 6.8, amount: 32000, priority: 'High', paymentMode: 'Prepaid', estimatedDelivery: new Date(Date.now() + 1 * 86400000) },
        { orderId: 'ORD-2024-0005', trackingId: 'TRK-MN56OP78', merchantId: merchant1.id, customerId: customer1.id, customerName: 'Rajesh Iyer', deliveryAddress: '7, T Nagar, Chennai - 600017', pickupHubId: 'H001', deliveryHubId: 'H001', status: 'Pending', assignedAgentId: undefined, packageType: 'Medical Supplies', weight: 0.8, amount: 1200, priority: 'High', paymentMode: 'Prepaid', estimatedDelivery: new Date(Date.now() + 3 * 86400000) },
        { orderId: 'ORD-2024-0006', trackingId: 'TRK-QR90ST12', merchantId: merchant2.id, customerId: customer2.id, customerName: 'Sunita Agarwal', deliveryAddress: '33, Park Street, Kolkata - 700016', pickupHubId: 'H005', deliveryHubId: 'H002', status: 'Delivered', assignedAgentId: agent1?.id, packageType: 'Handicrafts', weight: 3.1, amount: 8900, priority: 'Medium', paymentMode: 'COD', estimatedDelivery: new Date(Date.now() - 3 * 86400000) },
        { orderId: 'ORD-2024-0007', trackingId: 'TRK-UV34WX56', merchantId: merchant2.id, customerId: customer1.id, customerName: 'Karthik Subramanian', deliveryAddress: 'Plot 9, Banjara Hills Road 12, Hyderabad - 500034', pickupHubId: 'H006', deliveryHubId: 'H003', status: 'Cancelled', assignedAgentId: undefined, packageType: 'Automotive Parts', weight: 5.3, amount: 4200, priority: 'Low', paymentMode: 'COD', estimatedDelivery: new Date(Date.now() + 3 * 86400000) },
        { orderId: 'ORD-2024-0008', trackingId: 'TRK-YZ78AB90', merchantId: merchant2.id, customerId: customer2.id, customerName: 'Neha Joshi', deliveryAddress: '17, Powai Lake Drive, Mumbai - 400076', pickupHubId: 'H002', deliveryHubId: 'H004', status: 'InTransit', assignedAgentId: agent2?.id, packageType: 'Furniture Component', weight: 12.5, amount: 15000, priority: 'Medium', paymentMode: 'Prepaid', estimatedDelivery: new Date(Date.now() + 2 * 86400000) },
        { orderId: 'ORD-2024-0009', trackingId: 'TRK-CD12EF34', merchantId: merchant2.id, customerId: customer1.id, customerName: 'Aryan Verma', deliveryAddress: '45, Sector 18, Noida - 201301', pickupHubId: 'H003', deliveryHubId: 'H005', status: 'Assigned', assignedAgentId: agent2?.id, packageType: 'Sports Equipment', weight: 3.5, amount: 7500, priority: 'Medium', paymentMode: 'Prepaid', estimatedDelivery: new Date(Date.now() + 2 * 86400000) },
        { orderId: 'ORD-2024-0010', trackingId: 'TRK-GH56IJ78', merchantId: merchant2.id, customerId: customer2.id, customerName: 'Lakshmi Priya', deliveryAddress: '12, JP Nagar Phase 2, Bengaluru - 560078', pickupHubId: 'H004', deliveryHubId: 'H006', status: 'OutForDelivery', assignedAgentId: agent1?.id, packageType: 'Clothing', weight: 2.1, amount: 65000, priority: 'High', paymentMode: 'COD', estimatedDelivery: new Date(Date.now() + 1 * 86400000) },
      ];

      for (const o of orders) { this.ordersRepository.create(o); }
      console.log('✅ Seeded 10 orders');
    } catch (e) { console.error('❌ Seed error (orders):', e); }
  }

  // ODDT-322 — Seed 4 shipments
  private async seedShipments() {
    try {
      const merchant1 = this.usersRepository.findByEmail('merchant1@example.com');
      const merchant2 = this.usersRepository.findByEmail('merchant2@example.com');
      if (!merchant1 || !merchant2) return;

      const shipments: Array<Omit<import('../shipments/interfaces/shipment.interface').IShipment, 'id' | 'createdAt' | 'updatedAt'>> = [
        {
          shipmentId: 'SHP-2024-0001', merchantId: merchant1.id,
          originHubId: 'H001', destinationHubId: 'H003', serviceType: 'express', weight: 5.2, amount: 520, status: 'in-transit',
          trackingTimeline: [
            { status: 'pending', location: 'Chennai Central Hub', timestamp: new Date(Date.now() - 5 * 86400000), note: 'Shipment created and booked' },
            { status: 'in-transit', location: 'Bengaluru Tech Hub', timestamp: new Date(Date.now() - 2 * 86400000), note: 'Package in transit to Delhi' },
          ],
        },
        {
          shipmentId: 'SHP-2024-0002', merchantId: merchant2.id,
          originHubId: 'H002', destinationHubId: 'H004', serviceType: 'standard', weight: 12.0, amount: 600, status: 'delivered',
          trackingTimeline: [
            { status: 'pending', location: 'Mumbai Gateway Hub', timestamp: new Date(Date.now() - 10 * 86400000), note: 'Shipment registered' },
            { status: 'delivered', location: 'Bengaluru Tech Hub', timestamp: new Date(Date.now() - 5 * 86400000), note: 'Delivered successfully' },
          ],
        },
        {
          shipmentId: 'SHP-2024-0003', merchantId: merchant1.id,
          originHubId: 'H004', destinationHubId: 'H006', serviceType: 'same-day', weight: 1.5, amount: 300, status: 'pending',
          trackingTimeline: [
            { status: 'pending', location: 'Bengaluru Tech Hub', timestamp: new Date(), note: 'Shipment created, awaiting pickup' },
          ],
        },
        {
          shipmentId: 'SHP-2024-0004', merchantId: merchant2.id,
          originHubId: 'H003', destinationHubId: 'H005', serviceType: 'standard', weight: 8.0, amount: 400, status: 'processing',
          trackingTimeline: [
            { status: 'pending', location: 'Delhi NCR Hub', timestamp: new Date(Date.now() - 3 * 86400000), note: 'Shipment booked' },
            { status: 'processing', location: 'Delhi NCR Hub', timestamp: new Date(Date.now() - 2 * 86400000), note: 'Package being sorted' },
          ],
        },
      ];

      for (const s of shipments) { this.shipmentsRepository.create(s); }
      console.log('✅ Seeded 4 shipments');
    } catch (e) { console.error('❌ Seed error (shipments):', e); }
  }

  // ODDT-323 — Seed 6 tickets
  private async seedTickets() {
    try {
      const merchant1 = this.usersRepository.findByEmail('merchant1@example.com');
      const merchant2 = this.usersRepository.findByEmail('merchant2@example.com');
      if (!merchant1) return;

      // ITicket: { merchantId, subject, trackingId?, priority: 'low'|'med'|'high', status: 'open'|'in-progress'|'resolved'|'closed' }
      const tickets: Array<Parameters<typeof this.ticketsRepository.create>[0]> = [
        { merchantId: merchant1.id, subject: 'Order ORD-2024-0002 not delivered on time', trackingId: 'TRK-AB34CD56', priority: 'high', status: 'open' },
        { merchantId: merchant2?.id ?? '', subject: 'Wrong package delivered for ORD-2024-0006', trackingId: 'TRK-QR90ST12', priority: 'high', status: 'in-progress' },
        { merchantId: merchant1.id, subject: 'Tracking not updating for ORD-2024-0005', trackingId: 'TRK-MN56OP78', priority: 'med', status: 'open' },
        { merchantId: merchant1.id, subject: 'Damaged goods - ORD-2024-0004', trackingId: 'TRK-IJ12KL34', priority: 'high', status: 'in-progress' },
        { merchantId: merchant1.id, subject: 'Invoice discrepancy for SHP-2024-0001', trackingId: 'SHP-2024-0001', priority: 'med', status: 'open' },
        { merchantId: merchant2?.id ?? '', subject: 'Bulk shipment partially missing', trackingId: 'SHP-2024-0004', priority: 'high', status: 'open' },
      ];

      for (const t of tickets) { this.ticketsRepository.create(t); }
      console.log('✅ Seeded 6 tickets');
    } catch (e) { console.error('❌ Seed error (tickets):', e); }
  }

  // ODDT-323 — Seed 6 complaints
  private async seedComplaints() {
    try {
      const customer1 = this.usersRepository.findByEmail('customer1@example.com');
      const customer2 = this.usersRepository.findByEmail('customer2@example.com');
      if (!customer1 || !customer2) return;

      // IComplaint: { userId, orderId?, description, status: 'Open'|'In Progress'|'Resolved' }
      const complaints: Array<Parameters<typeof this.complaintsRepository.create>[0]> = [
        { userId: customer1.id, orderId: 'ORD-2024-0006', description: 'Ordered Sony headphones but received wrong brand. Package seal was broken on delivery.', status: 'In Progress' },
        { userId: customer2.id, orderId: 'ORD-2024-0002', description: 'Agent demanded Rs 200 extra cash not included in order. Had already paid online.', status: 'Resolved' },
        { userId: customer1.id, orderId: 'ORD-2024-0003', description: 'Package left outside without calling. Was stolen before I got home.', status: 'Open' },
        { userId: customer2.id, orderId: 'ORD-2024-0004', description: 'Cricket equipment arrived broken. Package clearly mishandled in transit.', status: 'In Progress' },
        { userId: customer1.id, orderId: 'ORD-2024-0005', description: 'High value order with no tracking update for 5 days. Very concerned.', status: 'In Progress' },
        { userId: customer2.id, orderId: 'ORD-2024-0009', description: 'Agent attempted delivery at completely wrong address. Was home all day waiting.', status: 'Resolved' },
      ];

      for (const c of complaints) { this.complaintsRepository.create(c); }
      console.log('✅ Seeded 6 complaints');
    } catch (e) { console.error('❌ Seed error (complaints):', e); }
  }

  // ODDT-323 — Seed 8 feedback entries
  private async seedFeedback() {
    try {
      const customer1 = this.usersRepository.findByEmail('customer1@example.com');
      const customer2 = this.usersRepository.findByEmail('customer2@example.com');
      if (!customer1 || !customer2) return;

      // IFeedback: { userId, orderId?, rating, comments?, status: 'New'|'Reviewed'|'Actioned' }
      const feedbacks: Array<Parameters<typeof this.feedbackRepository.create>[0]> = [
        { userId: customer1.id, orderId: 'ORD-2024-0001', rating: 5, comments: 'Excellent! Package arrived early. Agent was professional and called ahead.', status: 'Reviewed' },
        { userId: customer2.id, orderId: 'ORD-2024-0006', rating: 2, comments: 'Very disappointing. Late by 3 days, damaged packaging.', status: 'New' },
        { userId: customer1.id, orderId: 'ORD-2024-0003', rating: 4, comments: 'Good experience. Tracking accurate, smooth delivery.', status: 'New' },
        { userId: customer2.id, orderId: 'ORD-2024-0001', rating: 5, comments: 'Agent was fantastic. On time, very polite.', status: 'Actioned' },
        { userId: customer1.id, orderId: 'ORD-2024-0005', rating: 3, comments: 'Packaging average. Box had dents but items safe inside.', status: 'New' },
        { userId: customer2.id, orderId: 'ORD-2024-0002', rating: 1, comments: 'Terrible. Not delivered after a week. No support response.', status: 'New' },
        { userId: customer1.id, orderId: 'ORD-2024-0009', rating: 4, comments: 'Medicines delivered safely and on time. Temperature packaging intact.', status: 'New' },
        { userId: customer2.id, orderId: 'ORD-2024-0008', rating: 2, comments: 'Tracking system unreliable. Wrong location shown throughout.', status: 'Reviewed' },
      ];

      for (const f of feedbacks) { this.feedbackRepository.create(f); }
      console.log('✅ Seeded 8 feedback entries');
    } catch (e) { console.error('❌ Seed error (feedback):', e); }
  }
}
