<?php
global $db;

// Se la lingua non è già definita
$_SESSION['lang'] ??= (function (): string {
    $default = 'IT';
    $accept = strtolower($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '');
    $langs = explode(',', $accept);

    foreach ($langs as $entry) {
        $code = trim(explode(';', $entry)[0]);
        return match (true) {
            $code === 'es-ar' => 'ESAR',
            str_starts_with($code, 'es') => 'ES',
            str_starts_with($code, 'en') => 'EN',
            default => $default
        };
    }
    return $default;
})();

// Se non esiste la cache o è vuota
if (empty($_SESSION['lang_cache'] ?? [])) {
    $rows = $db->doQuery('load_translations_by_lang', ['lang' => $_SESSION['lang']]);
    $lang_cache = [];
    foreach ($rows as $row) {
        if (isset($row['label']) && isset($row['value'])) {
            $lang_cache[$row['label']] = $row['value'];
        }
    }
    $_SESSION['lang_cache'] = [];
    $_SESSION['lang_cache'] = $lang_cache;
}

?>