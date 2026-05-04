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
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const users_repository_1 = require("../users/users.repository");
const roles_repository_1 = require("../roles/roles.repository");
const agents_repository_1 = require("../agents/agents.repository");
let SeedService = class SeedService {
    usersRepository;
    rolesRepository;
    agentsRepository;
    constructor(usersRepository, rolesRepository, agentsRepository) {
        this.usersRepository = usersRepository;
        this.rolesRepository = rolesRepository;
        this.agentsRepository = agentsRepository;
    }
    async onModuleInit() {
        await this.seedRoles();
        await this.seedUsers();
    }
    seedRoles() {
        const roles = [
            {
                roleId: 'super_user',
                name: 'Super User',
                description: 'Full system access — can manage all entities',
                isSystem: true,
                permissions: {
                    view_users: true,
                    create_users: true,
                    update_users: true,
                    delete_users: true,
                    approve_users: true,
                    view_orders: true,
                    create_orders: true,
                    update_orders: true,
                    delete_orders: true,
                    assign_agents: true,
                    view_shipments: true,
                    view_hubs: true,
                    create_hubs: true,
                    update_hubs: true,
                    view_agents: true,
                    view_tickets: true,
                    update_tickets: true,
                    view_complaints: true,
                    update_complaints: true,
                    view_feedback: true,
                    update_feedback: true,
                    view_roles: true,
                    update_roles: true,
                },
            },
            {
                roleId: 'hub_manager',
                name: 'Hub Manager',
                description: 'Manages hub operations, orders, and agents',
                isSystem: true,
                permissions: {
                    view_users: true,
                    create_users: true,
                    update_users: true,
                    delete_users: false,
                    approve_users: true,
                    view_orders: true,
                    create_orders: false,
                    update_orders: true,
                    delete_orders: false,
                    assign_agents: true,
                    view_shipments: false,
                    view_hubs: true,
                    create_hubs: false,
                    update_hubs: false,
                    view_agents: true,
                    view_tickets: false,
                    update_tickets: false,
                    view_complaints: false,
                    update_complaints: false,
                    view_feedback: false,
                    update_feedback: false,
                    view_roles: false,
                    update_roles: false,
                },
            },
            {
                roleId: 'merchant',
                name: 'Merchant',
                description: 'Creates orders and shipments; manages tickets',
                isSystem: true,
                permissions: {
                    view_users: false,
                    create_users: false,
                    update_users: false,
                    delete_users: false,
                    approve_users: false,
                    view_orders: true,
                    create_orders: true,
                    update_orders: true,
                    delete_orders: true,
                    assign_agents: false,
                    view_shipments: true,
                    view_hubs: false,
                    create_hubs: false,
                    update_hubs: false,
                    view_agents: false,
                    view_tickets: true,
                    update_tickets: true,
                    view_complaints: false,
                    update_complaints: false,
                    view_feedback: false,
                    update_feedback: false,
                    view_roles: false,
                    update_roles: false,
                },
            },
            {
                roleId: 'delivery_agent',
                name: 'Delivery Agent',
                description: 'Views assigned orders and updates availability',
                isSystem: true,
                permissions: {
                    view_users: false,
                    create_users: false,
                    update_users: false,
                    delete_users: false,
                    approve_users: false,
                    view_orders: true,
                    create_orders: false,
                    update_orders: false,
                    delete_orders: false,
                    assign_agents: false,
                    view_shipments: false,
                    view_hubs: false,
                    create_hubs: false,
                    update_hubs: false,
                    view_agents: true,
                    view_tickets: false,
                    update_tickets: false,
                    view_complaints: false,
                    update_complaints: false,
                    view_feedback: false,
                    update_feedback: false,
                    view_roles: false,
                    update_roles: false,
                },
            },
            {
                roleId: 'customer',
                name: 'Customer',
                description: 'Views own orders; submits complaints and feedback',
                isSystem: true,
                permissions: {
                    view_users: false,
                    create_users: false,
                    update_users: false,
                    delete_users: false,
                    approve_users: false,
                    view_orders: true,
                    create_orders: false,
                    update_orders: false,
                    delete_orders: false,
                    assign_agents: false,
                    view_shipments: false,
                    view_hubs: false,
                    create_hubs: false,
                    update_hubs: false,
                    view_agents: false,
                    view_tickets: false,
                    update_tickets: false,
                    view_complaints: true,
                    update_complaints: false,
                    view_feedback: true,
                    update_feedback: false,
                    view_roles: false,
                    update_roles: false,
                },
            },
        ];
        roles.forEach((r) => this.rolesRepository.create(r));
        console.log('✅ Seeded 5 system roles');
    }
    async seedUsers() {
        const hash = (pw) => bcrypt.hash(pw, 10);
        const users = [
            {
                name: 'Super Admin',
                email: 'super@swifttrack.com',
                password: await hash('password123'),
                role: 'super_user',
                isActive: true,
            },
            {
                name: 'Hub Manager Delhi',
                email: 'hm1@swifttrack.com',
                password: await hash('password123'),
                role: 'hub_manager',
                hubId: 'H001',
                isActive: true,
            },
            {
                name: 'Hub Manager Mumbai',
                email: 'hm2@swifttrack.com',
                password: await hash('password123'),
                role: 'hub_manager',
                hubId: 'H002',
                isActive: true,
            },
            {
                name: 'Merchant One',
                email: 'merchant1@example.com',
                password: await hash('password123'),
                role: 'merchant',
                company: 'Acme Corp',
                isActive: true,
            },
            {
                name: 'Merchant Two',
                email: 'merchant2@example.com',
                password: await hash('password123'),
                role: 'merchant',
                company: 'Beta Goods',
                isActive: true,
            },
            {
                name: 'Agent One',
                email: 'agent1@swifttrack.com',
                password: await hash('password123'),
                role: 'delivery_agent',
                hubId: 'H001',
                isActive: true,
            },
            {
                name: 'Agent Two',
                email: 'agent2@swifttrack.com',
                password: await hash('password123'),
                role: 'delivery_agent',
                hubId: 'H002',
                isActive: true,
            },
            {
                name: 'Customer One',
                email: 'customer1@example.com',
                password: await hash('password123'),
                role: 'customer',
                isActive: true,
            },
            {
                name: 'Customer Two',
                email: 'customer2@example.com',
                password: await hash('password123'),
                role: 'customer',
                isActive: true,
            },
        ];
        const createdUsers = users.map((u) => this.usersRepository.create(u));
        createdUsers.forEach(u => {
            if (u.role === 'delivery_agent') {
                this.agentsRepository.create({
                    userId: u.id,
                    hubId: u.hubId,
                    availabilityStatus: 'Available',
                    currentTasksCount: 0
                });
            }
        });
        console.log('✅ Seeded 9 users');
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        roles_repository_1.RolesRepository,
        agents_repository_1.AgentsRepository])
], SeedService);
//# sourceMappingURL=seed.service.js.map