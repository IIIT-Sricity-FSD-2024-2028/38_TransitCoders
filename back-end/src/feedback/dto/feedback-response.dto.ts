import { ApiProperty } from '@nestjs/swagger';

export class FeedbackResponseDto {
  @ApiProperty({ example: 'fbk-0001' })
  reference: string;

  @ApiProperty({ example: '8f3b2a1d-9c4a-4a7c-9d3c-1b2a3c4d5e6f' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: 4 })
  rating: number;

  @ApiProperty({ example: 'Delivery was fast and courteous.' })
  comment?: string;

  @ApiProperty({ example: 'New' })
  status: string;

  @ApiProperty({ example: 'May 5' })
  createdAt: Date | string;
}
