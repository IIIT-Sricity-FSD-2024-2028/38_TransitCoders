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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const orders_repository_1 = require("./orders.repository");
const agents_repository_1 = require("../agents/agents.repository");
const users_service_1 = require("../users/users.service");
const roles_constant_1 = require("../common/constants/roles.constant");
const statuses_constant_1 = require("../common/constants/statuses.constant");
let OrdersService = class OrdersService {
    ordersRepository;
    agentsRepository;
    usersService;
    constructor(ordersRepository, agentsRepository, usersService) {
        this.ordersRepository = ordersRepository;
        this.agentsRepository = agentsRepository;
        this.usersService = usersService;
    }
    findAll(user) {
        switch (user.role) {
            case roles_constant_1.Role.MERCHANT:
                return this.ordersRepository.findByMerchant(user.id);
            case roles_constant_1.Role.CUSTOMER:
                return this.ordersRepository.findByCustomer(user.id);
            case roles_constant_1.Role.HUB_MANAGER:
                if (!user.hubId)
                    return [];
                return this.ordersRepository.findByHub(user.hubId);
            case roles_constant_1.Role.DELIVERY_AGENT:
                return this.ordersRepository.findByAgent(user.id);
            case roles_constant_1.Role.SUPER_USER:
                return this.ordersRepository.findAll();
            default:
                return [];
        }
    }
    findById(id) {
        const order = this.ordersRepository.findById(id);
        if (!order)
            throw new common_1.NotFoundException(`Order ${id} not found`);
        return order;
    }
    async create(dto, user) {
        const customer = this.usersService.findById(dto.customerId);
        const orderId = `ORD_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const trackingId = `ST-${Math.floor(100000 + Math.random() * 900000)}`;
        return this.ordersRepository.create({
            ...dto,
            orderId,
            trackingId,
            merchantId: user.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            status: statuses_constant_1.OrderStatus.PENDING,
        });
    }
    update(id, dto, user) {
        const order = this.findById(id);
        if (order.merchantId !== user.id && user.role !== roles_constant_1.Role.SUPER_USER && user.role !== roles_constant_1.Role.HUB_MANAGER) {
            throw new common_1.ForbiddenException('You do not have permission to update this order');
        }
        return this.ordersRepository.update(id, dto);
    }
    updateStatus(orderId, newStatus, user) {
        const order = this.findById(orderId);
        const validNextStatuses = statuses_constant_1.VALID_TRANSITIONS[order.status];
        if (!validNextStatuses || !validNextStatuses.includes(newStatus)) {
            throw new common_1.BadRequestException(`Cannot transition from ${order.status} to ${newStatus}`);
        }
        return this.ordersRepository.update(orderId, { status: newStatus });
    }
    assignAgent(orderId, agentId, user) {
        const order = this.findById(orderId);
        if (order.status !== statuses_constant_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('Order must be in Pending status to assign an agent');
        }
        const agent = this.agentsRepository.findByUserId(agentId);
        if (!agent) {
            throw new common_1.BadRequestException('Invalid agent');
        }
        this.agentsRepository.update(agent.id, { currentTasksCount: agent.currentTasksCount + 1 });
        return this.ordersRepository.update(orderId, {
            assignedAgentId: agentId,
            status: statuses_constant_1.OrderStatus.ASSIGNED,
        });
    }
    cancel(orderId, user) {
        const order = this.findById(orderId);
        if (order.merchantId !== user.id && user.role !== roles_constant_1.Role.SUPER_USER) {
            throw new common_1.ForbiddenException('Only the merchant or a super user can cancel this order');
        }
        if (order.status !== statuses_constant_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('Order cannot be cancelled after it has been assigned to an agent');
        }
        this.ordersRepository.update(orderId, { status: statuses_constant_1.OrderStatus.CANCELLED });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => agents_repository_1.AgentsRepository))),
    __metadata("design:paramtypes", [orders_repository_1.OrdersRepository,
        agents_repository_1.AgentsRepository,
        users_service_1.UsersService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map