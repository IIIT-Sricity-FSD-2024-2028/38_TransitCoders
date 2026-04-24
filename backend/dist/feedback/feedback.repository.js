"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let FeedbackRepository = class FeedbackRepository {
    feedbacks = new Map();
    findAll() {
        return Array.from(this.feedbacks.values());
    }
    findById(id) {
        return this.feedbacks.get(id);
    }
    findByUser(userId) {
        return Array.from(this.feedbacks.values()).filter((f) => f.userId === userId);
    }
    create(data) {
        const feedback = {
            ...data,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
        };
        this.feedbacks.set(feedback.id, feedback);
        return feedback;
    }
    update(id, changes) {
        const feedback = this.feedbacks.get(id);
        if (!feedback)
            return undefined;
        const updated = { ...feedback, ...changes };
        this.feedbacks.set(id, updated);
        return updated;
    }
};
exports.FeedbackRepository = FeedbackRepository;
exports.FeedbackRepository = FeedbackRepository = __decorate([
    (0, common_1.Injectable)()
], FeedbackRepository);
//# sourceMappingURL=feedback.repository.js.map