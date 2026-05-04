import { ApiProperty } from '@nestjs/swagger';

export class ComplaintResponseDto {
  @ApiProperty({ example: 'cmp-0001' })
  reference: string;

  @ApiProperty({ example: '42099a94-8c60-4f94-b408-908238188aa5' })
  id: string;

  @ApiProperty({ example: 'Priya Iyer' })
  customerName: string;

  @ApiProperty({ example: 'ORD-2024-0006' })
  orderId?: string;

  @ApiProperty({ example: 'Ordered Sony headphones but received wrong brand.' })
  description: string;

  @ApiProperty({ example: 'In Progress' })
  status: string;

  @ApiProperty({ example: 'May 5' })
  createdAt: Date | string;

  @ApiProperty({ example: 'May 6' })
  updatedAt?: Date | string;
}
