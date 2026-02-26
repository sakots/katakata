<?php
//-------------
// Katakata
//-------------
// Backend file for adding items/notes
//-------------

// ensure database exists and tables are created
require_once 'index.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $parent_directory = isset($_POST['parent_directory']) ? $_POST['parent_directory'] : null;
  $name = filter_input(INPUT_POST, 'name');
  $item_number = filter_input(INPUT_POST, 'item_number');
  $count = filter_input(INPUT_POST, 'count', FILTER_VALIDATE_INT);
  $remaining_number = filter_input(INPUT_POST, 'remaining_number');
  $remaining_count = filter_input(INPUT_POST, 'remaining_count', FILTER_VALIDATE_INT);

  // simple validation
  if (!$name) {
    echo json_encode(['status' => 'error', 'message' => 'name required']);
    exit;
  }
  if ($item_number === null) {
    // allow empty string but not missing
    echo json_encode(['status' => 'error', 'message' => 'item_number missing']);
    exit;
  }

  try {
    $db = new PDO('sqlite:katakata.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // アイテムを追加
    $stmt = $db->prepare(
      "INSERT INTO notes (parent_directory, name, item_number, count, remaining_number, remaining_count) VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$parent_directory, $name, $item_number, $count, $remaining_number, $remaining_count]);
    $newId = $db->lastInsertId();

    // 追加した行を取得して返す
    $row = $db->query("SELECT * FROM notes WHERE id = $newId")->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'item' => $row]);
  } catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
  }
}
