import { Module } from '@nestjs/common';
import { HubsController } from './hubs.controller';
import { HubsService } from './hubs.service';
import { HubsRepository } from './hubs.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [HubsController],
  providers: [HubsService, HubsRepository],
  exports: [HubsService, HubsRepository],
})
export class HubsModule {}
