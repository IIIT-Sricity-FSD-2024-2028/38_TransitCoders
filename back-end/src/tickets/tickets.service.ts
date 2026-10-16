import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketsRepository } from './tickets.repository';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ITicket } from './interfaces/ticket.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';

// ODDT-303 — TicketsService
@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  findAll(user: IUser): ITicket[] {
    // Merchant sees only their own tickets; super_user sees all
    if (user.role === Role.MERCHANT) {
      return this.ticketsRepository.findByMerchant(user.id);
    }
    return this.ticketsRepository.findAll();
  }

  findById(id: string): ITicket {
    const ticket = this.ticketsRepository.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  create(dto: CreateTicketDto, user: IUser): ITicket {
    return this.ticketsRepository.create({
      ...dto,
      merchantId: user.id,
      status: 'open',
    });
  }

  update(id: string, dto: UpdateTicketDto, user: IUser): ITicket {
    const ticket = this.findById(id);
    // Only the owning merchant or a super_user or admin may update
    if (ticket.merchantId !== user.id && ![Role.SUPER_USER, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException('You do not own this ticket');
    }
    return this.ticketsRepository.update(id, dto)!;
  }

  delete(id: string, user: IUser): void {
    const ticket = this.findById(id);
    // Only the owning merchant or super user may delete
    if (ticket.merchantId !== user.id && user.role !== Role.SUPER_USER) {
      throw new ForbiddenException('You do not own this ticket');
    }
    this.ticketsRepository.delete(id);
  }
}
