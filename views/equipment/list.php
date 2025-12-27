<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

require_once __DIR__ . '/../../models/Equipment.php';
require_once __DIR__ . '/../../models/MaintenanceRequest.php';

$equipmentModel = new Equipment();
$requestModel = new MaintenanceRequest();

$filters = [];
if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
if (isset($_GET['category'])) $filters['category'] = $_GET['category'];
if (isset($_GET['department'])) $filters['department'] = $_GET['department'];

$equipment_list = $equipmentModel->getAll($filters);
$categories = $equipmentModel->getCategories();
$departments = $equipmentModel->getDepartments();
$stats = $equipmentModel->getStatistics();

$page_title = 'Equipment Management';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Equipment</h3>
            <div class="stat-value"><?php echo $stats['total']; ?></div>
        </div>
        <div class="stat-card">
            <h3>Active Equipment</h3>
            <div class="stat-value"><?php echo $stats['active']; ?></div>
        </div>
        <div class="stat-card">
            <h3>Scrapped Equipment</h3>
            <div class="stat-value"><?php echo $stats['scrapped']; ?></div>
        </div>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Equipment List</h2>
            <?php if (hasRole(ROLE_ADMIN) || hasRole(ROLE_MANAGER)): ?>
                <a href="create.php" class="btn btn-primary">+ Add Equipment</a>
            <?php endif; ?>
        </div>
        
        <!-- Filters -->
        <form method="GET" class="mb-20">
            <div class="form-row">
                <div class="form-group">
                    <label>Status</label>
                    <select name="status" class="form-control" onchange="this.form.submit()">
                        <option value="">All Statuses</option>
                        <option value="Active" <?php echo isset($_GET['status']) && $_GET['status'] === 'Active' ? 'selected' : ''; ?>>Active</option>
                        <option value="Scrapped" <?php echo isset($_GET['status']) && $_GET['status'] === 'Scrapped' ? 'selected' : ''; ?>>Scrapped</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select name="category" class="form-control" onchange="this.form.submit()">
                        <option value="">All Categories</option>
                        <?php foreach ($categories as $cat): ?>
                            <option value="<?php echo htmlspecialchars($cat); ?>" 
                                    <?php echo isset($_GET['category']) && $_GET['category'] === $cat ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($cat); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label>Department</label>
                    <select name="department" class="form-control" onchange="this.form.submit()">
                        <option value="">All Departments</option>
                        <?php foreach ($departments as $dept): ?>
                            <option value="<?php echo htmlspecialchars($dept); ?>" 
                                    <?php echo isset($_GET['department']) && $_GET['department'] === $dept ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($dept); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <?php if (!empty($filters)): ?>
                        <a href="list.php" class="btn btn-secondary" style="display: block;">Clear Filters</a>
                    <?php endif; ?>
                </div>
            </div>
        </form>
        
        <?php if (empty($equipment_list)): ?>
            <p class="text-center text-muted">No equipment found.</p>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Serial Number</th>
                        <th>Category</th>
                        <th>Department</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($equipment_list as $equipment): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($equipment['name']); ?></td>
                            <td><code><?php echo htmlspecialchars($equipment['serial_number']); ?></code></td>
                            <td><?php echo htmlspecialchars($equipment['category']); ?></td>
                            <td><?php echo htmlspecialchars($equipment['department']); ?></td>
                            <td><?php echo htmlspecialchars($equipment['physical_location']); ?></td>
                            <td>
                                <span class="badge badge-<?php echo $equipment['status'] === 'Active' ? 'success' : 'danger'; ?>">
                                    <?php echo $equipment['status']; ?>
                                </span>
                            </td>
                            <td>
                                <div class="flex gap-10">
                                    <a href="view.php?id=<?php echo $equipment['id']; ?>" class="btn btn-sm btn-secondary">View</a>
                                    <?php if (hasRole(ROLE_ADMIN) || hasRole(ROLE_MANAGER)): ?>
                                        <a href="edit.php?id=<?php echo $equipment['id']; ?>" class="btn btn-sm btn-primary">Edit</a>
                                    <?php endif; ?>
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
