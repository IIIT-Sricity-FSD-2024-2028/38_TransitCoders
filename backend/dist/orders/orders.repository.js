"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let OrdersRepository = class OrdersRepository {
    orders = new Map();
    findAll() {
        return Array.from(this.orders.values());
    }
    findById(id) {
        return this.orders.get(id);
    }
    findByMerchant(merchantId) {
        return this.findAll().filter(order => order.merchantId === merchantId);
    }
    findByCustomer(customerId) {
        return this.findAll().filter(order => order.customerId === customerId);
    }
    findByHub(hubId) {
        return this.findAll().filter(order => order.pickupHubId === hubId || order.deliveryHubId === hubId);
    }
    findByAgent(agentId) {
        return this.findAll().filter(order => order.assignedAgentId === agentId);
    }
    create(order) {
        const id = (0, uuid_1.v4)();
        const newOrder = {
            ...order,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.orders.set(id, newOrder);
        return newOrder;
    }
    update(id, changes) {
        const existing = this.findById(id);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...changes,
            updatedAt: new Date(),
        };
        this.orders.set(id, updated);
        return updated;
    }
    delete(id) {
        return this.orders.delete(id);
    }
};
exports.OrdersRepository = OrdersRepository;
exports.OrdersRepository = OrdersRepository = __decorate([
    (0, common_1.Injectable)()
], OrdersRepository);
//# sourceMappingURL=orders.repository.js.map