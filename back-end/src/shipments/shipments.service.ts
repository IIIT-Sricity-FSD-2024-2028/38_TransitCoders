import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ShipmentsRepository } from './shipments.repository';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { IShipment } from './interfaces/shipment.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';

@Injectable()
export class ShipmentsService {
  constructor(private readonly shipmentsRepository: ShipmentsRepository) {}

  findAll(user: IUser): IShipment[] {
    if (user.role === Role.MERCHANT) {
      return this.shipmentsRepository.findByMerchant(user.id);
    }
    return this.shipmentsRepository.findAll();
  }

  findById(id: string): IShipment {
    const shipment = this.shipmentsRepository.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return shipment;
  }

  create(dto: CreateShipmentDto, user: IUser): IShipment {
    const merchantId = user.role === Role.SUPER_USER && dto.merchantId
      ? dto.merchantId
      : user.id;

    const rateMap: Record<string, number> = {
      standard: 50,
      express: 100,
      'same-day': 200,
    };
    const rate = rateMap[dto.serviceType] ?? 50;
    const amount = Math.max(dto.weight * rate, 100);

    const shipmentId = this.shipmentsRepository.nextShipmentId();

    return this.shipmentsRepository.create({
      shipmentId,
      merchantId,
      originHubId: dto.originHubId,
      destinationHubId: dto.destinationHubId,
      serviceType: dto.serviceType,
      weight: dto.weight,
      amount,
      status: 'pending',
      trackingTimeline: [
        {
          status: 'pending',
          location: dto.originHubId,
          timestamp: new Date(),
          note: 'Shipment created and booked',
        },
      ],
    });
  }

  update(id: string, dto: UpdateShipmentDto, user: IUser): IShipment {
    const shipment = this.findById(id);
    if (shipment.merchantId !== user.id && user.role !== Role.SUPER_USER) {
      throw new ForbiddenException('You do not have permission to update this shipment');
    }
    return this.shipmentsRepository.update(id, dto)!;
  }

  cancel(id: string, user: IUser): IShipment {
    const shipment = this.findById(id);
    if (shipment.merchantId !== user.id && user.role !== Role.SUPER_USER) {
      throw new ForbiddenException('Only the merchant or super user can cancel this shipment');
    }
    if (!['pending', 'processing'].includes(shipment.status)) {
      throw new BadRequestException(`Cannot cancel a shipment with status "${shipment.status}"`);
    }
    return this.shipmentsRepository.update(id, { status: 'cancelled' })!;
  }

  getTracking(id: string): IShipment['trackingTimeline'] {
    return this.findById(id).trackingTimeline;
  }

  delete(id: string, user: IUser): void {
    if (user.role !== Role.SUPER_USER) {
      throw new ForbiddenException('Only super users can delete shipments');
    }
    const shipment = this.findById(id);
    this.shipmentsRepository.delete(shipment.id);
  }
}
