<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

if (!hasRole(ROLE_ADMIN) && !hasRole(ROLE_MANAGER)) {
    die("Access Denied");
}

require_once __DIR__ . '/../../models/MaintenanceTeam.php';

$teamModel = new MaintenanceTeam();
$teams = $teamModel->getAll();

$page_title = 'Maintenance Teams';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Maintenance Teams</h2>
            <a href="create.php" class="btn btn-primary">+ Add Team</a>
        </div>
        
        <?php if (empty($teams)): ?>
            <p class="text-center text-muted">No teams found.</p>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Team Name</th>
                        <th>Description</th>
                        <th>Members</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($teams as $team): ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($team['name']); ?></strong></td>
                            <td><?php echo htmlspecialchars(substr($team['description'], 0, 80)) . (strlen($team['description']) > 80 ? '...' : ''); ?></td>
                            <td><span class="badge badge-info"><?php echo $team['member_count']; ?> members</span></td>
                            <td><?php echo date('M d, Y', strtotime($team['created_at'])); ?></td>
                            <td>
                                <div class="flex gap-10">
                                    <a href="view.php?id=<?php echo $team['id']; ?>" class="btn btn-sm btn-secondary">View</a>
                                    <a href="edit.php?id=<?php echo $team['id']; ?>" class="btn btn-sm btn-primary">Edit</a>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
