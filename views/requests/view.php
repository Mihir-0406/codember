<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

require_once __DIR__ . '/../../models/MaintenanceRequest.php';

$requestModel = new MaintenanceRequest();

$id = $_GET['id'] ?? null;
if (!$id) {
    redirect('views/requests/kanban.php');
}

$request = $requestModel->getById($id);
if (!$request) {
    die("Request not found");
}

$message = '';
$error = '';

// Handle state change
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'change_state') {
        $new_state = $_POST['new_state'];
        $notes = sanitize($_POST['notes'] ?? '');
        
        $result = $requestModel->updateState($id, $new_state, $notes);
        
        if ($result['success']) {
            $message = 'Request state updated successfully!';
            $request = $requestModel->getById($id); // Reload
        } else {
            $error = $result['message'];
        }
    }
}

// Determine available state transitions
$allowed_transitions = [
    'New' => ['In Progress'],
    'In Progress' => ['Repaired', 'Scrap'],
    'Repaired' => [],
    'Scrap' => []
];

$available_states = $allowed_transitions[$request['state']];

$page_title = 'Request Details';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header flex-between">
            <h2 class="card-title">Request #<?php echo $request['id']; ?></h2>
            <div class="flex gap-10">
                <a href="kanban.php" class="btn btn-secondary">Back to Kanban</a>
                <a href="../equipment/view.php?id=<?php echo $request['equipment_id']; ?>" class="btn btn-primary">View Equipment</a>
            </div>
        </div>
        
        <?php if ($message): ?>
            <div class="alert alert-success"><?php echo $message; ?></div>
        <?php endif; ?>
        
        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div>
                <h3 style="margin-bottom: 15px; color: var(--secondary-color);">Request Information</h3>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Title:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($request['title']); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Type:</td>
                        <td style="padding: 8px 0;">
                            <span class="badge badge-<?php echo $request['request_type'] === 'Preventive' ? 'info' : 'warning'; ?>">
                                <?php echo $request['request_type']; ?>
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Priority:</td>
                        <td style="padding: 8px 0;"><span class="badge badge-secondary"><?php echo $request['priority']; ?></span></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">State:</td>
                        <td style="padding: 8px 0;">
                            <?php
                            $state_colors = [
                                'New' => 'info',
                                'In Progress' => 'warning',
                                'Repaired' => 'success',
                                'Scrap' => 'danger'
                            ];
                            ?>
                            <span class="badge badge-<?php echo $state_colors[$request['state']]; ?>">
                                <?php echo $request['state']; ?>
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div>
                <h3 style="margin-bottom: 15px; color: var(--secondary-color);">Equipment Details</h3>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Equipment:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($request['equipment_name']); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Serial Number:</td>
                        <td style="padding: 8px 0;"><code><?php echo htmlspecialchars($request['serial_number']); ?></code></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Equipment Status:</td>
                        <td style="padding: 8px 0;">
                            <span class="badge badge-<?php echo $request['equipment_status'] === 'Active' ? 'success' : 'danger'; ?>">
                                <?php echo $request['equipment_status']; ?>
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div>
                <h3 style="margin-bottom: 15px; color: var(--secondary-color);">Assignment</h3>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Team:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($request['team_name'] ?: 'Not assigned'); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Technician:</td>
                        <td style="padding: 8px 0;">
                            <?php if ($request['technician_name']): ?>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="technician-avatar-small"><?php echo $request['avatar_initials']; ?></div>
                                    <?php echo htmlspecialchars($request['technician_name']); ?>
                                </div>
                            <?php else: ?>
                                Not assigned
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Created By:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($request['created_by_name']); ?></td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 10px; color: var(--secondary-color);">Description</h3>
            <p style="background: var(--light-color); padding: 15px; border-radius: 6px;">
                <?php echo nl2br(htmlspecialchars($request['description'])); ?>
            </p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div>
                <h4 style="margin-bottom: 8px; color: var(--secondary-color);">Timeline</h4>
                <table style="width: 100%; font-size: 0.9rem;">
                    <tr>
                        <td style="padding: 4px 0;">Scheduled:</td>
                        <td style="padding: 4px 0;"><?php echo $request['scheduled_date'] ? date('M d, Y', strtotime($request['scheduled_date'])) : 'Not scheduled'; ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0;">Created:</td>
                        <td style="padding: 4px 0;"><?php echo date('M d, Y H:i', strtotime($request['created_at'])); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0;">Started:</td>
                        <td style="padding: 4px 0;"><?php echo $request['started_at'] ? date('M d, Y H:i', strtotime($request['started_at'])) : 'Not started'; ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0;">Completed:</td>
                        <td style="padding: 4px 0;"><?php echo $request['completed_at'] ? date('M d, Y H:i', strtotime($request['completed_at'])) : 'Not completed'; ?></td>
                    </tr>
                    <?php if ($request['duration_minutes']): ?>
                    <tr>
                        <td style="padding: 4px 0;"><strong>Duration:</strong></td>
                        <td style="padding: 4px 0;"><strong><?php echo floor($request['duration_minutes'] / 60) . 'h ' . ($request['duration_minutes'] % 60) . 'm'; ?></strong></td>
                    </tr>
                    <?php endif; ?>
                </table>
            </div>
            
            <?php if ($request['notes']): ?>
            <div>
                <h4 style="margin-bottom: 8px; color: var(--secondary-color);">Notes</h4>
                <p style="background: var(--light-color); padding: 10px; border-radius: 6px; font-size: 0.9rem;">
                    <?php echo nl2br(htmlspecialchars($request['notes'])); ?>
                </p>
            </div>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- State Change Section -->
    <?php if (!empty($available_states)): ?>
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Change Request State</h2>
        </div>
        
        <div class="alert alert-info">
            <strong>Current State:</strong> <?php echo $request['state']; ?><br>
            <strong>Allowed Transitions:</strong> <?php echo implode(' or ', $available_states); ?>
        </div>
        
        <form method="POST" action="">
            <input type="hidden" name="action" value="change_state">
            
            <div class="form-group">
                <label for="new_state">New State *</label>
                <select id="new_state" name="new_state" class="form-control" required>
                    <option value="">-- Select State --</option>
                    <?php foreach ($available_states as $state): ?>
                        <option value="<?php echo $state; ?>"><?php echo $state; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label for="notes">Notes</label>
                <textarea id="notes" name="notes" class="form-control" 
                          placeholder="Add notes about this state change (e.g., work performed, parts replaced, etc.)"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary" onclick="return confirm('Are you sure you want to change the state of this request?');">
                Update State
            </button>
        </form>
    </div>
    <?php else: ?>
    <div class="alert alert-success">
        This request is in a final state and cannot be changed.
    </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
