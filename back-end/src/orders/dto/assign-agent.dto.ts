import { IsString, IsNotEmpty } from 'class-validator';

export class AssignAgentDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;
}
