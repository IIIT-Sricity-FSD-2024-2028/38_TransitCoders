"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let TicketsRepository = class TicketsRepository {
    tickets = new Map();
    ticketCounter = 1000;
    findAll() {
        return Array.from(this.tickets.values());
    }
    findById(id) {
        return this.tickets.get(id);
    }
    findByMerchant(merchantId) {
        return Array.from(this.tickets.values()).filter((t) => t.merchantId === merchantId);
    }
    create(data) {
        this.ticketCounter++;
        const ticket = {
            ...data,
            id: (0, uuid_1.v4)(),
            ticketId: `TKT-${this.ticketCounter}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.tickets.set(ticket.id, ticket);
        return ticket;
    }
    update(id, changes) {
        const ticket = this.tickets.get(id);
        if (!ticket)
            return undefined;
        const updated = { ...ticket, ...changes, updatedAt: new Date() };
        this.tickets.set(id, updated);
        return updated;
    }
    delete(id) {
        return this.tickets.delete(id);
    }
};
exports.TicketsRepository = TicketsRepository;
exports.TicketsRepository = TicketsRepository = __decorate([
    (0, common_1.Injectable)()
], TicketsRepository);
//# sourceMappingURL=tickets.repository.js.map