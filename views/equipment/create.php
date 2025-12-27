<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

if (!hasRole(ROLE_ADMIN) && !hasRole(ROLE_MANAGER)) {
    die("Access Denied");
}

require_once __DIR__ . '/../../models/Equipment.php';
require_once __DIR__ . '/../../models/MaintenanceTeam.php';
require_once __DIR__ . '/../../models/User.php';

$equipmentModel = new Equipment();
$teamModel = new MaintenanceTeam();
$userModel = new User();

$teams = $teamModel->getAll();
$technicians = $userModel->getByRole(ROLE_TECHNICIAN);

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate input
    $data = [
        'name' => sanitize($_POST['name']),
        'serial_number' => sanitize($_POST['serial_number']),
        'category' => sanitize($_POST['category']),
        'department' => sanitize($_POST['department']),
        'assigned_employee' => sanitize($_POST['assigned_employee']),
        'purchase_date' => $_POST['purchase_date'] ?: null,
        'warranty_expiry' => $_POST['warranty_expiry'] ?: null,
        'physical_location' => sanitize($_POST['physical_location']),
        'default_maintenance_team_id' => $_POST['default_maintenance_team_id'] ?: null,
        'default_technician_id' => $_POST['default_technician_id'] ?: null,
        'status' => $_POST['status']
    ];
    
    // Validation
    if (empty($data['name'])) $errors[] = 'Equipment name is required';
    if (empty($data['serial_number'])) $errors[] = 'Serial number is required';
    if ($equipmentModel->serialNumberExists($data['serial_number'])) {
        $errors[] = 'Serial number already exists';
    }
    if (empty($data['category'])) $errors[] = 'Category is required';
    if (empty($data['department'])) $errors[] = 'Department is required';
    
    if (empty($errors)) {
        $result = $equipmentModel->create($data);
        if ($result) {
            $success = 'Equipment created successfully!';
            $_POST = []; // Clear form
        } else {
            $errors[] = 'Failed to create equipment';
        }
    }
}

$page_title = 'Add Equipment';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Add New Equipment</h2>
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
        
        <?php if ($success): ?>
            <div class="alert alert-success"><?php echo $success; ?></div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <div class="form-row">
                <div class="form-group">
                    <label for="name">Equipment Name *</label>
                    <input type="text" id="name" name="name" class="form-control" 
                           value="<?php echo isset($_POST['name']) ? htmlspecialchars($_POST['name']) : ''; ?>" required>
                </div>
                
                <div class="form-group">
                    <label for="serial_number">Serial Number *</label>
                    <input type="text" id="serial_number" name="serial_number" class="form-control" 
                           value="<?php echo isset($_POST['serial_number']) ? htmlspecialchars($_POST['serial_number']) : ''; ?>" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="category">Category *</label>
                    <input type="text" id="category" name="category" class="form-control" 
                           value="<?php echo isset($_POST['category']) ? htmlspecialchars($_POST['category']) : ''; ?>" 
                           placeholder="e.g., Machinery, IT Equipment, HVAC" required>
                </div>
                
                <div class="form-group">
                    <label for="department">Department *</label>
                    <input type="text" id="department" name="department" class="form-control" 
                           value="<?php echo isset($_POST['department']) ? htmlspecialchars($_POST['department']) : ''; ?>" 
                           placeholder="e.g., Production, IT, Facility" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="assigned_employee">Assigned Employee</label>
                    <input type="text" id="assigned_employee" name="assigned_employee" class="form-control" 
                           value="<?php echo isset($_POST['assigned_employee']) ? htmlspecialchars($_POST['assigned_employee']) : ''; ?>">
                </div>
                
                <div class="form-group">
                    <label for="physical_location">Physical Location</label>
                    <input type="text" id="physical_location" name="physical_location" class="form-control" 
                           value="<?php echo isset($_POST['physical_location']) ? htmlspecialchars($_POST['physical_location']) : ''; ?>" 
                           placeholder="e.g., Building A, Floor 2">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="purchase_date">Purchase Date</label>
                    <input type="date" id="purchase_date" name="purchase_date" class="form-control" 
                           value="<?php echo isset($_POST['purchase_date']) ? $_POST['purchase_date'] : ''; ?>">
                </div>
                
                <div class="form-group">
                    <label for="warranty_expiry">Warranty Expiry</label>
                    <input type="date" id="warranty_expiry" name="warranty_expiry" class="form-control" 
                           value="<?php echo isset($_POST['warranty_expiry']) ? $_POST['warranty_expiry'] : ''; ?>">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="default_maintenance_team_id">Default Maintenance Team</label>
                    <select id="default_maintenance_team_id" name="default_maintenance_team_id" class="form-control">
                        <option value="">-- Select Team --</option>
                        <?php foreach ($teams as $team): ?>
                            <option value="<?php echo $team['id']; ?>" 
                                    <?php echo isset($_POST['default_maintenance_team_id']) && $_POST['default_maintenance_team_id'] == $team['id'] ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($team['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="default_technician_id">Default Technician</label>
                    <select id="default_technician_id" name="default_technician_id" class="form-control">
                        <option value="">-- Select Technician --</option>
                        <?php foreach ($technicians as $tech): ?>
                            <option value="<?php echo $tech['id']; ?>" 
                                    <?php echo isset($_POST['default_technician_id']) && $_POST['default_technician_id'] == $tech['id'] ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($tech['full_name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="status">Status *</label>
                <select id="status" name="status" class="form-control" required>
                    <option value="Active" <?php echo (!isset($_POST['status']) || $_POST['status'] === 'Active') ? 'selected' : ''; ?>>Active</option>
                    <option value="Scrapped" <?php echo isset($_POST['status']) && $_POST['status'] === 'Scrapped' ? 'selected' : ''; ?>>Scrapped</option>
                </select>
            </div>
            
            <div class="flex gap-10">
                <button type="submit" class="btn btn-primary">Create Equipment</button>
                <a href="list.php" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
