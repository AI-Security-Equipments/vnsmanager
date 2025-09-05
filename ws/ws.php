<?php
/**
 * Generic Web Service Dispatcher
 * Routes requests to appropriate service handlers
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    sendResponse(true, [], 'preflight_ok');
}

// Consenti solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    sendResponse(false, [], '', 'method_not_allowed');
}

// Fallback PHP < 8
if (!function_exists('str_starts_with')) {
    function str_starts_with($h,$n){return $n!=='' && strncmp($h,$n,strlen($n))===0;}
}

// Check IP locale
function is_local_ip(string $ip): bool {
    if ($ip === '::1' || str_starts_with($ip, '127.')) return true;
    return (bool)preg_match('/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/', $ip);
}
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
if (!is_local_ip($clientIp)) {
    http_response_code(403);
    sendResponse(false, [], '', 'forbidden');
}

// Definisci costante di protezione
define('WS_DISPATCH', true);

// --- SESSIONE SOLO ORA (se serve cookie utente) ---
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

// --- BOOTSTRAP APP DOPO I CHECK ---
require_once '../_/start.php';

/**
 * Send JSON response
 */
function sendResponse($ok, $data = [], $message = '', $error = '') {
    echo json_encode(['ok' => $ok, 'data' => $data, 'message' => $message, 'error' => $error ]);
    exit;
}

/**
 * Get input
 */
$_SESSION['debug']=!1;
function getRequestData() {
    $ctype = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ctype, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? [];
    }
    return $_POST;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { sendResponse(false, [], '', 'Error type 1.001'); }
//try {
    $input = getRequestData();
    $service = $input['service'] ?? ($_POST['service'] ?? '');

    // Route to appropriate service
    switch ($service) {
        case 'log':
            require_once 'ws_log.php';
            break;
        case 'check':
            require_once 'check.php';
            break;
        case 'lang':
            require_once 'ws_lang.php';
            break;
       case 'login':
            require_once 'ws_login.php';
            break;
        case 'devices':
            require_once 'ws_devices.php';
            break;
        default:
            sendResponse(false, [], '', 'Unknown service');
    }
    
//} catch (Exception $e) {
    //error_log("WS Dispatcher Error: " . $e->getMessage());
    //sendResponse(false, [], '', $e->getMessage());
//    sendResponse(false, [], '', 'Error type 1.002');
//}