<?php
//-------------
// Katakata
//-------------
// Backend file for updating an existing note/item
//-------------

// ensure database exists and tables are created
require_once 'index.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
  $remaining_number = filter_input(INPUT_POST, 'remaining_number');
  $remaining_count = filter_input(INPUT_POST, 'remaining_count', FILTER_VALIDATE_INT);

  if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'id required']);
    exit;
  }

  try {
    $db = new PDO('sqlite:katakata.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare(
      "UPDATE notes SET remaining_number = ?, remaining_count = ? WHERE id = ?"
    );
    $stmt->execute([$remaining_number, $remaining_count, $id]);

    echo json_encode(['status' => 'success']);
  } catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
  }
}
