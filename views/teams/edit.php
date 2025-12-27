<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

if (!hasRole(ROLE_ADMIN) && !hasRole(ROLE_MANAGER)) {
    die("Access Denied");
}

require_once __DIR__ . '/../../models/MaintenanceTeam.php';

$teamModel = new MaintenanceTeam();

$id = $_GET['id'] ?? null;
if (!$id) {
    redirect('views/teams/list.php');
}

$team = $teamModel->getById($id);
if (!$team) {
    die("Team not found");
}

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitize($_POST['name']);
    $description = sanitize($_POST['description']);
    
    if (empty($name)) {
        $errors[] = 'Team name is required';
    }
    
    if (empty($errors)) {
        if ($teamModel->update($id, $name, $description)) {
            $success = 'Team updated successfully!';
            $team = $teamModel->getById($id); // Reload
        } else {
            $errors[] = 'Failed to update team';
        }
    }
}

$page_title = 'Edit Team';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Edit Team</h2>
            <a href="view.php?id=<?php echo $team['id']; ?>" class="btn btn-secondary">Back to Details</a>
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
        
        <?php if ($success): ?>
            <div class="alert alert-success"><?php echo $success; ?></div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <div class="form-group">
                <label for="name">Team Name *</label>
                <input type="text" id="name" name="name" class="form-control" 
                       value="<?php echo htmlspecialchars($team['name']); ?>" required>
            </div>
            
            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" name="description" class="form-control"><?php echo htmlspecialchars($team['description']); ?></textarea>
            </div>
            
            <div class="flex gap-10">
                <button type="submit" class="btn btn-primary">Update Team</button>
                <a href="view.php?id=<?php echo $team['id']; ?>" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
