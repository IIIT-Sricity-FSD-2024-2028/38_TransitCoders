import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// All fields from CreateUserDto become optional for partial updates.
export class UpdateUserDto extends PartialType(CreateUserDto) {}
