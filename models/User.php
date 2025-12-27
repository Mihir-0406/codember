<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';

/**
 * User Model
 * Handles all user-related database operations
 */
class User {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }
    
    /**
     * Create a new user
     */
    public function create($username, $email, $password, $full_name, $role) {
        $sql = "INSERT INTO users (username, email, password, full_name, role, avatar_initials) 
                VALUES (:username, :email, :password, :full_name, :role, :initials)";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $initials = $this->generateInitials($full_name);
            
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $hashed_password);
            $stmt->bindParam(':full_name', $full_name);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':initials', $initials);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Authenticate user login
     */
    public function login($username, $password) {
        $sql = "SELECT * FROM users WHERE username = :username LIMIT 1";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password'])) {
                // Set session variables
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['avatar_initials'] = $user['avatar_initials'];
                
                return true;
            }
            
            return false;
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get user by ID
     */
    public function getById($id) {
        $sql = "SELECT id, username, email, full_name, role, avatar_initials, created_at 
                FROM users WHERE id = :id";
        
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
     * Get all users
     */
    public function getAll() {
        $sql = "SELECT id, username, email, full_name, role, avatar_initials, created_at 
                FROM users ORDER BY full_name ASC";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get users by role
     */
    public function getByRole($role) {
        $sql = "SELECT id, username, email, full_name, role, avatar_initials 
                FROM users WHERE role = :role ORDER BY full_name ASC";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':role', $role);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            return [];
        }
    }
    
    /**
     * Update user
     */
    public function update($id, $email, $full_name, $role) {
        $sql = "UPDATE users SET email = :email, full_name = :full_name, 
                role = :role, avatar_initials = :initials WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $initials = $this->generateInitials($full_name);
            
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':full_name', $full_name);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':initials', $initials);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Delete user
     */
    public function delete($id) {
        $sql = "DELETE FROM users WHERE id = :id";
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch(PDOException $e) {
            return false;
        }
    }
    
    /**
     * Generate initials from full name
     */
    private function generateInitials($full_name) {
        $parts = explode(' ', trim($full_name));
        $initials = '';
        
        foreach ($parts as $part) {
            if (!empty($part)) {
                $initials .= strtoupper(substr($part, 0, 1));
            }
        }
        
        return substr($initials, 0, 3);
    }
    
    /**
     * Check if username exists
     */
    public function usernameExists($username, $exclude_id = null) {
        $sql = "SELECT id FROM users WHERE username = :username";
        if ($exclude_id) {
            $sql .= " AND id != :exclude_id";
        }
        
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':username', $username);
            if ($exclude_id) {
                $stmt->bindParam(':exclude_id', $exclude_id);
            }
            $stmt->execute();
            
            return $stmt->rowCount() > 0;
        } catch(PDOException $e) {
            return false;
        }
    }
}
