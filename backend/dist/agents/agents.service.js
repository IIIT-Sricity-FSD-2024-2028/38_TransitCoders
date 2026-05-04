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
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const agents_repository_1 = require("./agents.repository");
const orders_repository_1 = require("../orders/orders.repository");
const roles_constant_1 = require("../common/constants/roles.constant");
let AgentsService = class AgentsService {
    agentsRepository;
    ordersRepository;
    constructor(agentsRepository, ordersRepository) {
        this.agentsRepository = agentsRepository;
        this.ordersRepository = ordersRepository;
    }
    findAll() {
        return this.agentsRepository.findAll();
    }
    findById(id) {
        const agent = this.agentsRepository.findById(id);
        if (!agent)
            throw new common_1.NotFoundException('Agent not found');
        return agent;
    }
    getWorklist(id, user) {
        const agent = this.findById(id);
        if (user.id !== agent.userId && user.role !== roles_constant_1.Role.SUPER_USER && user.role !== roles_constant_1.Role.HUB_MANAGER) {
            throw new common_1.ForbiddenException('You can only view your own worklist');
        }
        return this.ordersRepository.findByAgent(agent.userId);
    }
    updateAvailability(id, dto, user) {
        const agent = this.findById(id);
        if (user.id !== agent.userId && user.role !== roles_constant_1.Role.SUPER_USER && user.role !== roles_constant_1.Role.HUB_MANAGER) {
            throw new common_1.ForbiddenException('You can only update your own availability');
        }
        return this.agentsRepository.update(id, dto);
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => orders_repository_1.OrdersRepository))),
    __metadata("design:paramtypes", [agents_repository_1.AgentsRepository,
        orders_repository_1.OrdersRepository])
], AgentsService);
//# sourceMappingURL=agents.service.js.map