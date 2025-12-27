<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

if (!hasRole(ROLE_ADMIN) && !hasRole(ROLE_MANAGER)) {
    die("Access Denied");
}

require_once __DIR__ . '/../../models/MaintenanceTeam.php';
require_once __DIR__ . '/../../models/User.php';

$teamModel = new MaintenanceTeam();
$userModel = new User();

$id = $_GET['id'] ?? null;
if (!$id) {
    redirect('views/teams/list.php');
}

$team = $teamModel->getById($id);
if (!$team) {
    die("Team not found");
}

$members = $teamModel->getMembers($id);
$technicians = $userModel->getByRole(ROLE_TECHNICIAN);

// Handle add/remove member
$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'add' && !empty($_POST['user_id'])) {
            if ($teamModel->addMember($id, $_POST['user_id'])) {
                $message = 'Member added successfully!';
                $members = $teamModel->getMembers($id); // Reload
            } else {
                $message = 'Failed to add member (may already be a member)';
            }
        } elseif ($_POST['action'] === 'remove' && !empty($_POST['user_id'])) {
            if ($teamModel->removeMember($id, $_POST['user_id'])) {
                $message = 'Member removed successfully!';
                $members = $teamModel->getMembers($id); // Reload
            }
        }
    }
}

$page_title = 'Team Details';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header flex-between">
            <h2 class="card-title"><?php echo htmlspecialchars($team['name']); ?></h2>
            <div class="flex gap-10">
                <a href="list.php" class="btn btn-secondary">Back to List</a>
                <a href="edit.php?id=<?php echo $team['id']; ?>" class="btn btn-primary">Edit Team</a>
            </div>
        </div>
        
        <?php if ($message): ?>
            <div class="alert alert-info"><?php echo $message; ?></div>
        <?php endif; ?>
        
        <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 10px; color: var(--secondary-color);">Description</h3>
            <p><?php echo htmlspecialchars($team['description'] ?: 'No description provided'); ?></p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <strong>Created:</strong> <?php echo date('M d, Y', strtotime($team['created_at'])); ?>
        </div>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">
                Team Members 
                <span class="badge badge-info"><?php echo count($members); ?></span>
            </h2>
        </div>
        
        <!-- Add Member Form -->
        <form method="POST" action="" style="margin-bottom: 20px;">
            <input type="hidden" name="action" value="add">
            <div style="display: flex; gap: 10px; align-items: flex-end;">
                <div class="form-group" style="flex: 1; margin-bottom: 0;">
                    <label for="user_id">Add Technician</label>
                    <select name="user_id" id="user_id" class="form-control" required>
                        <option value="">-- Select Technician --</option>
                        <?php foreach ($technicians as $tech): ?>
                            <?php if (!$teamModel->isMember($id, $tech['id'])): ?>
                                <option value="<?php echo $tech['id']; ?>"><?php echo htmlspecialchars($tech['full_name']); ?></option>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </select>
                </div>
                <button type="submit" class="btn btn-success">Add Member</button>
            </div>
        </form>
        
        <?php if (empty($members)): ?>
            <p class="text-center text-muted">No members assigned to this team.</p>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Assigned Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($members as $member): ?>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="user-avatar" style="width: 30px; height: 30px; font-size: 0.8rem;">
                                        <?php echo $member['avatar_initials']; ?>
                                    </div>
                                    <?php echo htmlspecialchars($member['full_name']); ?>
                                </div>
                            </td>
                            <td><?php echo htmlspecialchars($member['email']); ?></td>
                            <td><span class="badge badge-secondary"><?php echo ucfirst(str_replace('_', ' ', $member['role'])); ?></span></td>
                            <td><?php echo date('M d, Y', strtotime($member['assigned_at'])); ?></td>
                            <td>
                                <form method="POST" action="" style="display: inline;">
                                    <input type="hidden" name="action" value="remove">
                                    <input type="hidden" name="user_id" value="<?php echo $member['id']; ?>">
                                    <button type="submit" class="btn btn-sm btn-danger" 
                                            onclick="return confirm('Remove this member from the team?');">Remove</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
