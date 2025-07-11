<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once '/var/www/html/vnsmanager/_/db/db.php';
require_once '/var/www/html/vnsmanager/_/utility/utility.php';
require_once '/var/www/html/vnsmanager/_/utility/lang.php';
?>