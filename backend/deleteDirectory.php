<?php
// deleteDirectory.php
// removes one directory row by id; notes can become root notes

require_once 'index.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $id = filter_input(INPUT_POST, 'id');
  if ($id === null || $id === false || !is_numeric($id)) {
    echo json_encode(['status' => 'error', 'message' => 'invalid id']);
    exit;
  }
  $id = (int)$id;

  try {
    $db = new PDO('sqlite:katakata.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("DELETE FROM directories WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['status' => 'success', 'deleted' => $id]);
  } catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
  }
} else {
  echo json_encode(['status' => 'error', 'message' => 'POST required']);
}
