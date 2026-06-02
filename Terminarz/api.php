<?php
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $year = $_GET['year'] ?? null;
    $month = $_GET['month'] ?? null;

    if (!$year || !$month) {
        http_response_code(400);
        echo json_encode(['error' => 'Brak roku lub miesiąca']);
        exit;
    }

    $startDate = "{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01 00:00:00";
    $endDate = "{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-31 23:59:59";

    $stmt = $pdo->prepare('SELECT id, type, title, DATE_FORMAT(event_date, "%Y-%m-%d %H:%i") as event_date, description FROM events WHERE event_date BETWEEN ? AND ? ORDER BY event_date ASC');
    $stmt->execute([$startDate, $endDate]);
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $type = $input['type'] ?? null;
    $title = $input['title'] ?? null;
    $event_date = $input['event_date'] ?? null;
    $description = !empty($input['description']) ? $input['description'] : null;

    if (!$type || !$title || !$event_date) {
        http_response_code(400);
        echo json_encode(['error' => 'Wymagane pola są puste']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO events (type, title, event_date, description) VALUES (?, ?, ?, ?)');
    $stmt->execute([$type, $title, $event_date, $description]);

    http_response_code(201); 
    echo json_encode(['message' => 'Zdarzenie dodane do bazy MySQL']);
    exit;
}


if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Brak ID wydarzenia']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
    $stmt->execute([$id]);

    echo json_encode(['status' => 'success', 'message' => 'Usunięto']);
    exit;
}
?>