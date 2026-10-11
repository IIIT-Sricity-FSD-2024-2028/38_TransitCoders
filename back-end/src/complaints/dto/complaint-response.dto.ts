import { ApiProperty } from '@nestjs/swagger';

export class ComplaintResponseDto {
  @ApiProperty({ example: 'cmp-0001' })
  reference!: string;

  @ApiProperty({ example: '42099a94-8c60-4f94-b408-908238188aa5' })
  id!: string;

  @ApiProperty({ example: 'Priya Iyer' })
  customerName!: string;

  @ApiProperty({ example: 'ORD-2024-0006', required: false })
  orderId?: string;

  @ApiProperty({ example: 'Damaged Package' })
  type!: string;

  @ApiProperty({ example: 'Medium', enum: ['Low', 'Medium', 'High', 'Critical'] })
  priority!: string;

  @ApiProperty({ example: 'Ordered Sony headphones but received wrong brand.' })
  description!: string;

  @ApiProperty({ example: 'In Progress', enum: ['Open', 'In Progress', 'Resolved'] })
  status!: string;

  @ApiProperty({ example: '2026-09-01T10:30:00.000Z' })
  createdAt!: Date | string;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z', required: false })
  updatedAt?: Date | string;
}