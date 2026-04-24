"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintsRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let ComplaintsRepository = class ComplaintsRepository {
    complaints = new Map();
    findAll() {
        return Array.from(this.complaints.values());
    }
    findById(id) {
        return this.complaints.get(id);
    }
    findByUser(userId) {
        return Array.from(this.complaints.values()).filter((c) => c.userId === userId);
    }
    create(data) {
        const complaint = {
            ...data,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.complaints.set(complaint.id, complaint);
        return complaint;
    }
    update(id, changes) {
        const complaint = this.complaints.get(id);
        if (!complaint)
            return undefined;
        const updated = { ...complaint, ...changes, updatedAt: new Date() };
        this.complaints.set(id, updated);
        return updated;
    }
};
exports.ComplaintsRepository = ComplaintsRepository;
exports.ComplaintsRepository = ComplaintsRepository = __decorate([
    (0, common_1.Injectable)()
], ComplaintsRepository);
//# sourceMappingURL=complaints.repository.js.map