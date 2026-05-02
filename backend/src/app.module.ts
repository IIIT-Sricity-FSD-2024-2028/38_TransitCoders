import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { FeedbackModule } from './feedback/feedback.module';
import { RolesModule } from './roles/roles.module';
import { SeedModule } from './seed/seed.module';
import { OrdersModule } from './orders/orders.module';
import { AgentsModule } from './agents/agents.module';

/**
 * AppModule — Root module wiring all SM-owned feature modules.
 *
 * Teammates will add their own modules here when merging:
 * - AuthModule (VK + auth team)
 * - OrdersModule, ShipmentsModule (orders team)
 * - HubsModule, AgentsModule (hubs team)
 *
 * SM modules: Users, Tickets, Complaints, Feedback, Roles, Seed
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    TicketsModule,
    ComplaintsModule,
    FeedbackModule,
    RolesModule,
    SeedModule,
    OrdersModule,
    AgentsModule,
    // TODO: Add ShipmentsModule, HubsModule when those branches are merged.
  ],
})
export class AppModule {}
