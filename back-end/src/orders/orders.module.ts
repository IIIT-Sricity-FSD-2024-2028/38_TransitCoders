import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { TrackingController } from './tracking.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { BarcodeService } from './barcode.service';
import { UsersModule } from '../users/users.module';
import { AgentsModule } from '../agents/agents.module';
import { PricingModule } from '../pricing/pricing.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => AgentsModule),
    PricingModule,
    forwardRef(() => PaymentsModule),
    NotificationsModule,
  ],
  controllers: [OrdersController, TrackingController],
  providers: [OrdersService, OrdersRepository, BarcodeService],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}