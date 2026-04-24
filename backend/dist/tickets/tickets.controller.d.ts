import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import type { ITicket } from './interfaces/ticket.interface';
import type { IUser } from '../users/interfaces/user.interface';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    findAll(user: IUser): IApiResponse<ITicket[]>;
    create(dto: CreateTicketDto, user: IUser): IApiResponse<ITicket>;
    update(id: string, dto: UpdateTicketDto, user: IUser): IApiResponse<ITicket>;
    delete(id: string, user: IUser): IApiResponse<null>;
}
