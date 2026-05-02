import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
  exports: [RolesRepository], // SeedService needs to insert initial roles
})
export class RolesModule {}
