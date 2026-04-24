import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { FeedbackModule } from './feedback/feedback.module';
import { RolesModule } from './roles/roles.module';
import { SeedModule } from './seed/seed.module';

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
    // SM-owned modules
    UsersModule,
    TicketsModule,
    ComplaintsModule,
    FeedbackModule,
    RolesModule,
    SeedModule,
    // TODO: Add AuthModule, OrdersModule, ShipmentsModule, HubsModule, AgentsModule
    // when those branches are merged. Module stubs can be added as needed.
  ],
})
export class AppModule {}
