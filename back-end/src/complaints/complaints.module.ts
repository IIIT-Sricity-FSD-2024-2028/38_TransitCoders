import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { ComplaintsRepository } from './complaints.repository';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [UsersModule, OrdersModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ComplaintsRepository],
  exports: [ComplaintsRepository],
})
export class ComplaintsModule {}
