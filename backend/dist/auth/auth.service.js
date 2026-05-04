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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const users_repository_1 = require("../users/users.repository");
let AuthService = class AuthService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async login(dto) {
        const user = this.usersRepository.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid email or password');
        const passwordMatches = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatches)
            throw new common_1.UnauthorizedException('Invalid email or password');
        const token = (0, uuid_1.v4)();
        this.usersRepository.update(user.id, { authToken: token });
        const { password: _pw, authToken: _t, ...safeUser } = user;
        return { token, user: safeUser };
    }
    async register(dto) {
        const existing = this.usersRepository.findByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('An account with this email already exists');
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = this.usersRepository.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role: dto.role,
            phone: dto.phone,
            company: dto.company,
            hubId: dto.hubId,
            isActive: dto.role === 'customer',
        });
        const { password: _pw, ...safeUser } = user;
        return safeUser;
    }
    logout(token) {
        const user = this.usersRepository.findByToken(token);
        if (user) {
            this.usersRepository.update(user.id, { authToken: undefined });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], AuthService);
//# sourceMappingURL=auth.service.js.map