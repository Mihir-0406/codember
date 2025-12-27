<?php
require_once __DIR__ . '/../config/database.php';

/**
 * MaintenanceTeam Model
 * Handles maintenance team operations
 */
class MaintenanceTeam {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }
    
    /**
     * Create new team
     */
    public function create($name, $description) {
        $sql = "INSERT INTO maintenance_teams (name, description) VALUES (:name, :description)";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':description', $description);
            
            $stmt->execute();
            return $this->conn->lastInsertId();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get team by ID with member count
     */
    public function getById($id) {
        $sql = "SELECT mt.*, COUNT(tm.id) as member_count
                FROM maintenance_teams mt
                LEFT JOIN team_members tm ON mt.id = tm.team_id
                WHERE mt.id = :id
                GROUP BY mt.id";
        
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
     * Get all teams with member counts
     */
    public function getAll() {
        $sql = "SELECT mt.*, COUNT(tm.id) as member_count
                FROM maintenance_teams mt
                LEFT JOIN team_members tm ON mt.id = tm.team_id
                GROUP BY mt.id
                ORDER BY mt.name ASC";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Update team
     */
    public function update($id, $name, $description) {
        $sql = "UPDATE maintenance_teams SET name = :name, description = :description WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':description', $description);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Delete team
     */
    public function delete($id) {
        $sql = "DELETE FROM maintenance_teams WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get team members
     */
    public function getMembers($team_id) {
        $sql = "SELECT u.id, u.full_name, u.email, u.role, u.avatar_initials, tm.assigned_at
                FROM team_members tm
                INNER JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = :team_id
                ORDER BY u.full_name ASC";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':team_id', $team_id);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Add member to team
     */
    public function addMember($team_id, $user_id) {
        $sql = "INSERT INTO team_members (team_id, user_id) VALUES (:team_id, :user_id)";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':team_id', $team_id);
            $stmt->bindParam(':user_id', $user_id);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Remove member from team
     */
    public function removeMember($team_id, $user_id) {
        $sql = "DELETE FROM team_members WHERE team_id = :team_id AND user_id = :user_id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':team_id', $team_id);
            $stmt->bindParam(':user_id', $user_id);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Check if user is member of team
     */
    public function isMember($team_id, $user_id) {
        $sql = "SELECT id FROM team_members WHERE team_id = :team_id AND user_id = :user_id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':team_id', $team_id);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            return $stmt->rowCount() > 0;
        } catch(PDOException $e) {
            return false;
        }
    }
}
