# Order Dispatch & Delivery Tracking System

## Project Overview

This project is a centralized logistics management system designed to streamline the workflow between merchants, warehouse hubs, and delivery personnel. The platform focuses on automating order dispatching and providing real-time tracking for end customers.

---

## Problem Statement

Traditional logistics often suffer from fragmented communication and manual dispatching errors. This platform addresses the lack of real-time visibility in the delivery chain by digitizing the lifecycle of an order from "Merchant Creation" to "Last-Mile Delivery," ensuring transparency and efficiency for all stakeholders.

---

## Identified Actors

- `Merchant`        – Creates and manages delivery orders  
- `Hub Manager`     – Controls dispatch and operational activities  
- `Delivery Agent`  – Executes deliveries and updates shipment status  
- `Customer`        – Tracks shipments and provides feedback  
- `Admin`           – Manages system configuration and security  

---

# Implemented Features – Actor wise

## Merchant 

- Create, edit, and cancel delivery orders  
- Enter product and package details  
- Calculate delivery price and ETA  
- Track shipment status end-to-end  
- Cancel shipment before dispatch  
- View order history with analytics and charts  
- Support ticket creation and management  

---

## Hub Manager

- Dashboard with hub-level KPIs  
- Order queue management and dispatch  
- Agent assignment and reassignment  
- Inter-hub transfer management  
- Operational reports and analytics  
- Update shipment status and details  

---

## Delivery Agent 

- View assigned deliveries (worklist)  
- Delivery acceptance workflow  
- Package verification (barcode / details)  
- Delivery confirmation with proof-of-delivery  
- Report mishaps or delivery issues  
- View delivery history  
- Profile management and availability toggle  

---

## Customer

- Dashboard with active order overview  
- Order listing and detail view  
- Track delivery status in real time with timeline  
- Complaints submission  
- Feedback and ratings  

---

## Admin (Super User)

- User management (CRUD, approval workflow)  
- Role and permissions management (5 system roles with granular permissions)  
- System configuration  
- Database management overview  
- Complaints management and resolution  
- Feedback review and actioning  
- Operations monitoring  
- Reports and analytics  
- Security logs and access control  

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Backend** | NestJS (TypeScript) on Node.js |
| **Data Store** | In-memory repositories |
| **Auth** | UUID token-based (`x-auth-token`) with bcrypt |
| **API Docs** | Swagger UI at `/api/docs` |

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** (included with Node.js)

### 1. Clone the Repository

```bash
git clone -b toTest --single-branch https://github.com/IIIT-Sricity-FSD-2024-2028/38_TransitCoders.git
cd 38_TransitCoders
```

### 2. Start the Backend

```bash
cd back-end
npm install
npm run start:dev
```

- **API:** `http://localhost:3001`
- **Swagger Docs:** `http://localhost:3001/api/docs`

### 3. Start the Frontend

```bash
npx -y live-server ./front-end
```

Opens at `http://localhost:8080`.

> **Note:** The backend uses in-memory storage. Data resets on restart. Clear `localStorage` and re-login if you see a token error.

---

## Test Credentials

All accounts use password: **`password123`**

| Role | Name | Email |
|---|---|---|
| Super User | Super Admin | `super@swifttrack.com` |
| Hub Manager | HM Chennai | `hm_chennai@swifttrack.com` |
| Hub Manager | HM Mumbai | `hm_mumbai@swifttrack.com` |
| Hub Manager | HM Delhi | `hm_delhi@swifttrack.com` |
| Hub Manager | HM Bengaluru | `hm_bengaluru@swifttrack.com` |
| Hub Manager | HM Kolkata | `hm_kolkata@swifttrack.com` |
| Hub Manager | HM Hyderabad | `hm_hyderabad@swifttrack.com` |
| Merchant | Merchant One | `merchant1@example.com` |
| Merchant | Merchant Two | `merchant2@example.com` |
| Delivery Agent | Agent One | `agent1@swifttrack.com` |
| Delivery Agent | Agent Two | `agent2@swifttrack.com` |
| Customer | Customer One | `customer1@example.com` |
| Customer | Customer Two | `customer2@example.com` |

---

## Figma Design

- https://www.figma.com/design/o6Ei1pGX1NXx7uaERlQahx/final-workflows?node-id=0-1&t=JNJgz5QKfOAEENl1-1

---

## Team Members

- Vinod Katevarapu
- Jay Suriya R
- Mohammad Shazil A M
- Shreesaanth R
- Prasanna Raja R
