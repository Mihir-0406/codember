<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

if (!hasRole(ROLE_ADMIN) && !hasRole(ROLE_MANAGER)) {
    die("Access Denied");
}

require_once __DIR__ . '/../../models/MaintenanceTeam.php';

$teamModel = new MaintenanceTeam();

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitize($_POST['name']);
    $description = sanitize($_POST['description']);
    
    if (empty($name)) {
        $errors[] = 'Team name is required';
    }
    
    if (empty($errors)) {
        $result = $teamModel->create($name, $description);
        if ($result) {
            redirect('views/teams/view.php?id=' . $result);
        } else {
            $errors[] = 'Failed to create team';
        }
    }
}

$page_title = 'Create Team';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Create New Team</h2>
            <a href="list.php" class="btn btn-secondary">Back to List</a>
        </div>
        
        <?php if (!empty($errors)): ?>
            <div class="alert alert-danger">
                <ul style="margin: 0; padding-left: 20px;">
                    <?php foreach ($errors as $error): ?>
                        <li><?php echo $error; ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <div class="form-group">
                <label for="name">Team Name *</label>
                <input type="text" id="name" name="name" class="form-control" 
                       value="<?php echo isset($_POST['name']) ? htmlspecialchars($_POST['name']) : ''; ?>" required>
            </div>
            
            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" name="description" class="form-control"><?php echo isset($_POST['description']) ? htmlspecialchars($_POST['description']) : ''; ?></textarea>
            </div>
            
            <div class="flex gap-10">
                <button type="submit" class="btn btn-primary">Create Team</button>
                <a href="list.php" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
