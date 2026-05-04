"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const orders_controller_1 = require("./orders.controller");
const orders_service_1 = require("./orders.service");
const orders_repository_1 = require("./orders.repository");
const users_module_1 = require("../users/users.module");
const agents_module_1 = require("../agents/agents.module");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, (0, common_1.forwardRef)(() => agents_module_1.AgentsModule)],
        controllers: [orders_controller_1.OrdersController],
        providers: [orders_service_1.OrdersService, orders_repository_1.OrdersRepository],
        exports: [orders_service_1.OrdersService, orders_repository_1.OrdersRepository],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map