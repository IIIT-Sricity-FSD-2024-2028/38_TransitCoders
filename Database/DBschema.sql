CREATE DATABASE transitcoders;

USE transitcoders;

CREATE TABLE users (
user_id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
phone VARCHAR(15),
password VARCHAR(255) NOT NULL,
role ENUM('customer','merchant','agent','employee','admin') NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
status ENUM('active','inactive')
);

CREATE TABLE login_history (
login_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
login_time DATETIME,
logout_time DATETIME,
ip_address VARCHAR(50),
FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE address (
address_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
street VARCHAR(255),
city VARCHAR(100),
state VARCHAR(100),
postal_code VARCHAR(20),
latitude DECIMAL(10,6),
longitude DECIMAL(10,6),
FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE orders (
order_id INT AUTO_INCREMENT PRIMARY KEY,
customer_id INT,
merchant_id INT,
order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
order_status VARCHAR(50),
FOREIGN KEY (customer_id) REFERENCES users(user_id),
FOREIGN KEY (merchant_id) REFERENCES users(user_id)
);

CREATE TABLE packages (
package_id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
weight DECIMAL(10,2),
lenght DECIMAL(10,2),
width DECIMAL(10,2),
height DECIMAL(10,2),
description VARCHAR(255),
FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE hubs (
hub_id INT AUTO_INCREMENT PRIMARY KEY,
hub_name VARCHAR(100),
location VARCHAR(255),
manager_id INT,
FOREIGN KEY (manager_id) REFERENCES users(user_id)
);

CREATE TABLE shipments (
shipment_id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
origin_hub INT,
destination_hub INT,
shipment_date DATETIME,
estimated_delivery DATETIME,
FOREIGN KEY (order_id) REFERENCES orders(order_id),
FOREIGN KEY (origin_hub) REFERENCES hubs(hub_id),
FOREIGN KEY (destination_hub) REFERENCES hubs(hub_id)
);

CREATE TABLE shipment_status (
status_id INT AUTO_INCREMENT PRIMARY KEY,
shipment_id INT,
status VARCHAR(50),
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
);

CREATE TABLE order_history (
history_id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
status VARCHAR(50),
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE pickup_details (
pickup_id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
requested_by INT,
pickup_time DATETIME,
pickup_status VARCHAR(50),
pickup_type ENUM('merchant','customer','employee'),
FOREIGN KEY (order_id) REFERENCES orders(order_id),
FOREIGN KEY (requested_by) REFERENCES users(user_id)
);

CREATE TABLE delivery_assignment (
assignment_id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
agent_id INT,
hub_id INT,
assigned_time DATETIME,
status VARCHAR(50),
FOREIGN KEY (order_id) REFERENCES orders(order_id),
FOREIGN KEY (agent_id) REFERENCES users(user_id),
FOREIGN KEY (hub_id) REFERENCES hubs(hub_id)
);

CREATE TABLE vehicle (
vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
agent_id INT,
vehicle_type VARCHAR(50),
vehicle_number VARCHAR(50),
capacity VARCHAR(50),
FOREIGN KEY (agent_id) REFERENCES users(user_id)
);

CREATE TABLE hub_transfer (
transfer_id INT AUTO_INCREMENT PRIMARY KEY,
shipment_id INT,
from_hub INT,
to_hub INT,
transfer_time DATETIME,
status VARCHAR(50),
FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id),
FOREIGN KEY (from_hub) REFERENCES hubs(hub_id),
FOREIGN KEY (to_hub) REFERENCES hubs(hub_id)
);

CREATE TABLE complaints (
complaint_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
order_id INT,
description TEXT,
status VARCHAR(50),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(user_id),
FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE feedback (
feedback_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
order_id INT,
rating INT,
comments TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(user_id),
FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE notifications (
notification_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
message TEXT,
status ENUM('sent','read','received'),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE tracking (
tracking_id INT AUTO_INCREMENT PRIMARY KEY,
shipment_id INT,
location VARCHAR(255),
latitude DECIMAL(10,6),
longitude DECIMAL(10,6),
tracked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
);

CREATE TABLE barcode (
barcode_id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
barcode_value VARCHAR(255),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE hub_performance_details (
performance_id INT AUTO_INCREMENT PRIMARY KEY,
hub_id INT NOT NULL,
report_date DATE,
total_shipments INT DEFAULT 0,
delivered_shipments INT DEFAULT 0,
delayed_shipments INT DEFAULT 0,
returned_shipments INT DEFAULT 0,
avg_processing_time DECIMAL(5,2),
performance_score DECIMAL(5,2),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (hub_id) REFERENCES hubs(hub_id)
);