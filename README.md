# Order Dispatch & Delivery Tracking System

## Problem Statement

Logistics and delivery operations involve multiple roles such as merchants, hub managers, delivery agents, customers, and administrators. In many real-world scenarios, these processes are handled manually or across disconnected systems, leading to delays, lack of transparency, and operational inefficiencies.

The objective of this project is to study real-world dispatch and delivery workflows and design a system that models these processes clearly. The system focuses on order management, dispatch operations, delivery execution, shipment tracking, exception handling, and system administration.

This repository represents the Sprint-0 work, which includes understanding the domain, identifying actors, and defining core use cases and workflows.

---

## Objectives

- Understand real-world logistics workflows and terminology  
- Identify key actors and their responsibilities  
- Model end-to-end workflows from order creation to delivery  
- Capture business rules, constraints, and exception scenarios  
- Provide a foundation for system design and implementation  

---

## Identified Actors

- *Merchant* – Creates and manages delivery orders  
- *Hub Manager* – Controls dispatch and operational activities  
- *Delivery Agent* – Executes deliveries and updates shipment status  
- *Customer* – Tracks shipments and provides feedback  
- *Admin* – Manages system configuration and security  

---

## Core Use Cases and Features

### 1. Order Management (Merchant)

Handles creation and management of delivery orders.

- Create new order  
- Edit or cancel order  
- Schedule pickup  
- Enter shipment details  
- Generate tracking ID  
- View order history  

---

### 2. Dispatch & Assignment Management (Hub Manager)

Controls dispatch operations and assignment of delivery agents.

- View pending orders  
- Assign delivery agent  
- Transfer order to another hub  
- Update shipment details  

---

### 3. Delivery Execution (Delivery Agent)

Performs physical delivery and updates system status.

- View assigned deliveries  
- Scan tracking code  
- Update delivery status (In Transit / Delivered / Failed)  
- Upload proof of delivery  

---

### 4. Exception & Return Handling (Delivery Agent, Hub Manager)

Manages non-normal delivery scenarios.

- Report delivery issues  
- Handle failed delivery  
- Reschedule delivery  
- Process return shipments  

---

### 5. Shipment Tracking & Notification (Customer, Merchant)

Provides visibility and communication about shipment progress.

- Track shipment using tracking ID  
- View delivery status  
- Receive notifications  
- Confirm delivery  

---

### 6. Feedback & Complaint Management (Customer, Hub Manager)

Handles customer feedback and service complaints.

- Raise complaints  
- Submit feedback  
- Review and resolve complaints  

---

### 7. Reporting & Monitoring (Hub Manager, Admin)

Supports operational and performance monitoring.

- Generate operational reports  
- View dashboards  
- Monitor delivery success and failure  
- Audit activities  

---

### 8. System Administration & Security (Admin)

Controls system configuration and access.

- Manage users and roles  
- Configure business rules  
- View system logs  
- Manage access control  
- System configuration  

---

## Actor to Use Case Mapping

*Merchant*
- Order Management  
- Shipment Tracking & Notification  

*Hub Manager*
- Dispatch & Assignment Management  
- Exception & Return Handling  
- Feedback & Complaint Management  
- Reporting & Monitoring  

*Delivery Agent*
- Delivery Execution  
- Exception & Return Handling  

*Customer*
- Shipment Tracking & Notification  
- Feedback & Complaint Management  

*Admin*
- System Administration & Security  
- Reporting & Monitoring  

---

## Project Scope (Sprint-0)

This sprint focuses on:

- Domain understanding  
- Actor identification  
- Use case definition  
- Activity and sequence diagram modeling  
- Domain expert interaction documentation  

The project does not focus on UI design or technology selection in this stage.  
It emphasizes clarity of workflows, responsibilities, and system behavior.

---

## Notes

- This project is based on real-world logistics and dispatch workflows.  
- The goal is to model how work is actually performed in practice.  
- The system design will be refined in later sprints based on feedback and validation.

---