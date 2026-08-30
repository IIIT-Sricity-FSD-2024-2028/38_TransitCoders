import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ShipmentsRepository } from './shipments.repository';
import { PricingService } from '../pricing/pricing.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { IShipment } from './interfaces/shipment.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly shipmentsRepository: ShipmentsRepository,
    private readonly pricingService: PricingService,
  ) {}

  findAll(user: IUser): IShipment[] {
    if (user.role === Role.MERCHANT) {
      return this.shipmentsRepository.findByMerchant(user.id);
    }
    if (user.role === Role.SUPER_USER || user.role === Role.HUB_MANAGER) {
      return this.shipmentsRepository.findAll();
    }
    throw new ForbiddenException('You do not have permission to view shipments');
  }

  findById(id: string): IShipment {
    const shipment = this.shipmentsRepository.findById(id) ?? this.shipmentsRepository.findByShipmentId(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return shipment;
  }

  create(dto: CreateShipmentDto, user: IUser): IShipment {
    const merchantId = user.role === Role.SUPER_USER && dto.merchantId
      ? dto.merchantId
      : user.id;

    // Authoritative backend pricing (same engine as orders)
    const amount = this.pricingService.calculateTotal({
      serviceLevel: dto.serviceType,
      weightKg: dto.weight,
    });

    const shipmentId = this.shipmentsRepository.nextShipmentId();

    return this.shipmentsRepository.create({
      shipmentId,
      merchantId,
      recipient: dto.recipient,
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

    let amount = shipment.amount;
    if (dto.weight !== undefined || dto.serviceType !== undefined) {
      const serviceType = dto.serviceType ?? shipment.serviceType;
      const weight = dto.weight ?? shipment.weight;
      amount = this.pricingService.calculateTotal({ serviceLevel: serviceType, weightKg: weight });
    }

    return this.shipmentsRepository.update(shipment.id, { ...dto, amount })!;
  }

  cancel(id: string, user: IUser): IShipment {
    const shipment = this.findById(id);
    if (shipment.merchantId !== user.id && user.role !== Role.SUPER_USER) {
      throw new ForbiddenException('Only the merchant or super user can cancel this shipment');
    }
    if (!['pending', 'processing'].includes(shipment.status)) {
      throw new BadRequestException(`Cannot cancel a shipment with status "${shipment.status}"`);
    }
    return this.shipmentsRepository.update(shipment.id, { status: 'cancelled' })!;
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
