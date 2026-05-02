import { PartialType } from '@nestjs/mapped-types';
import { CreateHubDto } from './create-hub.dto';

export class UpdateHubDto extends PartialType(CreateHubDto) {}
