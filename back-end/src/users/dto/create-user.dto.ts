import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.constant';

export class CreateUserDto {
  @ApiProperty({ example: 'Shazil Mirza' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'shazil@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.MERCHANT })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ example: 'H001' })
  @IsOptional()
  @IsString()
  hubId?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  company?: string;
}
