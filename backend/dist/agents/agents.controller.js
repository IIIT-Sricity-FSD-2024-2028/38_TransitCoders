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
exports.AgentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agents_service_1 = require("./agents.service");
const update_availability_dto_1 = require("./dto/update-availability.dto");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_constant_1 = require("../common/constants/roles.constant");
let AgentsController = class AgentsController {
    agentsService;
    constructor(agentsService) {
        this.agentsService = agentsService;
    }
    findAll() {
        return { success: true, data: this.agentsService.findAll() };
    }
    findById(id) {
        return { success: true, data: this.agentsService.findById(id) };
    }
    getWorklist(id, user) {
        return { success: true, data: this.agentsService.getWorklist(id, user) };
    }
    updateAvailability(id, dto, user) {
        return { success: true, data: this.agentsService.updateAvailability(id, dto, user) };
    }
};
exports.AgentsController = AgentsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.HUB_MANAGER, roles_constant_1.Role.SUPER_USER),
    (0, swagger_1.ApiOperation)({ summary: 'List all agents' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AgentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.HUB_MANAGER, roles_constant_1.Role.SUPER_USER, roles_constant_1.Role.DELIVERY_AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent profile' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AgentsController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/worklist'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.DELIVERY_AGENT, roles_constant_1.Role.HUB_MANAGER, roles_constant_1.Role.SUPER_USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get assigned orders for an agent' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], AgentsController.prototype, "getWorklist", null);
__decorate([
    (0, common_1.Patch)(':id/availability'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.DELIVERY_AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Update agent availability status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_availability_dto_1.UpdateAvailabilityDto, Object]),
    __metadata("design:returntype", Object)
], AgentsController.prototype, "updateAvailability", null);
exports.AgentsController = AgentsController = __decorate([
    (0, swagger_1.ApiTags)('Agents'),
    (0, swagger_1.ApiHeader)({ name: 'x-auth-token', required: true }),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('agents'),
    __metadata("design:paramtypes", [agents_service_1.AgentsService])
], AgentsController);
//# sourceMappingURL=agents.controller.js.map