<?php
require_once __DIR__ . '/../config/database.php';

/**
 * MaintenanceRequest Model
 * Handles maintenance request operations with strict state flow
 */
class MaintenanceRequest {
    private $db;
    private $conn;
    
    // State transition rules
    private $allowed_transitions = [
        'New' => ['In Progress'],
        'In Progress' => ['Repaired', 'Scrap'],
        'Repaired' => [],
        'Scrap' => []
    ];
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }
    
    /**
     * Create new maintenance request
     */
    public function create($data) {
        // Check if equipment is scrapped
        $equipment_check = "SELECT status FROM equipment WHERE id = :equipment_id";
        $stmt = $this->conn->prepare($equipment_check);
        $stmt->bindParam(':equipment_id', $data['equipment_id']);
        $stmt->execute();
        $equipment = $stmt->fetch();
        
        if ($equipment && $equipment['status'] === 'Scrapped') {
            return ['success' => false, 'message' => 'Cannot create request for scrapped equipment'];
        }
        
        $sql = "INSERT INTO maintenance_requests (equipment_id, request_type, title, description, 
                priority, state, maintenance_team_id, assigned_technician_id, scheduled_date, created_by) 
                VALUES (:equipment_id, :request_type, :title, :description, :priority, 'New', 
                :team_id, :technician_id, :scheduled_date, :created_by)";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':equipment_id', $data['equipment_id']);
            $stmt->bindParam(':request_type', $data['request_type']);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':priority', $data['priority']);
            $stmt->bindParam(':team_id', $data['maintenance_team_id']);
            $stmt->bindParam(':technician_id', $data['assigned_technician_id']);
            $stmt->bindParam(':scheduled_date', $data['scheduled_date']);
            $stmt->bindParam(':created_by', $data['created_by']);
            
            $stmt->execute();
            return ['success' => true, 'id' => $this->conn->lastInsertId()];
        } catch(PDOException $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Get request by ID with all related data
     */
    public function getById($id) {
        $sql = "SELECT mr.*, 
                e.name as equipment_name, e.serial_number, e.status as equipment_status,
                mt.name as team_name,
                u.full_name as technician_name, u.avatar_initials,
                creator.full_name as created_by_name
                FROM maintenance_requests mr
                INNER JOIN equipment e ON mr.equipment_id = e.id
                LEFT JOIN maintenance_teams mt ON mr.maintenance_team_id = mt.id
                LEFT JOIN users u ON mr.assigned_technician_id = u.id
                LEFT JOIN users creator ON mr.created_by = creator.id
                WHERE mr.id = :id";
        
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
     * Get all requests with filters
     */
    public function getAll($filters = []) {
        $sql = "SELECT mr.*, 
                e.name as equipment_name, e.serial_number,
                mt.name as team_name,
                u.full_name as technician_name, u.avatar_initials
                FROM maintenance_requests mr
                INNER JOIN equipment e ON mr.equipment_id = e.id
                LEFT JOIN maintenance_teams mt ON mr.maintenance_team_id = mt.id
                LEFT JOIN users u ON mr.assigned_technician_id = u.id
                WHERE 1=1";
        
        // Apply filters
        if (!empty($filters['state'])) {
            $sql .= " AND mr.state = :state";
        }
        if (!empty($filters['request_type'])) {
            $sql .= " AND mr.request_type = :request_type";
        }
        if (!empty($filters['equipment_id'])) {
            $sql .= " AND mr.equipment_id = :equipment_id";
        }
        if (!empty($filters['technician_id'])) {
            $sql .= " AND mr.assigned_technician_id = :technician_id";
        }
        if (!empty($filters['team_id'])) {
            $sql .= " AND mr.maintenance_team_id = :team_id";
        }
        
        $sql .= " ORDER BY mr.created_at DESC";
        
        try {
            $stmt = $this->conn->prepare($sql);
            
            if (!empty($filters['state'])) {
                $stmt->bindParam(':state', $filters['state']);
            }
            if (!empty($filters['request_type'])) {
                $stmt->bindParam(':request_type', $filters['request_type']);
            }
            if (!empty($filters['equipment_id'])) {
                $stmt->bindParam(':equipment_id', $filters['equipment_id']);
            }
            if (!empty($filters['technician_id'])) {
                $stmt->bindParam(':technician_id', $filters['technician_id']);
            }
            if (!empty($filters['team_id'])) {
                $stmt->bindParam(':team_id', $filters['team_id']);
            }
            
            $stmt->execute();
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Update request state with validation
     */
    public function updateState($id, $new_state, $notes = null) {
        // Get current request
        $request = $this->getById($id);
        if (!$request) {
            return ['success' => false, 'message' => 'Request not found'];
        }
        
        $current_state = $request['state'];
        
        // Validate state transition
        if (!in_array($new_state, $this->allowed_transitions[$current_state])) {
            return ['success' => false, 'message' => "Invalid state transition from $current_state to $new_state"];
        }
        
        // Additional validation for completing states
        if (($new_state === 'Repaired' || $new_state === 'Scrap') && empty($request['started_at'])) {
            return ['success' => false, 'message' => 'Request must be in progress before it can be closed'];
        }
        
        try {
            $this->conn->beginTransaction();
            
            // Update request state
            $sql = "UPDATE maintenance_requests SET state = :state, notes = :notes";
            
            if ($new_state === 'In Progress' && empty($request['started_at'])) {
                $sql .= ", started_at = NOW()";
            }
            
            if ($new_state === 'Repaired' || $new_state === 'Scrap') {
                $sql .= ", completed_at = NOW()";
                // Calculate duration in minutes
                $sql .= ", duration_minutes = TIMESTAMPDIFF(MINUTE, started_at, NOW())";
            }
            
            $sql .= " WHERE id = :id";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':state', $new_state);
            $stmt->bindParam(':notes', $notes);
            $stmt->execute();
            
            // If moving to Scrap, mark equipment as scrapped
            if ($new_state === 'Scrap') {
                $equipment_sql = "UPDATE equipment SET status = 'Scrapped' WHERE id = :equipment_id";
                $equipment_stmt = $this->conn->prepare($equipment_sql);
                $equipment_stmt->bindParam(':equipment_id', $request['equipment_id']);
                $equipment_stmt->execute();
            }
            
            $this->conn->commit();
            return ['success' => true];
        } catch(PDOException $e) {
            $this->conn->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Update request details
     */
    public function update($id, $data) {
        $sql = "UPDATE maintenance_requests SET 
                title = :title, 
                description = :description, 
                priority = :priority,
                scheduled_date = :scheduled_date,
                maintenance_team_id = :team_id,
                assigned_technician_id = :technician_id
                WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':priority', $data['priority']);
            $stmt->bindParam(':scheduled_date', $data['scheduled_date']);
            $stmt->bindParam(':team_id', $data['maintenance_team_id']);
            $stmt->bindParam(':technician_id', $data['assigned_technician_id']);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Delete request
     */
    public function delete($id) {
        $sql = "DELETE FROM maintenance_requests WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get requests for Kanban board grouped by state
     */
    public function getKanbanData($filters = []) {
        $requests = $this->getAll($filters);
        
        $kanban = [
            'New' => [],
            'In Progress' => [],
            'Repaired' => [],
            'Scrap' => []
        ];
        
        foreach ($requests as $request) {
            // Check if overdue
            $request['is_overdue'] = false;
            if (!empty($request['scheduled_date']) && 
                $request['state'] !== 'Repaired' && 
                $request['state'] !== 'Scrap') {
                $scheduled = strtotime($request['scheduled_date']);
                $today = strtotime('today');
                $request['is_overdue'] = $scheduled < $today;
            }
            
            $kanban[$request['state']][] = $request;
        }
        
        return $kanban;
    }
    
    /**
     * Get preventive requests for calendar
     */
    public function getCalendarData($year, $month) {
        $sql = "SELECT mr.*, 
                e.name as equipment_name
                FROM maintenance_requests mr
                INNER JOIN equipment e ON mr.equipment_id = e.id
                WHERE mr.request_type = 'Preventive' 
                AND YEAR(mr.scheduled_date) = :year 
                AND MONTH(mr.scheduled_date) = :month
                ORDER BY mr.scheduled_date ASC";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':year', $year);
            $stmt->bindParam(':month', $month);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get request statistics
     */
    public function getStatistics() {
        $sql = "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN state = 'New' THEN 1 ELSE 0 END) as new_requests,
                SUM(CASE WHEN state = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN state = 'Repaired' THEN 1 ELSE 0 END) as repaired,
                SUM(CASE WHEN state = 'Scrap' THEN 1 ELSE 0 END) as scrapped
                FROM maintenance_requests";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetch();
        } catch(PDOException $e) {
            return ['total' => 0, 'new_requests' => 0, 'in_progress' => 0, 'repaired' => 0, 'scrapped' => 0];
        }
    }
    
    /**
     * Count open requests for equipment
     */
    public function countOpenRequestsForEquipment($equipment_id) {
        $sql = "SELECT COUNT(*) as count FROM maintenance_requests 
                WHERE equipment_id = :equipment_id 
                AND state NOT IN ('Repaired', 'Scrap')";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':equipment_id', $equipment_id);
            $stmt->execute();
            $result = $stmt->fetch();
            
            return $result['count'];
        } catch(PDOException $e) {
            return 0;
        }
    }
}
