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
exports.FeedbackController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_constant_1 = require("../common/constants/roles.constant");
const feedback_service_1 = require("./feedback.service");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
const update_feedback_dto_1 = require("./dto/update-feedback.dto");
let FeedbackController = class FeedbackController {
    feedbackService;
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
    }
    findAll(user) {
        return { success: true, data: this.feedbackService.findAll(user) };
    }
    create(dto, user) {
        return { success: true, data: this.feedbackService.create(dto, user) };
    }
    update(id, dto, user) {
        return { success: true, data: this.feedbackService.update(id, dto, user) };
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.CUSTOMER, roles_constant_1.Role.SUPER_USER),
    (0, swagger_1.ApiOperation)({ summary: 'List feedback (customer sees own, super_user sees all)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], FeedbackController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Submit feedback with rating 1-5' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Rating must be between 1 and 5' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_feedback_dto_1.CreateFeedbackDto, Object]),
    __metadata("design:returntype", Object)
], FeedbackController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_USER),
    (0, swagger_1.ApiOperation)({ summary: 'Update feedback review status (super_user only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_feedback_dto_1.UpdateFeedbackDto, Object]),
    __metadata("design:returntype", Object)
], FeedbackController.prototype, "update", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, swagger_1.ApiTags)('Feedback'),
    (0, swagger_1.ApiHeader)({ name: 'x-auth-token', required: true }),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('feedback'),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map