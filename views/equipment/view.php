<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

require_once __DIR__ . '/../../models/Equipment.php';
require_once __DIR__ . '/../../models/MaintenanceRequest.php';

$equipmentModel = new Equipment();
$requestModel = new MaintenanceRequest();

$id = $_GET['id'] ?? null;
if (!$id) {
    redirect('views/equipment/list.php');
}

$equipment = $equipmentModel->getById($id);
if (!$equipment) {
    die("Equipment not found");
}

// Get maintenance requests for this equipment
$requests = $requestModel->getAll(['equipment_id' => $id]);
$open_count = $requestModel->countOpenRequestsForEquipment($id);

$page_title = 'Equipment Details';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header flex-between">
            <h2 class="card-title"><?php echo htmlspecialchars($equipment['name']); ?></h2>
            <div class="flex gap-10">
                <a href="list.php" class="btn btn-secondary">Back to List</a>
                <?php if (hasRole(ROLE_ADMIN) || hasRole(ROLE_MANAGER)): ?>
                    <a href="edit.php?id=<?php echo $equipment['id']; ?>" class="btn btn-primary">Edit</a>
                <?php endif; ?>
                <a href="#maintenance-requests" class="btn btn-success">
                    Maintenance 
                    <?php if ($open_count > 0): ?>
                        <span class="badge badge-warning" style="margin-left: 5px;"><?php echo $open_count; ?></span>
                    <?php endif; ?>
                </a>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div>
                <h3 style="margin-bottom: 15px; color: var(--secondary-color);">Basic Information</h3>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Serial Number:</td>
                        <td style="padding: 8px 0;"><code><?php echo htmlspecialchars($equipment['serial_number']); ?></code></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Category:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($equipment['category']); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Department:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($equipment['department']); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Status:</td>
                        <td style="padding: 8px 0;">
                            <span class="badge badge-<?php echo $equipment['status'] === 'Active' ? 'success' : 'danger'; ?>">
                                <?php echo $equipment['status']; ?>
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div>
                <h3 style="margin-bottom: 15px; color: var(--secondary-color);">Assignment & Location</h3>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Assigned Employee:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($equipment['assigned_employee'] ?: 'Not assigned'); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Physical Location:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($equipment['physical_location'] ?: 'Not specified'); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Default Team:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($equipment['team_name'] ?: 'Not assigned'); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Default Technician:</td>
                        <td style="padding: 8px 0;"><?php echo htmlspecialchars($equipment['technician_name'] ?: 'Not assigned'); ?></td>
                    </tr>
                </table>
            </div>
            
            <div>
                <h3 style="margin-bottom: 15px; color: var(--secondary-color);">Dates & Warranty</h3>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Purchase Date:</td>
                        <td style="padding: 8px 0;"><?php echo $equipment['purchase_date'] ? date('M d, Y', strtotime($equipment['purchase_date'])) : 'Not specified'; ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Warranty Expiry:</td>
                        <td style="padding: 8px 0;">
                            <?php 
                            if ($equipment['warranty_expiry']) {
                                $expiry = strtotime($equipment['warranty_expiry']);
                                $today = time();
                                $is_expired = $expiry < $today;
                                echo date('M d, Y', $expiry);
                                if ($is_expired) {
                                    echo ' <span class="badge badge-danger">Expired</span>';
                                } else {
                                    echo ' <span class="badge badge-success">Valid</span>';
                                }
                            } else {
                                echo 'Not specified';
                            }
                            ?>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Created:</td>
                        <td style="padding: 8px 0;"><?php echo date('M d, Y', strtotime($equipment['created_at'])); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Last Updated:</td>
                        <td style="padding: 8px 0;"><?php echo date('M d, Y', strtotime($equipment['updated_at'])); ?></td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
    
    <!-- Maintenance Requests Section -->
    <div class="card" id="maintenance-requests">
        <div class="card-header flex-between">
            <h2 class="card-title">
                Maintenance Requests 
                <span class="badge badge-secondary"><?php echo count($requests); ?> Total</span>
                <?php if ($open_count > 0): ?>
                    <span class="badge badge-warning"><?php echo $open_count; ?> Open</span>
                <?php endif; ?>
            </h2>
            <?php if ($equipment['status'] === 'Active'): ?>
                <a href="../requests/create.php?equipment_id=<?php echo $equipment['id']; ?>" class="btn btn-primary">+ New Request</a>
            <?php else: ?>
                <span class="text-muted">Equipment is scrapped - no new requests allowed</span>
            <?php endif; ?>
        </div>
        
        <?php if (empty($requests)): ?>
            <p class="text-center text-muted">No maintenance requests found for this equipment.</p>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>State</th>
                        <th>Technician</th>
                        <th>Scheduled</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($requests as $request): ?>
                        <tr>
                            <td><span class="badge badge-<?php echo $request['request_type'] === 'Preventive' ? 'info' : 'warning'; ?>"><?php echo $request['request_type']; ?></span></td>
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
                            <td><?php echo htmlspecialchars($request['technician_name'] ?: 'Not assigned'); ?></td>
                            <td><?php echo $request['scheduled_date'] ? date('M d, Y', strtotime($request['scheduled_date'])) : '-'; ?></td>
                            <td><?php echo date('M d, Y', strtotime($request['created_at'])); ?></td>
                            <td>
                                <a href="../requests/view.php?id=<?php echo $request['id']; ?>" class="btn btn-sm btn-secondary">View</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
