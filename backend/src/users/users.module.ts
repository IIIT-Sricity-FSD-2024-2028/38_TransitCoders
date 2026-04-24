import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  // Export both so AuthModule and OrdersModule can inject them
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
