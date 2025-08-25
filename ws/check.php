<?php
declare(strict_types=1);
$p = parse_url($_GET['f'] ?? '', PHP_URL_PATH) ?? '';
$p = ltrim($p, '/');                       // e.g. "tmpl/login/login.css"
$baseDir = realpath(dirname(__DIR__));     // /var/www/html/vnsmanager
$file = realpath($baseDir . DIRECTORY_SEPARATOR . $p);

// must exist AND stay inside baseDir
if ($file && str_starts_with($file, $baseDir . DIRECTORY_SEPARATOR) && is_file($file)) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo '1';
} else {
    header('Content-Type: text/plain; charset=UTF-8');
    echo '0';
}