<?php
require_once __DIR__ . '/../config/database.php';

/**
 * Equipment Model
 * Handles all equipment-related database operations
 */
class Equipment {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }
    
    /**
     * Create new equipment
     */
    public function create($data) {
        $sql = "INSERT INTO equipment (name, serial_number, category, department, assigned_employee, 
                purchase_date, warranty_expiry, physical_location, default_maintenance_team_id, 
                default_technician_id, status) 
                VALUES (:name, :serial_number, :category, :department, :assigned_employee, 
                :purchase_date, :warranty_expiry, :physical_location, :team_id, :technician_id, :status)";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':serial_number', $data['serial_number']);
            $stmt->bindParam(':category', $data['category']);
            $stmt->bindParam(':department', $data['department']);
            $stmt->bindParam(':assigned_employee', $data['assigned_employee']);
            $stmt->bindParam(':purchase_date', $data['purchase_date']);
            $stmt->bindParam(':warranty_expiry', $data['warranty_expiry']);
            $stmt->bindParam(':physical_location', $data['physical_location']);
            $stmt->bindParam(':team_id', $data['default_maintenance_team_id']);
            $stmt->bindParam(':technician_id', $data['default_technician_id']);
            $stmt->bindParam(':status', $data['status']);
            
            $stmt->execute();
            return $this->conn->lastInsertId();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get equipment by ID with team and technician details
     */
    public function getById($id) {
        $sql = "SELECT e.*, 
                mt.name as team_name, 
                u.full_name as technician_name
                FROM equipment e
                LEFT JOIN maintenance_teams mt ON e.default_maintenance_team_id = mt.id
                LEFT JOIN users u ON e.default_technician_id = u.id
                WHERE e.id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            return $stmt->fetch();
        } catch(PDOException $e) {
            return null;
        }
    }
    
    /**
     * Get all equipment with filters
     */
    public function getAll($filters = []) {
        $sql = "SELECT e.*, 
                mt.name as team_name, 
                u.full_name as technician_name
                FROM equipment e
                LEFT JOIN maintenance_teams mt ON e.default_maintenance_team_id = mt.id
                LEFT JOIN users u ON e.default_technician_id = u.id
                WHERE 1=1";
        
        // Apply filters
        if (!empty($filters['status'])) {
            $sql .= " AND e.status = :status";
        }
        if (!empty($filters['category'])) {
            $sql .= " AND e.category = :category";
        }
        if (!empty($filters['department'])) {
            $sql .= " AND e.department = :department";
        }
        
        $sql .= " ORDER BY e.name ASC";
        
        try {
            $stmt = $this->conn->prepare($sql);
            
            if (!empty($filters['status'])) {
                $stmt->bindParam(':status', $filters['status']);
            }
            if (!empty($filters['category'])) {
                $stmt->bindParam(':category', $filters['category']);
            }
            if (!empty($filters['department'])) {
                $stmt->bindParam(':department', $filters['department']);
            }
            
            $stmt->execute();
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Update equipment
     */
    public function update($id, $data) {
        $sql = "UPDATE equipment SET 
                name = :name, 
                serial_number = :serial_number, 
                category = :category, 
                department = :department, 
                assigned_employee = :assigned_employee,
                purchase_date = :purchase_date, 
                warranty_expiry = :warranty_expiry, 
                physical_location = :physical_location,
                default_maintenance_team_id = :team_id, 
                default_technician_id = :technician_id, 
                status = :status
                WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':serial_number', $data['serial_number']);
            $stmt->bindParam(':category', $data['category']);
            $stmt->bindParam(':department', $data['department']);
            $stmt->bindParam(':assigned_employee', $data['assigned_employee']);
            $stmt->bindParam(':purchase_date', $data['purchase_date']);
            $stmt->bindParam(':warranty_expiry', $data['warranty_expiry']);
            $stmt->bindParam(':physical_location', $data['physical_location']);
            $stmt->bindParam(':team_id', $data['default_maintenance_team_id']);
            $stmt->bindParam(':technician_id', $data['default_technician_id']);
            $stmt->bindParam(':status', $data['status']);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Delete equipment
     */
    public function delete($id) {
        $sql = "DELETE FROM equipment WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Mark equipment as scrapped
     */
    public function markAsScrapped($id) {
        $sql = "UPDATE equipment SET status = 'Scrapped' WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Check if serial number exists
     */
    public function serialNumberExists($serial_number, $exclude_id = null) {
        $sql = "SELECT id FROM equipment WHERE serial_number = :serial_number";
        if ($exclude_id) {
            $sql .= " AND id != :exclude_id";
        }
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':serial_number', $serial_number);
            if ($exclude_id) {
                $stmt->bindParam(':exclude_id', $exclude_id);
            }
            $stmt->execute();
            
            return $stmt->rowCount() > 0;
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get distinct categories
     */
    public function getCategories() {
        $sql = "SELECT DISTINCT category FROM equipment ORDER BY category";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get distinct departments
     */
    public function getDepartments() {
        $sql = "SELECT DISTINCT department FROM equipment ORDER BY department";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get equipment statistics
     */
    public function getStatistics() {
        $sql = "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Scrapped' THEN 1 ELSE 0 END) as scrapped
                FROM equipment";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetch();
        } catch(PDOException $e) {
            return ['total' => 0, 'active' => 0, 'scrapped' => 0];
        }
    }
}
