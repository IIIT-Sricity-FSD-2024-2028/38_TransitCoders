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
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const feedback_repository_1 = require("./feedback.repository");
const roles_constant_1 = require("../common/constants/roles.constant");
let FeedbackService = class FeedbackService {
    feedbackRepository;
    constructor(feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }
    findAll(user) {
        if (user.role === roles_constant_1.Role.CUSTOMER) {
            return this.feedbackRepository.findByUser(user.id);
        }
        return this.feedbackRepository.findAll();
    }
    findById(id) {
        const feedback = this.feedbackRepository.findById(id);
        if (!feedback)
            throw new common_1.NotFoundException(`Feedback ${id} not found`);
        return feedback;
    }
    create(dto, user) {
        return this.feedbackRepository.create({
            ...dto,
            userId: user.id,
            status: 'New',
        });
    }
    update(id, dto, user) {
        this.findById(id);
        if (user.role !== roles_constant_1.Role.SUPER_USER) {
            throw new common_1.ForbiddenException('Only super_user can update feedback status');
        }
        return this.feedbackRepository.update(id, dto);
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [feedback_repository_1.FeedbackRepository])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map