<?php
// Fix user passwords in database
$password = 'admin123';
$new_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $conn = new PDO("mysql:host=localhost;dbname=gearguard", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $conn->prepare("UPDATE users SET password = :password WHERE username IN ('admin', 'manager1', 'tech1', 'tech2', 'user1')");
    $stmt->bindParam(':password', $new_hash);
    
    if ($stmt->execute()) {
        echo "✓ Successfully updated passwords for all users\n";
        echo "New password hash: $new_hash\n";
        echo "\nYou can now login with:\n";
        echo "  Username: admin (or manager1, tech1, tech2, user1)\n";
        echo "  Password: admin123\n";
    } else {
        echo "✗ Failed to update passwords\n";
    }
} catch(PDOException $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}
