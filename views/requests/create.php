<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

require_once __DIR__ . '/../../models/Equipment.php';
require_once __DIR__ . '/../../models/MaintenanceRequest.php';
require_once __DIR__ . '/../../models/MaintenanceTeam.php';
require_once __DIR__ . '/../../models/User.php';

$equipmentModel = new Equipment();
$requestModel = new MaintenanceRequest();
$teamModel = new MaintenanceTeam();
$userModel = new User();

$equipment_list = $equipmentModel->getAll(['status' => 'Active']);
$teams = $teamModel->getAll();
$technicians = $userModel->getByRole(ROLE_TECHNICIAN);

$errors = [];
$success = '';

// Pre-fill equipment if coming from equipment page
$pre_equipment_id = $_GET['equipment_id'] ?? null;
$pre_equipment = null;
if ($pre_equipment_id) {
    $pre_equipment = $equipmentModel->getById($pre_equipment_id);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = [
        'equipment_id' => $_POST['equipment_id'],
        'request_type' => $_POST['request_type'],
        'title' => sanitize($_POST['title']),
        'description' => sanitize($_POST['description']),
        'priority' => $_POST['priority'],
        'maintenance_team_id' => $_POST['maintenance_team_id'] ?: null,
        'assigned_technician_id' => $_POST['assigned_technician_id'] ?: null,
        'scheduled_date' => $_POST['scheduled_date'] ?: null,
        'created_by' => $_SESSION['user_id']
    ];
    
    // Validation
    if (empty($data['equipment_id'])) $errors[] = 'Equipment is required';
    if (empty($data['request_type'])) $errors[] = 'Request type is required';
    if (empty($data['title'])) $errors[] = 'Title is required';
    if (empty($data['description'])) $errors[] = 'Description is required';
    
    if (empty($errors)) {
        $result = $requestModel->create($data);
        if ($result['success']) {
            redirect('views/requests/view.php?id=' . $result['id']);
        } else {
            $errors[] = $result['message'];
        }
    }
}

$page_title = 'Create Maintenance Request';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Create Maintenance Request</h2>
            <a href="kanban.php" class="btn btn-secondary">Back to Kanban</a>
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
        
        <form method="POST" action="" id="requestForm">
            <div class="form-row">
                <div class="form-group">
                    <label for="equipment_id">Equipment *</label>
                    <select id="equipment_id" name="equipment_id" class="form-control" required>
                        <option value="">-- Select Equipment --</option>
                        <?php foreach ($equipment_list as $equipment): ?>
                            <option value="<?php echo $equipment['id']; ?>" 
                                    data-team="<?php echo $equipment['default_maintenance_team_id']; ?>"
                                    data-technician="<?php echo $equipment['default_technician_id']; ?>"
                                    <?php echo ($pre_equipment && $pre_equipment['id'] == $equipment['id']) ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($equipment['name']) . ' (' . htmlspecialchars($equipment['serial_number']) . ')'; ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="request_type">Request Type *</label>
                    <select id="request_type" name="request_type" class="form-control" required>
                        <option value="">-- Select Type --</option>
                        <option value="Corrective">Corrective (Breakdown)</option>
                        <option value="Preventive">Preventive (Scheduled)</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="title">Title *</label>
                <input type="text" id="title" name="title" class="form-control" 
                       value="<?php echo isset($_POST['title']) ? htmlspecialchars($_POST['title']) : ''; ?>" 
                       placeholder="Brief description of the issue or maintenance task" required>
            </div>
            
            <div class="form-group">
                <label for="description">Description *</label>
                <textarea id="description" name="description" class="form-control" required 
                          placeholder="Detailed description of the problem or maintenance requirements"><?php echo isset($_POST['description']) ? htmlspecialchars($_POST['description']) : ''; ?></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="priority">Priority *</label>
                    <select id="priority" name="priority" class="form-control" required>
                        <option value="Low">Low</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="scheduled_date">Scheduled Date</label>
                    <input type="date" id="scheduled_date" name="scheduled_date" class="form-control" 
                           value="<?php echo isset($_POST['scheduled_date']) ? $_POST['scheduled_date'] : ''; ?>">
                    <small class="text-muted">Required for Preventive maintenance</small>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="maintenance_team_id">Maintenance Team</label>
                    <select id="maintenance_team_id" name="maintenance_team_id" class="form-control">
                        <option value="">-- Auto-filled from equipment --</option>
                        <?php foreach ($teams as $team): ?>
                            <option value="<?php echo $team['id']; ?>"
                                    <?php echo ($pre_equipment && $pre_equipment['default_maintenance_team_id'] == $team['id']) ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($team['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="assigned_technician_id">Assigned Technician</label>
                    <select id="assigned_technician_id" name="assigned_technician_id" class="form-control">
                        <option value="">-- Auto-filled from equipment --</option>
                        <?php foreach ($technicians as $tech): ?>
                            <option value="<?php echo $tech['id']; ?>"
                                    <?php echo ($pre_equipment && $pre_equipment['default_technician_id'] == $tech['id']) ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($tech['full_name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
            
            <div class="alert alert-info">
                <strong>Auto-fill Logic:</strong> When you select an equipment, the maintenance team and technician will be automatically filled from the equipment's default settings.
            </div>
            
            <div class="flex gap-10">
                <button type="submit" class="btn btn-primary">Create Request</button>
                <a href="kanban.php" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<script>
// Auto-fill team and technician when equipment is selected
document.getElementById('equipment_id').addEventListener('change', function() {
    const selected = this.options[this.selectedIndex];
    const teamId = selected.getAttribute('data-team');
    const technicianId = selected.getAttribute('data-technician');
    
    const teamSelect = document.getElementById('maintenance_team_id');
    const technicianSelect = document.getElementById('assigned_technician_id');
    
    if (teamId) {
        teamSelect.value = teamId;
    } else {
        teamSelect.value = '';
    }
    
    if (technicianId) {
        technicianSelect.value = technicianId;
    } else {
        technicianSelect.value = '';
    }
});

// Trigger auto-fill on page load if equipment is pre-selected
window.addEventListener('load', function() {
    const equipmentSelect = document.getElementById('equipment_id');
    if (equipmentSelect.value) {
        equipmentSelect.dispatchEvent(new Event('change'));
    }
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
