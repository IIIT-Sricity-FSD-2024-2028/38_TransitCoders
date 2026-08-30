import { Global, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

/**
 * Global module: UsersRepository is consumed by AuthGuard (used by every
 * controller module) as well as feature services. Making it global avoids
 * importing UsersModule in every module that uses guards.
 */
@Global()
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  // Export both so AuthModule and OrdersModule can inject them
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}