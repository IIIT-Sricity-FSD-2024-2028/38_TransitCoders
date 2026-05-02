# Backend Integration Guide

## Overview
SM's branch (`feature/dev4-sm-support-modules`) contains the full NestJS backend scaffold plus these modules: **Users, Tickets, Complaints, Feedback, Roles**.

## How to Integrate Your Module

### 1. Pull the branch
```bash
git fetch origin
git checkout feature/dev4-sm-support-modules
```

### 2. Add your module files
Follow the existing pattern — every module lives in `src/<module-name>/` with:
```
<module>.repository.ts   ← Map<string, IEntity> store, no logic
dto/                     ← class-validator DTOs
interfaces/              ← IEntity interface
<module>.service.ts      ← all business logic
<module>.controller.ts   ← routing only, single-line methods
<module>.module.ts       ← wire it together
```

### 3. Register your module in AppModule
Open `src/app.module.ts` and add your module to the `imports` array:
```typescript
import { YourModule } from './your-module/your.module';

@Module({
  imports: [
    UsersModule,
    TicketsModule,
    // ...existing modules
    YourModule,  // ← add here
  ],
})
```

### 4. Guards are ready — just import them
AuthGuard and RolesGuard are in `src/auth/guards/`. Use them like this:
```typescript
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/constants/roles.constant';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.HUB_MANAGER, Role.SUPER_USER)
@Get()
findAll(@CurrentUser() user: IUser) {
  return this.service.findAll(user);
}
```

### 5. Use the standard response wrapper
All controllers must return `IApiResponse<T>`:
```typescript
import type { IApiResponse } from '../common/interfaces/api-response.interface';

// Success
return { success: true, data: result };

// Error (throw instead — the global filter handles formatting)
throw new NotFoundException('Item not found');
```

### 6. If you need UsersRepository (e.g. for AuthModule)
`UsersModule` exports both `UsersService` and `UsersRepository`. Import `UsersModule` in your module:
```typescript
@Module({
  imports: [UsersModule],
  ...
})
```
Then inject normally:
```typescript
constructor(private readonly usersRepository: UsersRepository) {}
```

### 7. If you need cross-module access (e.g. OrdersModule needs UsersModule)
See `src/app.module.ts` comments and the implementation plan for the dependency graph. Keep imports minimal.

## Seed Data
Add your entity's seed block to `src/seed/seed.service.ts` inside `onModuleInit()`. The 5 system roles and 9 base users are already seeded. Available test credentials:
| Email | Password | Role |
|-------|----------|------|
| super@swifttrack.com | password123 | super_user |
| hm1@swifttrack.com | password123 | hub_manager |
| merchant1@example.com | password123 | merchant |
| agent1@swifttrack.com | password123 | delivery_agent |
| customer1@example.com | password123 | customer |

## Running Locally
```bash
cd backend
npm install
npm run start:dev
# API: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

## Role & Status Constants
Always import from `common/constants/` — never use raw strings:
```typescript
import { Role } from '../common/constants/roles.constant';
import { OrderStatus, VALID_TRANSITIONS } from '../common/constants/statuses.constant';
```

## Notes for VK (UsersRepository owner)
`src/users/users.repository.ts` is currently a stub with identical method signatures. When your authoritative implementation is ready, simply replace this file — `UsersService` and `AuthGuard` will work without any other changes.

## Frontend UI Integration (New Adapter Layer)
As part of connecting the static site logic to the NestJS APIs, a central adapter layer has been created in `front-end/js/api.js`. This allows the team to build feature UIs against real backend routes without hardcoding `fetch` everywhere.

### 1. `window.API` Adapter
All HTTP calls to the backend (`http://localhost:3001` or deployed URL) should route through the `API` object rather than raw `fetch()`. The adapter automatically injects the `x-auth-token` header if the user is authenticated. 

**Example Usage in your JS logic:**
```javascript
// Fetch shipments (Teammate component)
async function loadShipments() {
  try {
    const rawData = await window.API.shipments.getAll();
    renderShipments(rawData);
  } catch (error) {
    console.error("Backend failed, falling back to mock..", error);
  }
}
```

### 2. How to Add Your Endpoints (`front-end/js/api.js`)
If you build the Orders module API, you must expose it in `api.js`:
```javascript
  // ── Orders ──────────────────────────────────────────────────────────────
  orders: {
    async getAll() {
      const res = await apiFetch('/orders');
      return res.data;
    },
    async create(payload) {
      const res = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
      return res.data;
    }
  },
```

### 3. File Inclusion Setup
Ensure the updated script block operates in all of your HTML files so auth logic connects dynamically:

```html
    <!-- Insert before ui-global.js or your custom logic scripts -->
    <script src="../js/api.js"></script>
    <script src="../js/auth.js"></script>
    <script src="../assets/js/ui-global.js"></script>
```

Testing Note: The `window.API.auth` controller natively uses `/auth/login` and handles storing session payload on success. It gracefully falls back to `MockDB` / `StorageAPI` if the backend port isn't accessible, letting frontend developers still preview views standalone.
