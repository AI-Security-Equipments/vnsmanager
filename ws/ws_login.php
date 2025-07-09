<?php
require_once '../_/start.php';
header('Content-Type: application/json');

$lang = $_SESSION['lang_cache'] ?? [];
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts'] = [];
    $_SESSION['login_block'] = [];
}

$failCount = &$_SESSION['login_attempts'][$username];
$failBlock = $_SESSION['login_block'][$username] ?? 0;

if ($username === '' || $password === '') {
    $failCount = ($failCount ?? 0) + 1;
    if ($failCount >= 5) {
        $_SESSION['login_block'][$username] = time();
    }
    echo json_encode([
        'ok' => false,
        'error' => $lang['login_missing'] ?? 'Credenziali mancanti',
        'attempts' => max(0, 5 - $failCount)
    ]);
    exit;
}

if (($failCount ?? 0) >= 5 && time() - $failBlock < 1800) {
    echo json_encode([
        'ok' => false,
        'error' => $lang['login_blocked'] ?? 'Troppi tentativi. Attendere 30 minuti.',
        'attempts' => 0
    ]);
    exit;
}

// Carica dati utente dal DB
$u = $db->doQuery('login_user_by_username', ['username' => $username])[0] ?? null;

if (!$u) {
    $failCount = ($failCount ?? 0) + 1;
    if ($failCount >= 5) {
        $_SESSION['login_block'][$username] = time();
    }
    echo json_encode([
        'ok' => false,
        'error' => $lang['login_invalid'] ?? 'Utente sconosciuto o disattivato',
        'attempts' => max(0, 5 - $failCount)
    ]);
    exit;
}

// Blocco utente reale
if ($u['IU_attempt'] >= 5) {
    $lastFail = strtotime($u['IU_blocked_until'] ?? '2000-01-01');
    if (time() - $lastFail < 1800) {
        echo json_encode([
            'ok' => false,
            'error' => $lang['login_blocked'] ?? 'Troppi tentativi. Attendere 30 minuti.',
            'attempts' => 0
        ]);
        exit;
    } else {
        // Sblocco automatico
        $db->doQuery('unlock_user', [
            'IU_attempt' => 0,
            'IU_id' => (int)$u['IU_id']
        ]);
    }
}

// Verifica password
$hash = hash('sha256', $password . $u['IU_salt']);
if ($hash !== $u['IU_password']) {
    $newAttempt = $u['IU_attempt'] + 1;
    $db->doQuery('increase_attempts', [
        'IU_attempt' => $newAttempt,
        'IU_last_attempt' => date('Y-m-d H:i:s'),
        'IU_id' => (int)$u['IU_id']
    ]);
    echo json_encode([
        'ok' => false,
        'error' => $lang['login_wrong'] ?? 'User o password errata',
        'attempts' => max(0, 5 - $newAttempt)
    ]);
    exit;
}

// Verifica contratto
$end = $u['contract_end'];
if ($u['contract_type'] === null || ($end && strtotime($end) < time())) {
    echo json_encode([
        'ok' => false,
        'error' => $lang['login_contract_invalid'] ?? 'Contratto non valido o scaduto',
        'attempts' => max(0, 5 - (int)$u['IU_attempt'])
    ]);
    exit;
}

// Login valido → reset
$db->doQuery('user_logged_and_cative', [
    'IU_id' => (int)$u['IU_id']
]);
unset($_SESSION['login_attempts'][$username]);
unset($_SESSION['login_block'][$username]);

$_SESSION['u'] = $u['IU_id'];
$_SESSION['contract_type'] = $u['contract_type'];

echo json_encode([
    'ok' => true,
    'attempts' => 5
]);
