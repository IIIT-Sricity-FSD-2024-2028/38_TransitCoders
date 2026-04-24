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
exports.ComplaintsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_constant_1 = require("../common/constants/roles.constant");
const complaints_service_1 = require("./complaints.service");
const create_complaint_dto_1 = require("./dto/create-complaint.dto");
const update_complaint_dto_1 = require("./dto/update-complaint.dto");
let ComplaintsController = class ComplaintsController {
    complaintsService;
    constructor(complaintsService) {
        this.complaintsService = complaintsService;
    }
    findAll(user) {
        return { success: true, data: this.complaintsService.findAll(user) };
    }
    create(dto, user) {
        return { success: true, data: this.complaintsService.create(dto, user) };
    }
    update(id, dto, user) {
        return { success: true, data: this.complaintsService.update(id, dto, user) };
    }
};
exports.ComplaintsController = ComplaintsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.CUSTOMER, roles_constant_1.Role.SUPER_USER),
    (0, swagger_1.ApiOperation)({ summary: 'List complaints (customer sees own, super_user sees all)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], ComplaintsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'File a new complaint' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_complaint_dto_1.CreateComplaintDto, Object]),
    __metadata("design:returntype", Object)
], ComplaintsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_USER),
    (0, swagger_1.ApiOperation)({ summary: 'Update complaint status (super_user only)' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not super_user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_complaint_dto_1.UpdateComplaintDto, Object]),
    __metadata("design:returntype", Object)
], ComplaintsController.prototype, "update", null);
exports.ComplaintsController = ComplaintsController = __decorate([
    (0, swagger_1.ApiTags)('Complaints'),
    (0, swagger_1.ApiHeader)({ name: 'x-auth-token', required: true }),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('complaints'),
    __metadata("design:paramtypes", [complaints_service_1.ComplaintsService])
], ComplaintsController);
//# sourceMappingURL=complaints.controller.js.map