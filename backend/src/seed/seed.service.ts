import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RolesRepository } from '../roles/roles.repository';
import { AgentsRepository } from '../agents/agents.repository';

/**
 * SeedService — ODDT-315
 * Runs automatically via OnModuleInit after all modules initialise.
 * Seeds the 5 system roles with full permissions maps.
 * Users seed is here too so the app is usable out of the box.
 *
 * Coordinate with the team so other seeds (hubs, orders, etc.) are added
 * in their respective feature branches and merged into this service.
 */
@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
    private readonly agentsRepository: AgentsRepository,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedUsers();
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
          view_users: true,
          create_users: true,
          update_users: true,
          delete_users: true,
          approve_users: true,
          view_orders: true,
          create_orders: true,
          update_orders: true,
          delete_orders: true,
          assign_agents: true,
          view_shipments: true,
          view_hubs: true,
          create_hubs: true,
          update_hubs: true,
          view_agents: true,
          view_tickets: true,
          update_tickets: true,
          view_complaints: true,
          update_complaints: true,
          view_feedback: true,
          update_feedback: true,
          view_roles: true,
          update_roles: true,
        },
      },
      {
        roleId: 'hub_manager',
        name: 'Hub Manager',
        description: 'Manages hub operations, orders, and agents',
        isSystem: true,
        permissions: {
          view_users: true,
          create_users: true,
          update_users: true,
          delete_users: false,
          approve_users: true,
          view_orders: true,
          create_orders: false,
          update_orders: true,
          delete_orders: false,
          assign_agents: true,
          view_shipments: false,
          view_hubs: true,
          create_hubs: false,
          update_hubs: false,
          view_agents: true,
          view_tickets: false,
          update_tickets: false,
          view_complaints: false,
          update_complaints: false,
          view_feedback: false,
          update_feedback: false,
          view_roles: false,
          update_roles: false,
        },
      },
      {
        roleId: 'merchant',
        name: 'Merchant',
        description: 'Creates orders and shipments; manages tickets',
        isSystem: true,
        permissions: {
          view_users: false,
          create_users: false,
          update_users: false,
          delete_users: false,
          approve_users: false,
          view_orders: true,
          create_orders: true,
          update_orders: true,
          delete_orders: true,
          assign_agents: false,
          view_shipments: true,
          view_hubs: false,
          create_hubs: false,
          update_hubs: false,
          view_agents: false,
          view_tickets: true,
          update_tickets: true,
          view_complaints: false,
          update_complaints: false,
          view_feedback: false,
          update_feedback: false,
          view_roles: false,
          update_roles: false,
        },
      },
      {
        roleId: 'delivery_agent',
        name: 'Delivery Agent',
        description: 'Views assigned orders and updates availability',
        isSystem: true,
        permissions: {
          view_users: false,
          create_users: false,
          update_users: false,
          delete_users: false,
          approve_users: false,
          view_orders: true,
          create_orders: false,
          update_orders: false,
          delete_orders: false,
          assign_agents: false,
          view_shipments: false,
          view_hubs: false,
          create_hubs: false,
          update_hubs: false,
          view_agents: true,
          view_tickets: false,
          update_tickets: false,
          view_complaints: false,
          update_complaints: false,
          view_feedback: false,
          update_feedback: false,
          view_roles: false,
          update_roles: false,
        },
      },
      {
        roleId: 'customer',
        name: 'Customer',
        description: 'Views own orders; submits complaints and feedback',
        isSystem: true,
        permissions: {
          view_users: false,
          create_users: false,
          update_users: false,
          delete_users: false,
          approve_users: false,
          view_orders: true,
          create_orders: false,
          update_orders: false,
          delete_orders: false,
          assign_agents: false,
          view_shipments: false,
          view_hubs: false,
          create_hubs: false,
          update_hubs: false,
          view_agents: false,
          view_tickets: false,
          update_tickets: false,
          view_complaints: true,
          update_complaints: false,
          view_feedback: true,
          update_feedback: false,
          view_roles: false,
          update_roles: false,
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
      {
        name: 'Super Admin',
        email: 'super@swifttrack.com',
        password: await hash('password123'),
        role: 'super_user' as const,
        isActive: true,
      },
      {
        name: 'Hub Manager Delhi',
        email: 'hm1@swifttrack.com',
        password: await hash('password123'),
        role: 'hub_manager' as const,
        hubId: 'H001',
        isActive: true,
      },
      {
        name: 'Hub Manager Mumbai',
        email: 'hm2@swifttrack.com',
        password: await hash('password123'),
        role: 'hub_manager' as const,
        hubId: 'H002',
        isActive: true,
      },
      {
        name: 'Merchant One',
        email: 'merchant1@example.com',
        password: await hash('password123'),
        role: 'merchant' as const,
        company: 'Acme Corp',
        isActive: true,
      },
      {
        name: 'Merchant Two',
        email: 'merchant2@example.com',
        password: await hash('password123'),
        role: 'merchant' as const,
        company: 'Beta Goods',
        isActive: true,
      },
      {
        name: 'Agent One',
        email: 'agent1@swifttrack.com',
        password: await hash('password123'),
        role: 'delivery_agent' as const,
        hubId: 'H001',
        isActive: true,
      },
      {
        name: 'Agent Two',
        email: 'agent2@swifttrack.com',
        password: await hash('password123'),
        role: 'delivery_agent' as const,
        hubId: 'H002',
        isActive: true,
      },
      {
        name: 'Customer One',
        email: 'customer1@example.com',
        password: await hash('password123'),
        role: 'customer' as const,
        isActive: true,
      },
      {
        name: 'Customer Two',
        email: 'customer2@example.com',
        password: await hash('password123'),
        role: 'customer' as const,
        isActive: true,
      },
    ];

    const createdUsers = users.map((u) => this.usersRepository.create(u as any));
    
    createdUsers.forEach(u => {
      if (u.role === 'delivery_agent') {
        this.agentsRepository.create({
          userId: u.id,
          hubId: u.hubId,
          availabilityStatus: 'Available',
          currentTasksCount: 0
        });
      }
    });

    console.log('✅ Seeded 9 users');
  }
}
