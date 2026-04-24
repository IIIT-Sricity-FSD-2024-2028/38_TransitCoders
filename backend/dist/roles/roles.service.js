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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const roles_repository_1 = require("./roles.repository");
let RolesService = class RolesService {
    rolesRepository;
    constructor(rolesRepository) {
        this.rolesRepository = rolesRepository;
    }
    findAll() {
        return this.rolesRepository.findAll();
    }
    findById(id) {
        const role = this.rolesRepository.findById(id);
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    update(id, dto) {
        this.findById(id);
        return this.rolesRepository.update(id, { permissions: dto.permissions });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [roles_repository_1.RolesRepository])
], RolesService);
//# sourceMappingURL=roles.service.js.map