<?php
header('Access-Control-Allow-Origin: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

try {
    $input = file_get_contents('php://input');
    if (empty($input)) {
        throw new Exception('Empty payload');
    }
    
    $data = json_decode($input, true, 512, JSON_THROW_ON_ERROR);
    
    // Validazione campi obbligatori
    if (!isset($data['action'])) {
        throw new Exception('Missing action field');
    }
    
    // Elaborazione dati...
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}