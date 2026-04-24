import { TicketsRepository } from './tickets.repository';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ITicket } from './interfaces/ticket.interface';
import { IUser } from '../users/interfaces/user.interface';
export declare class TicketsService {
    private readonly ticketsRepository;
    constructor(ticketsRepository: TicketsRepository);
    findAll(user: IUser): ITicket[];
    findById(id: string): ITicket;
    create(dto: CreateTicketDto, user: IUser): ITicket;
    update(id: string, dto: UpdateTicketDto, user: IUser): ITicket;
    delete(id: string, user: IUser): void;
}
