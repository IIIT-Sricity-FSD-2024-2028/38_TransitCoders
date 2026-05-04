"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let AgentsRepository = class AgentsRepository {
    agents = new Map();
    findAll() {
        return Array.from(this.agents.values());
    }
    findById(id) {
        return this.agents.get(id);
    }
    findByUserId(userId) {
        return this.findAll().find(agent => agent.userId === userId);
    }
    findByHub(hubId) {
        return this.findAll().filter(agent => agent.hubId === hubId);
    }
    create(agent) {
        const id = (0, uuid_1.v4)();
        const newAgent = {
            ...agent,
            id,
            currentTasksCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.agents.set(id, newAgent);
        return newAgent;
    }
    update(id, changes) {
        const existing = this.findById(id);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...changes,
            updatedAt: new Date(),
        };
        this.agents.set(id, updated);
        return updated;
    }
    delete(id) {
        return this.agents.delete(id);
    }
};
exports.AgentsRepository = AgentsRepository;
exports.AgentsRepository = AgentsRepository = __decorate([
    (0, common_1.Injectable)()
], AgentsRepository);
//# sourceMappingURL=agents.repository.js.map