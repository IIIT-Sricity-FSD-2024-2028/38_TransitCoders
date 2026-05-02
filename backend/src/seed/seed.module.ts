import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [UsersModule, RolesModule, AgentsModule],
  providers: [SeedService],
})
export class SeedModule {}
