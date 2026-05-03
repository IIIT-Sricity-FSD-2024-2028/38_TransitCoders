import { Module, forwardRef } from '@nestjs/common';
import { HubsController } from './hubs.controller';
import { HubsService } from './hubs.service';
import { HubsRepository } from './hubs.repository';
import { UsersModule } from '../users/users.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [UsersModule, forwardRef(() => AgentsModule)],
  controllers: [HubsController],
  providers: [HubsService, HubsRepository],
  exports: [HubsService, HubsRepository],
})
export class HubsModule {}

