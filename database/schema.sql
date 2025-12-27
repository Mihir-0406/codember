-- GearGuard Database Schema
-- Drop existing database if exists
DROP DATABASE IF EXISTS gearguard;
CREATE DATABASE gearguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gearguard;

-- Users table with role-based access
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'technician', 'normal_user') NOT NULL DEFAULT 'normal_user',
    avatar_initials VARCHAR(3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- Maintenance Teams table
CREATE TABLE maintenance_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- Team Members junction table (many-to-many: users <-> teams)
CREATE TABLE team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES maintenance_teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_member (team_id, user_id),
    INDEX idx_team (team_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- Equipment table with all required fields
CREATE TABLE equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    assigned_employee VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    physical_location VARCHAR(200),
    default_maintenance_team_id INT,
    default_technician_id INT,
    status ENUM('Active', 'Scrapped') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (default_maintenance_team_id) REFERENCES maintenance_teams(id) ON DELETE SET NULL,
    FOREIGN KEY (default_technician_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_serial (serial_number),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_department (department)
) ENGINE=InnoDB;

-- Maintenance Requests table with strict state flow
CREATE TABLE maintenance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    request_type ENUM('Corrective', 'Preventive') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    state ENUM('New', 'In Progress', 'Repaired', 'Scrap') NOT NULL DEFAULT 'New',
    maintenance_team_id INT,
    assigned_technician_id INT,
    scheduled_date DATE,
    started_at DATETIME,
    completed_at DATETIME,
    duration_minutes INT,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (maintenance_team_id) REFERENCES maintenance_teams(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_equipment (equipment_id),
    INDEX idx_state (state),
    INDEX idx_type (request_type),
    INDEX idx_scheduled (scheduled_date),
    INDEX idx_team (maintenance_team_id),
    INDEX idx_technician (assigned_technician_id)
) ENGINE=InnoDB;

-- Insert default admin user
-- Password: admin123 (hashed with PASSWORD_DEFAULT)
INSERT INTO users (username, email, password, full_name, role, avatar_initials) VALUES
('admin', 'admin@gearguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', 'ADM'),
('manager1', 'manager@gearguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Manager', 'manager', 'JM'),
('tech1', 'tech1@gearguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Technician', 'technician', 'MT'),
('tech2', 'tech2@gearguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Smith', 'technician', 'SS'),
('user1', 'user@gearguard.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Regular User', 'normal_user', 'RU');

-- Insert sample maintenance teams
INSERT INTO maintenance_teams (name, description) VALUES
('Electrical Team', 'Handles all electrical equipment and systems'),
('Mechanical Team', 'Responsible for mechanical equipment maintenance'),
('IT Support Team', 'Manages computer and network equipment'),
('HVAC Team', 'Heating, ventilation, and air conditioning specialists');

-- Assign technicians to teams
INSERT INTO team_members (team_id, user_id) VALUES
(1, 3), -- tech1 to Electrical Team
(2, 3), -- tech1 to Mechanical Team
(2, 4), -- tech2 to Mechanical Team
(3, 4); -- tech2 to IT Support Team

-- Insert sample equipment
INSERT INTO equipment (name, serial_number, category, department, assigned_employee, purchase_date, warranty_expiry, physical_location, default_maintenance_team_id, default_technician_id, status) VALUES
('Industrial Compressor A1', 'COMP-2023-001', 'Machinery', 'Production', 'John Doe', '2023-01-15', '2025-01-15', 'Building A, Floor 1', 2, 3, 'Active'),
('Cooling System Unit B', 'COOL-2023-045', 'HVAC', 'Facility', 'Jane Smith', '2023-03-20', '2026-03-20', 'Building B, Rooftop', 4, 4, 'Active'),
('CNC Machine X200', 'CNC-2022-089', 'Machinery', 'Manufacturing', 'Bob Wilson', '2022-11-10', '2024-11-10', 'Building C, Workshop', 2, 3, 'Active'),
('Server Rack Main', 'SRV-2023-012', 'IT Equipment', 'IT Department', 'Alice Johnson', '2023-05-05', '2028-05-05', 'Data Center Room 1', 3, 4, 'Active'),
('Generator Unit 5', 'GEN-2021-078', 'Power Systems', 'Facility', 'Tom Brown', '2021-08-12', '2024-08-12', 'Building A, Basement', 1, 3, 'Active');

-- Insert sample maintenance requests
INSERT INTO maintenance_requests (equipment_id, request_type, title, description, priority, state, maintenance_team_id, assigned_technician_id, scheduled_date, created_by) VALUES
(1, 'Corrective', 'Compressor making unusual noise', 'The compressor is producing a grinding noise during operation', 'High', 'New', 2, 3, NULL, 2),
(2, 'Preventive', 'Quarterly HVAC inspection', 'Regular quarterly maintenance check for cooling system', 'Medium', 'New', 4, 4, '2025-01-15', 2),
(3, 'Preventive', 'Monthly CNC calibration', 'Standard monthly calibration and inspection', 'Medium', 'In Progress', 2, 3, '2025-01-10', 2),
(4, 'Corrective', 'Network connectivity issues', 'Server rack experiencing intermittent network drops', 'Critical', 'New', 3, 4, NULL, 2),
(5, 'Preventive', 'Generator load test', 'Annual load testing as per manufacturer guidelines', 'Medium', 'New', 1, 3, '2025-02-01', 2);
