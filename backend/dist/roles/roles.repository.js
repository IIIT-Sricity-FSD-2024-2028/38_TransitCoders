"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let RolesRepository = class RolesRepository {
    roles = new Map();
    findAll() {
        return Array.from(this.roles.values());
    }
    findById(id) {
        return this.roles.get(id);
    }
    findByRoleId(roleId) {
        return Array.from(this.roles.values()).find((r) => r.roleId === roleId);
    }
    create(data) {
        const role = {
            ...data,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.roles.set(role.id, role);
        return role;
    }
    update(id, changes) {
        const role = this.roles.get(id);
        if (!role)
            return undefined;
        const updated = { ...role, ...changes, updatedAt: new Date() };
        this.roles.set(id, updated);
        return updated;
    }
};
exports.RolesRepository = RolesRepository;
exports.RolesRepository = RolesRepository = __decorate([
    (0, common_1.Injectable)()
], RolesRepository);
//# sourceMappingURL=roles.repository.js.map