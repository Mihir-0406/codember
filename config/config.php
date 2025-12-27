<?php
/**
 * General Configuration for GearGuard System
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Application settings
define('APP_NAME', 'GearGuard');
define('BASE_URL', 'http://localhost/1/');

// Date and time settings
date_default_timezone_set('UTC');

// User roles
define('ROLE_ADMIN', 'admin');
define('ROLE_MANAGER', 'manager');
define('ROLE_TECHNICIAN', 'technician');
define('ROLE_USER', 'normal_user');

// Equipment status
define('STATUS_ACTIVE', 'Active');
define('STATUS_SCRAPPED', 'Scrapped');

// Request types
define('REQUEST_CORRECTIVE', 'Corrective');
define('REQUEST_PREVENTIVE', 'Preventive');

// Request states
define('STATE_NEW', 'New');
define('STATE_IN_PROGRESS', 'In Progress');
define('STATE_REPAIRED', 'Repaired');
define('STATE_SCRAP', 'Scrap');

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Check user role
 */
function hasRole($role) {
    return isset($_SESSION['role']) && $_SESSION['role'] === $role;
}

/**
 * Redirect helper
 */
function redirect($url) {
    header("Location: " . BASE_URL . $url);
    exit();
}

/**
 * Require login middleware
 */
function requireLogin() {
    if (!isLoggedIn()) {
        redirect('views/auth/login.php');
    }
}

/**
 * Require specific role
 */
function requireRole($role) {
    requireLogin();
    if (!hasRole($role)) {
        die("Access Denied: Insufficient permissions");
    }
}

/**
 * Sanitize input
 */
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}
