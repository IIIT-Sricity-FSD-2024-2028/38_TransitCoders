import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule], // For AuthGuard to resolve users
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository],
})
export class TicketsModule {}
