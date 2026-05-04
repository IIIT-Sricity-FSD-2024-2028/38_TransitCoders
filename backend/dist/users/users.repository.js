"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let UsersRepository = class UsersRepository {
    users = new Map();
    findAll() {
        return Array.from(this.users.values());
    }
    findById(id) {
        return this.users.get(id);
    }
    findByEmail(email) {
        return Array.from(this.users.values()).find((u) => u.email === email);
    }
    findByToken(token) {
        return Array.from(this.users.values()).find((u) => u.authToken === token);
    }
    create(data) {
        const user = {
            ...data,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.set(user.id, user);
        return user;
    }
    update(id, changes) {
        const user = this.users.get(id);
        if (!user)
            return undefined;
        const updated = { ...user, ...changes, updatedAt: new Date() };
        this.users.set(id, updated);
        return updated;
    }
    delete(id) {
        return this.users.delete(id);
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)()
], UsersRepository);
//# sourceMappingURL=users.repository.js.map