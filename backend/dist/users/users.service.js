"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const users_repository_1 = require("./users.repository");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    sanitize(user) {
        const { password: _pw, authToken: _t, ...safe } = user;
        return safe;
    }
    findAll() {
        return this.usersRepository.findAll().map(u => this.sanitize(u));
    }
    findById(id) {
        const user = this.usersRepository.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.sanitize(user);
    }
    async create(dto) {
        const existing = this.usersRepository.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        return this.sanitize(this.usersRepository.create({
            ...dto,
            password: hashedPassword,
            isActive: false,
        }));
    }
    async update(id, dto) {
        this.findById(id);
        const changes = { ...dto };
        if (dto.password) {
            changes.password = await bcrypt.hash(dto.password, 10);
        }
        return this.sanitize(this.usersRepository.update(id, changes));
    }
    delete(id, requesterId) {
        if (id === requesterId) {
            throw new common_1.BadRequestException('You cannot delete your own account');
        }
        this.findById(id);
        this.usersRepository.delete(id);
    }
    approve(id) {
        const user = this.usersRepository.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.isActive) {
            throw new common_1.BadRequestException('User is already active');
        }
        return this.sanitize(this.usersRepository.update(id, { isActive: true }));
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map