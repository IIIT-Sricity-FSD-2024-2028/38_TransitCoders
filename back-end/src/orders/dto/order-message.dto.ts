import { IsString, MaxLength } from 'class-validator';

export class OrderMessageDto {
  @IsString()
  @MaxLength(1000)
  body: string;
}
