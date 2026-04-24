import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [UsersModule, RolesModule],
  providers: [SeedService],
})
export class SeedModule {}
