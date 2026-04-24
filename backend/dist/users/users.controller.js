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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_constant_1 = require("../common/constants/roles.constant");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll() {
        return { success: true, data: this.usersService.findAll() };
    }
    findById(id) {
        return { success: true, data: this.usersService.findById(id) };
    }
    async create(dto) {
        return { success: true, data: await this.usersService.create(dto) };
    }
    async update(id, dto) {
        return { success: true, data: await this.usersService.update(id, dto) };
    }
    delete(id, user) {
        this.usersService.delete(id, user.id);
        return { success: true, message: 'User deleted successfully' };
    }
    approve(id) {
        return { success: true, data: this.usersService.approve(id) };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_USER, roles_constant_1.Role.HUB_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'List all users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all users' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_USER, roles_constant_1.Role.HUB_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_USER, roles_constant_1.Role.HUB_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already registered' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_USER, roles_constant_1.Role.HUB_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update user details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_USER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a user (super_user only)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete your own account' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], UsersController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_USER, roles_constant_1.Role.HUB_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a pending user account' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'User is already active' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], UsersController.prototype, "approve", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiHeader)({ name: 'x-auth-token', required: true, description: 'Auth token from login' }),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map