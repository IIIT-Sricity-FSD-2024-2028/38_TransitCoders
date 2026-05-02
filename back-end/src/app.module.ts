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
import { HubsModule } from './hubs/hubs.module';
import { ShipmentsModule } from './shipments/shipments.module';

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
    HubsModule,
    ShipmentsModule,
  ],
})
export class AppModule {}
