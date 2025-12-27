<?php
require_once __DIR__ . '/../config/config.php';
requireLogin();

require_once __DIR__ . '/../models/Equipment.php';
require_once __DIR__ . '/../models/MaintenanceRequest.php';
require_once __DIR__ . '/../models/MaintenanceTeam.php';
require_once __DIR__ . '/../models/User.php';

$equipmentModel = new Equipment();
$requestModel = new MaintenanceRequest();
$teamModel = new MaintenanceTeam();
$userModel = new User();

// Get statistics
$equipment_stats = $equipmentModel->getStatistics();
$request_stats = $requestModel->getStatistics();

// Get recent requests
$recent_requests = $requestModel->getAll([]);
$recent_requests = array_slice($recent_requests, 0, 10); // Latest 10

// Role-specific data
$my_requests = [];
if (hasRole(ROLE_TECHNICIAN)) {
    $my_requests = $requestModel->getAll(['technician_id' => $_SESSION['user_id']]);
}

$page_title = 'Dashboard';
include __DIR__ . '/includes/header.php';
?>

<div class="container">
    <div style="margin-bottom: 30px;">
        <h1>Welcome, <?php echo $_SESSION['full_name']; ?>! 👋</h1>
        <p class="text-muted">Role: <?php echo ucfirst(str_replace('_', ' ', $_SESSION['role'])); ?></p>
    </div>
    
    <!-- Statistics Overview -->
    <div class="stats-grid">
        <div class="stat-card" style="border-left-color: var(--primary-color);">
            <h3>Total Equipment</h3>
            <div class="stat-value"><?php echo $equipment_stats['total']; ?></div>
            <a href="equipment/list.php" style="font-size: 0.85rem; color: var(--primary-color);">View All →</a>
        </div>
        
        <div class="stat-card" style="border-left-color: var(--success-color);">
            <h3>Active Equipment</h3>
            <div class="stat-value"><?php echo $equipment_stats['active']; ?></div>
            <a href="equipment/list.php?status=Active" style="font-size: 0.85rem; color: var(--success-color);">View Active →</a>
        </div>
        
        <div class="stat-card" style="border-left-color: var(--warning-color);">
            <h3>Pending Requests</h3>
            <div class="stat-value"><?php echo $request_stats['new_requests']; ?></div>
            <a href="requests/kanban.php" style="font-size: 0.85rem; color: var(--warning-color);">View Kanban →</a>
        </div>
        
        <div class="stat-card" style="border-left-color: var(--danger-color);">
            <h3>In Progress</h3>
            <div class="stat-value"><?php echo $request_stats['in_progress']; ?></div>
            <a href="requests/kanban.php" style="font-size: 0.85rem; color: var(--danger-color);">View Board →</a>
        </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">🚀 Quick Actions</h2>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <a href="requests/create.php" class="btn btn-primary" style="padding: 20px; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 10px;">➕</div>
                <div>New Request</div>
            </a>
            
            <a href="requests/kanban.php" class="btn btn-success" style="padding: 20px; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 10px;">📋</div>
                <div>Kanban Board</div>
            </a>
            
            <a href="requests/calendar.php" class="btn btn-primary" style="padding: 20px; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                <div>Calendar View</div>
            </a>
            
            <a href="equipment/list.php" class="btn btn-secondary" style="padding: 20px; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 10px;">⚙️</div>
                <div>Equipment List</div>
            </a>
        </div>
    </div>
    
    <!-- Technician's Assigned Requests -->
    <?php if (hasRole(ROLE_TECHNICIAN) && !empty($my_requests)): ?>
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">🔧 My Assigned Requests</h2>
            <span class="badge badge-info"><?php echo count($my_requests); ?> Total</span>
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Equipment</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>State</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach (array_slice($my_requests, 0, 5) as $request): ?>
                    <tr>
                        <td>#<?php echo $request['id']; ?></td>
                        <td><span class="badge badge-<?php echo $request['request_type'] === 'Preventive' ? 'info' : 'warning'; ?>"><?php echo $request['request_type']; ?></span></td>
                        <td><?php echo htmlspecialchars($request['equipment_name']); ?></td>
                        <td><?php echo htmlspecialchars($request['title']); ?></td>
                        <td><span class="badge badge-secondary"><?php echo $request['priority']; ?></span></td>
                        <td>
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
                        <td>
                            <a href="requests/view.php?id=<?php echo $request['id']; ?>" class="btn btn-sm btn-secondary">View</a>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
    
    <!-- Recent Maintenance Requests -->
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">📝 Recent Maintenance Requests</h2>
            <a href="requests/kanban.php" class="btn btn-secondary btn-sm">View All</a>
        </div>
        
        <?php if (empty($recent_requests)): ?>
            <p class="text-center text-muted">No maintenance requests found.</p>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Equipment</th>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>State</th>
                        <th>Technician</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recent_requests as $request): ?>
                        <tr>
                            <td>#<?php echo $request['id']; ?></td>
                            <td><span class="badge badge-<?php echo $request['request_type'] === 'Preventive' ? 'info' : 'warning'; ?>"><?php echo $request['request_type']; ?></span></td>
                            <td><?php echo htmlspecialchars($request['equipment_name']); ?></td>
                            <td><?php echo htmlspecialchars(substr($request['title'], 0, 40)) . (strlen($request['title']) > 40 ? '...' : ''); ?></td>
                            <td><span class="badge badge-secondary"><?php echo $request['priority']; ?></span></td>
                            <td>
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
                            <td>
                                <?php if ($request['technician_name']): ?>
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <div class="technician-avatar-small"><?php echo $request['avatar_initials']; ?></div>
                                        <span class="text-sm"><?php echo htmlspecialchars(explode(' ', $request['technician_name'])[0]); ?></span>
                                    </div>
                                <?php else: ?>
                                    <span class="text-muted text-sm">Unassigned</span>
                                <?php endif; ?>
                            </td>
                            <td class="text-sm"><?php echo date('M d', strtotime($request['created_at'])); ?></td>
                            <td>
                                <a href="requests/view.php?id=<?php echo $request['id']; ?>" class="btn btn-sm btn-secondary">View</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
    
    <!-- System Overview (Admin/Manager only) -->
    <?php if (hasRole(ROLE_ADMIN) || hasRole(ROLE_MANAGER)): ?>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">📊 Request Statistics</h3>
            </div>
            <table style="width: 100%;">
                <tr>
                    <td style="padding: 8px 0;">Total Requests:</td>
                    <td style="padding: 8px 0; font-weight: 600;"><?php echo $request_stats['total']; ?></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">New:</td>
                    <td style="padding: 8px 0;"><span class="badge badge-info"><?php echo $request_stats['new_requests']; ?></span></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">In Progress:</td>
                    <td style="padding: 8px 0;"><span class="badge badge-warning"><?php echo $request_stats['in_progress']; ?></span></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">Repaired:</td>
                    <td style="padding: 8px 0;"><span class="badge badge-success"><?php echo $request_stats['repaired']; ?></span></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">Scrapped:</td>
                    <td style="padding: 8px 0;"><span class="badge badge-danger"><?php echo $request_stats['scrapped']; ?></span></td>
                </tr>
            </table>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">⚙️ Equipment Status</h3>
            </div>
            <table style="width: 100%;">
                <tr>
                    <td style="padding: 8px 0;">Total Equipment:</td>
                    <td style="padding: 8px 0; font-weight: 600;"><?php echo $equipment_stats['total']; ?></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">Active:</td>
                    <td style="padding: 8px 0;"><span class="badge badge-success"><?php echo $equipment_stats['active']; ?></span></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">Scrapped:</td>
                    <td style="padding: 8px 0;"><span class="badge badge-danger"><?php echo $equipment_stats['scrapped']; ?></span></td>
                </tr>
            </table>
        </div>
    </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
