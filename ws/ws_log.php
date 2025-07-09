<?php
require_once '../_/start.php';
header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    $json = json_decode($input, !0);

    if (!is_array($json) || !isset($json['ts'], $json['action'])) {
        throw new Exception('Dati incompleti');
    }

    $day = date('Y-m-d H:i:s', intval($json['ts']) / 1000);
    $action = trim($json['action']);
    $data = json_encode($json['data'] ?? []);

    $db->doQuery('insert_log', [
        'day' => $day,
        'action' => $action,
        'data' => $data
    ]);
    echo json_encode(['ok' => !0]);
} catch (Throwable $e) {
    echo json_encode(['ok' => !1]);
}