<?php
// Test password verification
$password = 'admin123';
$hash_from_db = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

echo "Testing password: $password\n";
echo "Hash from database: $hash_from_db\n\n";

if (password_verify($password, $hash_from_db)) {
    echo "✓ Password verification SUCCESSFUL\n";
} else {
    echo "✗ Password verification FAILED\n";
    echo "\nGenerating new hash for 'admin123':\n";
    $new_hash = password_hash($password, PASSWORD_DEFAULT);
    echo $new_hash . "\n";
}

// Test database connection
echo "\n--- Testing Database Connection ---\n";
try {
    $conn = new PDO("mysql:host=localhost;dbname=gearguard", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Database connection successful\n";
    
    // Check if users exist
    $stmt = $conn->query("SELECT username, email, role FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "\nUsers in database:\n";
    foreach ($users as $user) {
        echo "  - {$user['username']} ({$user['role']}) - {$user['email']}\n";
    }
} catch(PDOException $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}
