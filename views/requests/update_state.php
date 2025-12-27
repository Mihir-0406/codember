<?php
require_once __DIR__ . '/../../config/config.php';
requireLogin();

require_once __DIR__ . '/../../models/MaintenanceRequest.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$request_id = $_POST['request_id'] ?? null;
$new_state = $_POST['new_state'] ?? null;

if (!$request_id || !$new_state) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

$requestModel = new MaintenanceRequest();
$result = $requestModel->updateState($request_id, $new_state, 'Updated via Kanban board');

echo json_encode($result);
