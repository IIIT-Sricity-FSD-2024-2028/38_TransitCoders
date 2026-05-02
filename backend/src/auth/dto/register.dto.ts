import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.constant';

/**
 * RegisterDto — ODDT-231
 * Used by POST /auth/register.
 * Dedicated auth DTO — deliberately kept separate from CreateUserDto
 * so the public registration endpoint controls exactly which fields are accepted.
 */
export class RegisterDto {
  @ApiProperty({ example: 'Shreesaanth R' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'shreesaanth@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'Minimum 6 characters',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: Role,
    example: Role.CUSTOMER,
    description: 'Role for the new account',
  })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Acme Corp',
    description: 'Required when role is merchant',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    example: 'H001',
    description: 'Required when role is hub_manager or delivery_agent',
  })
  @IsOptional()
  @IsString()
  hubId?: string;
}
