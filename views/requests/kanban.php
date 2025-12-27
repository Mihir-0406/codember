<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

require_once __DIR__ . '/../../models/MaintenanceRequest.php';

$requestModel = new MaintenanceRequest();

// Get filters
$filters = [];
if (isset($_GET['technician_id'])) $filters['technician_id'] = $_GET['technician_id'];
if (isset($_GET['type'])) $filters['request_type'] = $_GET['type'];

$kanban_data = $requestModel->getKanbanData($filters);

$page_title = 'Kanban Board';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="card-header flex-between">
            <h2 class="card-title">🔧 Maintenance Requests - Kanban Board</h2>
            <a href="create.php" class="btn btn-primary">+ New Request</a>
        </div>
        
        <!-- Filters -->
        <form method="GET" action="" style="margin-bottom: 20px;">
            <div class="form-row">
                <div class="form-group">
                    <label>Filter by Type</label>
                    <select name="type" class="form-control" onchange="this.form.submit()">
                        <option value="">All Types</option>
                        <option value="Corrective" <?php echo isset($_GET['type']) && $_GET['type'] === 'Corrective' ? 'selected' : ''; ?>>Corrective</option>
                        <option value="Preventive" <?php echo isset($_GET['type']) && $_GET['type'] === 'Preventive' ? 'selected' : ''; ?>>Preventive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <?php if (!empty($filters)): ?>
                        <a href="kanban.php" class="btn btn-secondary" style="display: block;">Clear Filters</a>
                    <?php endif; ?>
                </div>
            </div>
        </form>
    </div>
    
    <div class="kanban-board">
        <?php
        $states = ['New', 'In Progress', 'Repaired', 'Scrap'];
        $state_icons = [
            'New' => '📋',
            'In Progress' => '⚙️',
            'Repaired' => '✅',
            'Scrap' => '🗑️'
        ];
        
        foreach ($states as $state):
            $requests = $kanban_data[$state];
            $count = count($requests);
        ?>
        <div class="kanban-column" data-state="<?php echo $state; ?>">
            <div class="kanban-column-header">
                <span><?php echo $state_icons[$state]; ?> <?php echo $state; ?></span>
                <span class="badge badge-secondary"><?php echo $count; ?></span>
            </div>
            
            <div class="kanban-cards-container">
                <?php if (empty($requests)): ?>
                    <p class="text-muted text-sm text-center" style="padding: 20px;">No requests</p>
                <?php else: ?>
                    <?php foreach ($requests as $request): ?>
                        <div class="kanban-card <?php echo $request['is_overdue'] ? 'overdue' : ''; ?>" 
                             data-request-id="<?php echo $request['id']; ?>"
                             data-current-state="<?php echo $state; ?>"
                             onclick="window.location.href='view.php?id=<?php echo $request['id']; ?>'">
                            
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                <span class="badge badge-<?php echo $request['request_type'] === 'Preventive' ? 'info' : 'warning'; ?>">
                                    <?php echo $request['request_type']; ?>
                                </span>
                                <span class="badge badge-secondary text-sm">#<?php echo $request['id']; ?></span>
                            </div>
                            
                            <div class="kanban-card-title">
                                <?php echo htmlspecialchars($request['title']); ?>
                            </div>
                            
                            <div class="text-sm text-muted" style="margin: 8px 0;">
                                <?php echo htmlspecialchars($request['equipment_name']); ?>
                            </div>
                            
                            <?php if ($request['scheduled_date']): ?>
                                <div class="text-sm" style="margin: 5px 0;">
                                    📅 <?php echo date('M d, Y', strtotime($request['scheduled_date'])); ?>
                                    <?php if ($request['is_overdue']): ?>
                                        <span class="badge badge-danger" style="font-size: 0.7rem;">OVERDUE</span>
                                    <?php endif; ?>
                                </div>
                            <?php endif; ?>
                            
                            <div class="kanban-card-meta">
                                <div>
                                    <?php if ($request['technician_name']): ?>
                                        <div class="technician-avatar-small" title="<?php echo htmlspecialchars($request['technician_name']); ?>">
                                            <?php echo $request['avatar_initials']; ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                <span class="badge badge-secondary text-sm"><?php echo $request['priority']; ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<script>
// Drag and Drop functionality
let draggedCard = null;
let draggedRequestId = null;
let originalState = null;

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-column');
    
    // Make cards draggable
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        
        card.addEventListener('dragstart', function(e) {
            draggedCard = this;
            draggedRequestId = this.getAttribute('data-request-id');
            originalState = this.getAttribute('data-current-state');
            this.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        });
        
        card.addEventListener('dragend', function() {
            this.style.opacity = '1';
            draggedCard = null;
        });
        
        // Prevent click when dragging
        card.addEventListener('click', function(e) {
            if (e.defaultPrevented) return;
        });
    });
    
    // Make columns droppable
    columns.forEach(column => {
        column.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.style.background = '#e0e7ff';
        });
        
        column.addEventListener('dragleave', function() {
            this.style.background = '';
        });
        
        column.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.background = '';
            
            const newState = this.getAttribute('data-state');
            
            if (newState !== originalState) {
                // Validate state transition
                const allowed_transitions = {
                    'New': ['In Progress'],
                    'In Progress': ['Repaired', 'Scrap'],
                    'Repaired': [],
                    'Scrap': []
                };
                
                if (allowed_transitions[originalState] && allowed_transitions[originalState].includes(newState)) {
                    if (confirm(`Move request #${draggedRequestId} from "${originalState}" to "${newState}"?`)) {
                        updateRequestState(draggedRequestId, newState);
                    }
                } else {
                    alert(`Invalid transition from "${originalState}" to "${newState}". Please use the allowed state flow:\nNew → In Progress → Repaired/Scrap`);
                }
            }
        });
    });
});

// Update request state via AJAX
function updateRequestState(requestId, newState) {
    fetch('update_state.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `request_id=${requestId}&new_state=${encodeURIComponent(newState)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload the page to show updated state
            window.location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the request state.');
    });
}
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
