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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const update_order_dto_1 = require("./dto/update-order.dto");
const assign_agent_dto_1 = require("./dto/assign-agent.dto");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_constant_1 = require("../common/constants/roles.constant");
const statuses_constant_1 = require("../common/constants/statuses.constant");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    findAll(user) {
        return { success: true, data: this.ordersService.findAll(user) };
    }
    findById(id) {
        return { success: true, data: this.ordersService.findById(id) };
    }
    async create(dto, user) {
        return { success: true, data: await this.ordersService.create(dto, user) };
    }
    update(id, dto, user) {
        return { success: true, data: this.ordersService.update(id, dto, user) };
    }
    updateStatus(id, status, user) {
        return { success: true, data: this.ordersService.updateStatus(id, status, user) };
    }
    assignAgent(id, dto, user) {
        return { success: true, data: this.ordersService.assignAgent(id, dto.agentId, user) };
    }
    cancel(id, user) {
        this.ordersService.cancel(id, user);
        return { success: true, message: 'Order cancelled successfully' };
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List orders (role-filtered)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], OrdersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.MERCHANT),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new order' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.MERCHANT, roles_constant_1.Role.HUB_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update an order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_order_dto_1.UpdateOrderDto, Object]),
    __metadata("design:returntype", Object)
], OrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.HUB_MANAGER, roles_constant_1.Role.DELIVERY_AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Update order status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Object)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.HUB_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Assign an agent to an order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_agent_dto_1.AssignAgentDto, Object]),
    __metadata("design:returntype", Object)
], OrdersController.prototype, "assignAgent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.MERCHANT, roles_constant_1.Role.SUPER_USER),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel an order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], OrdersController.prototype, "cancel", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, swagger_1.ApiHeader)({ name: 'x-auth-token', required: true }),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map