import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * Global module so every feature module's repository can inject
 * DatabaseService without importing DatabaseModule explicitly.
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}