# SwiftTrack — Order Dispatch & Delivery Tracking System

**Course:** Full Stack Development (FSD)  
**Team:** 38_TransitCoders  
**Repository:** [IIIT-Sricity-FSD-2024-2028/38_TransitCoders](https://github.com/IIIT-Sricity-FSD-2024-2028/38_TransitCoders)



## 1. Project Overview

**SwiftTrack** is a centralized, multi-tenant logistics management and real-time delivery tracking platform designed to streamline dispatch operations between merchants, distribution hubs, delivery agents, end customers, and system administrators.

### Core System Actors
- **Merchant:** Registers shipments, selects service tiers (Standard, Express, Same-Day), calculates rates, generates barcode shipping labels, and monitors order status.
- **Hub Manager:** Oversees warehouse order queues, performs local agent assignment, manages inter-hub transit transfers, and audits hub throughput.
- **Delivery Agent:** Manages live delivery worklists, accepts shipments, verifies packages, records proof-of-delivery (POD) with photo uploads, and reports transit mishaps.
- **Customer:** Tracks package milestones in real time with interactive timeline visualization, logs grievances/complaints, and rates delivery experiences.
- **Admin (Super User):** Manages user accounts and approval queues, configures system and pricing parameters, resolves customer complaints, and audits financial/operational analytics.

---

## 2. Dependencies

The project is structured into two main applications: the **NestJS Backend** and the **React (Vite) Frontend**.

### Runtime Environment
- **Node.js:** v18.0.0 or higher (v20+ recommended for native `node:sqlite`).
- **npm:** v9.0.0 or higher.

### Backend (`back-end/package.json`)
- **Core Framework:** `@nestjs/common` (v11.0.1), `@nestjs/core` (v11.0.1), `@nestjs/platform-express` (v11.0.1)
- **Database & Persistence:** Native Node.js SQLite (`node:sqlite` DatabaseSync) with custom connection pooling (`SqlitePool`) and WAL (Write-Ahead Logging) mode.
- **Security & Validation:** `class-validator` (v0.15.1), `class-transformer` (v0.5.1), `bcrypt` (v6.0.0), `helmet` (v8.3.0), `@nestjs/throttler` (v6.5.0)
- **API Documentation:** `@nestjs/swagger` (v11.4.1), `swagger-ui-express` (v5.0.1)
- **Utilities:** `uuid` (v14.0.0), `winston` (v3.19.0), `@nestjs/config` (v4.0.4)
- **Dev & Testing:** `jest` (v30.0.0), `ts-jest` (v29.2.5), `supertest` (v7.0.0), `typescript` (v5.7.3)

### Frontend (`frontend-react/package.json`)
- **Core Library:** `react` (v19.2.8), `react-dom` (v19.2.8)
- **Build Tool:** `vite` (v8.3.0), `@vitejs/plugin-react` (v6.1.1)
- **Routing:** `react-router-dom` (v7.18.4)
- **Styling:** `tailwindcss` (v4.3.3), `@tailwindcss/postcss` (v4.3.3), `postcss` (v8.5.28), `autoprefixer` (v10.6.1)
- **Icons & Visualization:** `bootstrap-icons` (v1.13.2), `react-bootstrap-icons` (v1.11.6), `recharts` (v3.10.1)

---

## 3. Project Setup

### Directory Structure Overview
```text
38_TransitCoders/
├── back-end/               # NestJS REST API and SQLite Database
│   ├── src/                # Modules: auth, users, orders, hubs, agents, complaints, feedback, etc.
│   ├── data/               # Persistent SQLite database file (swifttrack.db)
│   ├── test/               # E2E test suites
│   └── package.json        # Backend dependencies & scripts
├── frontend-react/         # React SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── features/       # Role-specific modules: admin, hub-manager, merchant, agent, customer
│   │   ├── components/     # Reusable layout and role-specific UI components
│   │   ├── services/       # Centralized API service layer (api.js, customerService.js, merchantHelpers.js)
│   │   └── App.jsx         # Master routing and role-based redirects
│   └── package.json        # Frontend dependencies & scripts
├── front-end/              # Foundational HTML/JS templates (Legacy / Reference)
└── README.md               # Project documentation, setup guide, and contributions
```

### Environment Configuration
The backend and frontend are pre-configured with zero-friction development defaults:
- **Backend Port:** `3001` (configurable via `PORT` environment variable).
- **Frontend Port:** `5173` (Vite dev server default).
- **API Base URL:** Automatically points to `http://localhost:3001` (can be overridden via `VITE_API_BASE_URL` in `frontend-react/.env`).

---

## 4. Execution Steps

### Step 1: Extract or Clone the Project
```bash
git clone https://github.com/IIIT-Sricity-FSD-2024-2028/38_TransitCoders.git
cd 38_TransitCoders
```

### Step 2: Install and Start the Backend Server
Open a terminal in the root directory:
```bash
cd back-end
npm install
npm run start:dev
```
- **Backend API Server:** `http://localhost:3001`
- **Interactive Swagger Documentation:** `http://localhost:3001/api/docs`
- *Note:* The SQLite database (`data/swifttrack.db`) is automatically initialized and seeded with sample users, hubs, orders, and pricing configurations on first launch.

### Step 3: Install and Start the Frontend Application
Open a second terminal in the root directory:
```bash
cd frontend-react
npm install
npm run dev
```
- **React Frontend Application:** `http://localhost:5173`
- *Note:* The application will automatically connect to the backend running on port 3001.

### (Old) Static Frontend
To preview the vanilla HTML/CSS/JS version:
```bash
npx -y live-server ./front-end
```
- Runs at `http://localhost:8080`.

---

## 5. Testing Instructions

### 1. Automated Backend Unit & Integration Tests
Run unit tests for controllers and service layers:
```bash
cd back-end
npm run test
```
Run end-to-end (E2E) integration tests:
```bash
npm run test:e2e
```
Generate test coverage reports:
```bash
npm run test:cov
```

### 2. Interactive API Testing (Swagger UI)
1. Open your browser and navigate to: **`http://localhost:3001/api/docs`**
2. Use the `POST /auth/login` endpoint with any test account (e.g. `customer1@example.com` / `password123`) to obtain an `x-auth-token`.
3. Click the **Authorize** button at the top right of the Swagger UI and paste the token.
4. Test key endpoints:
   - `GET /orders` — Retrieve list of scoped orders.
   - `POST /complaints` — File a new customer ticket (`orderId`, `type`, `description`, `priority`).
   - `POST /feedback` — Submit a service rating (1–5) and review comment.
   - `POST /orders/:id/mishap` — Report an agent delivery issue (`vehicle_breakdown`, `package_damaged`, etc.).


## 6. Test Credentials

All pre-seeded test accounts share the uniform password: **`password123`**

| Role | Name | Email | Default Dashboard Route |
| :--- | :--- | :--- | :--- |
| **Super User (Admin)** | Super Admin | `super@swifttrack.com` | `http://localhost:5173/admin/dashboard` |
| **Hub Manager** | HM Chennai | `hm_chennai@swifttrack.com` | `http://localhost:5173/hub/dashboard` |
| **Hub Manager** | HM Mumbai | `hm_mumbai@swifttrack.com` | `http://localhost:5173/hub/dashboard` |
| **Hub Manager** | HM Delhi | `hm_delhi@swifttrack.com` | `http://localhost:5173/hub/dashboard` |
| **Hub Manager** | HM Bengaluru | `hm_bengaluru@swifttrack.com` | `http://localhost:5173/hub/dashboard` |
| **Hub Manager** | HM Hyderabad | `hm_hyderabad@swifttrack.com` | `http://localhost:5173/hub/dashboard` |
| **Merchant** | Merchant One | `merchant1@example.com` | `http://localhost:5173/merchant/dashboard` |
| **Merchant** | Merchant Two | `merchant2@example.com` | `http://localhost:5173/merchant/dashboard` |
| **Delivery Agent** | Agent One | `agent1@swifttrack.com` | `http://localhost:5173/agent/dashboard` |
| **Delivery Agent** | Agent Two | `agent2@swifttrack.com` | `http://localhost:5173/agent/dashboard` |
| **Customer** | Customer One | `customer1@example.com` | `http://localhost:5173/customer/dashboard` |
| **Customer** | Customer Two | `customer2@example.com` | `http://localhost:5173/customer/dashboard` |

---

## 7. Individual Contribution

### Details of Individual Contributions and Developed/Modified Files

#### 1. Vinod Katevarapu (S20240010256)
- `frontend-react/src/features/hub-manager/` — Developed 5 Hub Manager pages: Dashboard, Order Queue, Dispatch, Hub Transfer, and Reports. Implemented reusable order and statistics cards, 3 workflow modals for agent assignment, order details, and hub transfers, and CSS styling for the module.
- `frontend-react/src/components/layout/Topbar.jsx` — Implemented the shared top bar component.
- `frontend-react/src/App.jsx` — Integrated login functionality, role-based redirects, and Hub Manager routing.
- `back-end/src/orders/` — Improved order validation, hub transfer rules, and transaction-aware order creation.

#### 2. Mohammad Shazil A M (S20240010144)
- `frontend-react/src/` & `App.jsx` — Set up the foundational React frontend architecture and integrated Admin and landing page routing.
- `frontend-react/src/features/admin/` — Developed the Admin pages (dashboard, user/complaint management, reports, financial analytics, feedback review, system configuration) and the nested routing layout (`AdminLayout.jsx`).
- `frontend-react/src/components/admin/` — Developed reusable Admin components including AdminTable, Add/Edit modals, and Recent Activity cards, as well as the `KPICard` in `frontend-react/src/components/shared/`.
- `frontend-react/src/components/layout/` — Implemented `Sidebar.jsx`.
- `frontend-react/src/services/api.js` — Re-implemented the previous API file with React exports.
- `frontend-react/src/features/LandingPage.*` — Created the public SwiftTrack landing page.

#### 3. Prasanna Raja R (S20240010191)
- `frontend-react/src/features/merchant/` — Developed 6 Merchant pages: Dashboard, Book Shipment, My Orders, Track Shipment, Analytics Report, and Support Center. Implemented order creation forms, live price calculation, order search and status filtering, and live data fetching using `useState` and `useEffect`.
- `frontend-react/src/components/merchant/` — Implemented reusable merchant components including `ShippingLabelModal.jsx` to view and print barcode shipping labels, `OrderStatusBadge.jsx` for status badges, and `StatCard.jsx`.
- `frontend-react/src/services/merchantHelpers.js` — Connected the merchant pages to backend database endpoints (`/orders`, `/hubs`, `/pricing/config`) and removed all hardcoded data so the app uses real database records.
- `frontend-react/src/features/merchant/MerchantLayout.jsx` — Implemented the merchant layout with sidebar navigation using simple `<Link>` tags and `<Outlet />`.

#### 4. Jay Suriya R (S20240010093)
- `frontend-react/src/ & App.jsx` — Integrated the Delivery Agent routing architecture, child navigation paths, and role-based route guards.
- `frontend-react/src/features/agent/` — Developed the complete Delivery Agent portal pages (`AgentDashboard`, `AgentWorklist`, `DeliveryHistory`, `ReportIssue`, `AgentProfile`) and the nested layout shell with live availability toggling and navigation (`AgentLayout.jsx`).
- `frontend-react/src/components/agent/` — Developed reusable, interactive Agent components including `OrderCard`, `AcceptDeliveryModal`, `ConfirmDeliveryModal` (proof-of-delivery confirmation), `RouteModal` (destination & route view), and `AgentStatusBadge`.
- `frontend-react/src/services/api.js` — Connected Delivery Agent REST APIs for worklist fetching, order state updates (`Picked Up`, `Out for Delivery`, `Delivered`), mishap/exception reporting, and dynamic agent profile data.

#### 5. Shreeshanth R (S20240010224)
- `frontend-react/src/ & App.jsx` — Integrated the Customer portal routing architecture, child navigation routes, and role-based route layout nesting.
- `frontend-react/src/features/customer/` — Developed the complete Customer portal pages (`CustomerDashboard`, `CustomerOrders`, `CustomerTracking`, `CustomerSupport`) and the responsive nested layout shell (`CustomerLayout.jsx`).
- `frontend-react/src/components/customer/` — Developed reusable, interactive Customer components including `LiveTrackingCard`, `OrderDetailsDrawer` (slide-over shipment breakdown & tracking timeline), `RecentActivity`, `StarRating`, `StatCard`, `StatusBadge`, and `Toast` notifications.
- `frontend-react/src/services/customerService.js` — Built the dedicated customer service layer connecting live backend APIs for order listing, real-time tracking, support ticket/complaint filing, and service rating/feedback submission with resilient fallback handling.

---

## 🎨 Design Reference
- **Figma Design Workflows:** [SwiftTrack Final Workflows](https://www.figma.com/design/o6Ei1pGX1NXx7uaERlQahx/final-workflows?node-id=0-1&t=JNJgz5QKfOAEENl1-1)
