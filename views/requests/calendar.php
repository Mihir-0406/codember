<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

require_once __DIR__ . '/../../models/MaintenanceRequest.php';
require_once __DIR__ . '/../../models/Equipment.php';

$requestModel = new MaintenanceRequest();
$equipmentModel = new Equipment();

// Handle date parameters
$year = $_GET['year'] ?? date('Y');
$month = $_GET['month'] ?? date('m');

// Validate year and month
$year = (int)$year;
$month = (int)$month;

if ($month < 1) {
    $month = 12;
    $year--;
} elseif ($month > 12) {
    $month = 1;
    $year++;
}

$calendar_data = $requestModel->getCalendarData($year, $month);

// Calculate previous and next month
$prev_month = $month - 1;
$prev_year = $year;
if ($prev_month < 1) {
    $prev_month = 12;
    $prev_year--;
}

$next_month = $month + 1;
$next_year = $year;
if ($next_month > 12) {
    $next_month = 1;
    $next_year++;
}

// Get first day of month and number of days
$first_day = mktime(0, 0, 0, $month, 1, $year);
$days_in_month = date('t', $first_day);
$day_of_week = date('w', $first_day); // 0 (Sunday) to 6 (Saturday)

// Group events by day
$events_by_day = [];
foreach ($calendar_data as $event) {
    $day = (int)date('d', strtotime($event['scheduled_date']));
    if (!isset($events_by_day[$day])) {
        $events_by_day[$day] = [];
    }
    $events_by_day[$day][] = $event;
}

// Handle quick schedule
$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'quick_schedule') {
    $equipment_id = $_POST['equipment_id'];
    $scheduled_date = $_POST['scheduled_date'];
    
    if ($equipment_id && $scheduled_date) {
        $equipment = $equipmentModel->getById($equipment_id);
        
        $data = [
            'equipment_id' => $equipment_id,
            'request_type' => 'Preventive',
            'title' => 'Scheduled Preventive Maintenance',
            'description' => 'Scheduled maintenance via calendar',
            'priority' => 'Medium',
            'maintenance_team_id' => $equipment['default_maintenance_team_id'],
            'assigned_technician_id' => $equipment['default_technician_id'],
            'scheduled_date' => $scheduled_date,
            'created_by' => $_SESSION['user_id']
        ];
        
        $result = $requestModel->create($data);
        if ($result['success']) {
            $message = 'Preventive maintenance scheduled successfully!';
            // Reload calendar data
            $calendar_data = $requestModel->getCalendarData($year, $month);
            $events_by_day = [];
            foreach ($calendar_data as $event) {
                $day = (int)date('d', strtotime($event['scheduled_date']));
                if (!isset($events_by_day[$day])) {
                    $events_by_day[$day] = [];
                }
                $events_by_day[$day][] = $event;
            }
        }
    }
}

$page_title = 'Maintenance Calendar';
include __DIR__ . '/../includes/header.php';
?>

<div class="container">
    <div class="card">
        <div class="calendar">
            <div class="calendar-header">
                <a href="?year=<?php echo $prev_year; ?>&month=<?php echo $prev_month; ?>" class="btn btn-secondary">← Previous</a>
                <h2><?php echo date('F Y', $first_day); ?></h2>
                <a href="?year=<?php echo $next_year; ?>&month=<?php echo $next_month; ?>" class="btn btn-secondary">Next →</a>
            </div>
            
            <?php if ($message): ?>
                <div class="alert alert-success" style="margin: 20px;"><?php echo $message; ?></div>
            <?php endif; ?>
            
            <div class="alert alert-info" style="margin: 20px;">
                <strong>Calendar View:</strong> This calendar shows only <strong>Preventive</strong> maintenance requests. Click on any date to schedule a new preventive maintenance.
            </div>
            
            <div class="calendar-grid">
                <!-- Day headers -->
                <?php
                $days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                foreach ($days as $day):
                ?>
                    <div class="calendar-day-header"><?php echo $day; ?></div>
                <?php endforeach; ?>
                
                <!-- Empty cells for days before month starts -->
                <?php for ($i = 0; $i < $day_of_week; $i++): ?>
                    <div class="calendar-day" style="background: #f8f9fa;"></div>
                <?php endfor; ?>
                
                <!-- Days of the month -->
                <?php for ($day = 1; $day <= $days_in_month; $day++):
                    $date_str = sprintf('%04d-%02d-%02d', $year, $month, $day);
                    $is_today = ($date_str === date('Y-m-d'));
                    $day_events = $events_by_day[$day] ?? [];
                ?>
                    <div class="calendar-day <?php echo $is_today ? 'today' : ''; ?>" 
                         style="<?php echo $is_today ? 'border: 2px solid var(--primary-color);' : ''; ?>"
                         onclick="showScheduleModal('<?php echo $date_str; ?>')">
                        <div class="calendar-day-number"><?php echo $day; ?></div>
                        
                        <?php foreach ($day_events as $event):
                            $state_colors = [
                                'New' => 'info',
                                'In Progress' => 'warning',
                                'Repaired' => 'success',
                                'Scrap' => 'danger'
                            ];
                            $color = $state_colors[$event['state']] ?? 'secondary';
                        ?>
                            <div class="calendar-event" 
                                 style="background: var(--<?php echo $color; ?>-color); cursor: pointer;"
                                 onclick="event.stopPropagation(); window.location.href='view.php?id=<?php echo $event['id']; ?>';"
                                 title="<?php echo htmlspecialchars($event['title']); ?>">
                                <?php echo htmlspecialchars(substr($event['equipment_name'], 0, 20)); ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endfor; ?>
            </div>
        </div>
    </div>
</div>

<!-- Quick Schedule Modal (Simple JavaScript) -->
<div id="scheduleModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
    <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%;">
        <h3 style="margin-bottom: 20px;">Schedule Preventive Maintenance</h3>
        
        <form method="POST" action="">
            <input type="hidden" name="action" value="quick_schedule">
            <input type="hidden" name="scheduled_date" id="modal_date">
            
            <div class="form-group">
                <label for="equipment_id">Select Equipment *</label>
                <select id="equipment_id" name="equipment_id" class="form-control" required>
                    <option value="">-- Select Equipment --</option>
                    <?php
                    $active_equipment = $equipmentModel->getAll(['status' => 'Active']);
                    foreach ($active_equipment as $equipment):
                    ?>
                        <option value="<?php echo $equipment['id']; ?>">
                            <?php echo htmlspecialchars($equipment['name']) . ' - ' . htmlspecialchars($equipment['serial_number']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn btn-primary">Schedule</button>
                <button type="button" class="btn btn-secondary" onclick="closeScheduleModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<script>
function showScheduleModal(date) {
    document.getElementById('modal_date').value = date;
    const modal = document.getElementById('scheduleModal');
    modal.style.display = 'flex';
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
    document.getElementById('equipment_id').value = '';
}

// Close modal on background click
document.getElementById('scheduleModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeScheduleModal();
    }
});
</script>

<style>
.calendar-day.today {
    background: #eff6ff;
}

.calendar-day:hover {
    background: #f0f9ff;
    cursor: pointer;
}
</style>

<?php include __DIR__ . '/../includes/footer.php'; ?>
