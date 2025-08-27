<?php
declare(strict_types=1);
$p = parse_url($_POST['f'] ?? '', PHP_URL_PATH) ?? '';
$p = ltrim($p, '/');                       // e.g. "tmpl/login/login.css"
$baseDir = realpath(dirname(__DIR__));     // /var/www/html/vnsmanager
$file = (string) realpath($baseDir . DIRECTORY_SEPARATOR . $p);
sendResponse( ($file && str_starts_with($file, $baseDir . DIRECTORY_SEPARATOR) && is_file($file)) ? true : false);