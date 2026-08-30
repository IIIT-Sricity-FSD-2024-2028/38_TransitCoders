import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { DatabaseModule } from './common/database/database.module';
import { PricingModule } from './pricing/pricing.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Rate limiting — 60 requests per minute globally
    // Auth endpoints additionally enforced with @UseGuards(ThrottlerGuard)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,  // 60 seconds window
        limit: 60,   // 60 requests per window
      },
    ]),
    DatabaseModule,
    PricingModule,
    PaymentsModule,
    ReportsModule,
    NotificationsModule,
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
export class AppModule implements NestModule {
  /**
   * Registers LoggingMiddleware via MiddlewareConsumer.
   *
   * This is genuine NestMiddleware applied at the module level —
   * NOT a Guard, Interceptor, or Exception Filter.
   *
   * It runs for every route ('*') and logs:
   *   timestamp, method, URL, status, response time, IP, userId, role
   * to logs/access.log (and errors to logs/error.log) via Winston.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*');
  }
}
