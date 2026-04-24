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
exports.ComplaintsService = void 0;
const common_1 = require("@nestjs/common");
const complaints_repository_1 = require("./complaints.repository");
const roles_constant_1 = require("../common/constants/roles.constant");
let ComplaintsService = class ComplaintsService {
    complaintsRepository;
    constructor(complaintsRepository) {
        this.complaintsRepository = complaintsRepository;
    }
    findAll(user) {
        if (user.role === roles_constant_1.Role.CUSTOMER) {
            return this.complaintsRepository.findByUser(user.id);
        }
        return this.complaintsRepository.findAll();
    }
    findById(id) {
        const complaint = this.complaintsRepository.findById(id);
        if (!complaint)
            throw new common_1.NotFoundException(`Complaint ${id} not found`);
        return complaint;
    }
    create(dto, user) {
        return this.complaintsRepository.create({
            ...dto,
            userId: user.id,
            status: 'Open',
        });
    }
    update(id, dto, user) {
        this.findById(id);
        if (user.role !== roles_constant_1.Role.SUPER_USER) {
            throw new common_1.ForbiddenException('Only super_user can update complaint status');
        }
        return this.complaintsRepository.update(id, dto);
    }
};
exports.ComplaintsService = ComplaintsService;
exports.ComplaintsService = ComplaintsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [complaints_repository_1.ComplaintsRepository])
], ComplaintsService);
//# sourceMappingURL=complaints.service.js.map