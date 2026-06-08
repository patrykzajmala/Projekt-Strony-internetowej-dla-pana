<?php

$host = '127.0.0.1';
$db   = 'terminarz_db';
$user = 'root';
$pass = ''; // W XAMPP domyślnie puste. Jeśli masz hasło, wpisz je tu.
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     header('Content-Type: application/json');
     echo json_encode(['error' => 'Błąd bazy danych: ' . $e->getMessage()]);
     exit;
}?>