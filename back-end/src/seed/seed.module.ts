import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { AgentsModule } from '../agents/agents.module';
import { HubsModule } from '../hubs/hubs.module';
import { OrdersModule } from '../orders/orders.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { TicketsModule } from '../tickets/tickets.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    AgentsModule,
    HubsModule,
    OrdersModule,
    ShipmentsModule,
    TicketsModule,
    ComplaintsModule,
    FeedbackModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
