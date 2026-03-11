<?php
// deleteItem.php
// removes one note/item by id

require_once 'index.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
  if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'id required']);
    exit;
  }

  try {
    $db = new PDO('sqlite:katakata.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("DELETE FROM notes WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['status' => 'success', 'deleted' => $id]);
  } catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
  }
} else {
  echo json_encode(['status' => 'error', 'message' => 'POST required']);
}
