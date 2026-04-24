"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const tickets_repository_1 = require("./tickets.repository");
const roles_constant_1 = require("../common/constants/roles.constant");
let TicketsService = class TicketsService {
    ticketsRepository;
    constructor(ticketsRepository) {
        this.ticketsRepository = ticketsRepository;
    }
    findAll(user) {
        if (user.role === roles_constant_1.Role.MERCHANT) {
            return this.ticketsRepository.findByMerchant(user.id);
        }
        return this.ticketsRepository.findAll();
    }
    findById(id) {
        const ticket = this.ticketsRepository.findById(id);
        if (!ticket)
            throw new common_1.NotFoundException(`Ticket ${id} not found`);
        return ticket;
    }
    create(dto, user) {
        return this.ticketsRepository.create({
            ...dto,
            merchantId: user.id,
            status: 'open',
        });
    }
    update(id, dto, user) {
        const ticket = this.findById(id);
        if (ticket.merchantId !== user.id && user.role !== roles_constant_1.Role.SUPER_USER) {
            throw new common_1.ForbiddenException('You do not own this ticket');
        }
        return this.ticketsRepository.update(id, dto);
    }
    delete(id, user) {
        const ticket = this.findById(id);
        if (ticket.merchantId !== user.id && user.role !== roles_constant_1.Role.SUPER_USER) {
            throw new common_1.ForbiddenException('You do not own this ticket');
        }
        this.ticketsRepository.delete(id);
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tickets_repository_1.TicketsRepository])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map