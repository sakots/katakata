<?php
//-------------
// Katakata
//-------------
// A simple note-taking web application
// Backend file for making directories
//-------------

// ensure database exists and tables are created
require_once 'index.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $parent_id = filter_input(INPUT_POST, 'parent_id');
  $directory_name = filter_input(INPUT_POST, 'directory_name');
  // convert empty string to null so SQLite doesn't insert 0
  if ($parent_id === '' || $parent_id === false) {
    $parent_id = null;
  }

  try {
    $db = new PDO('sqlite:katakata.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ディレクトリを追加
    error_log("makeDirectory called with parent_id=" . var_export($parent_id, true) . ", name=" . $directory_name);
    $stmt = $db->prepare("INSERT INTO directories (parent_id, directory_name) VALUES (?, ?)");
    $stmt->execute([$parent_id, $directory_name]);

    // 追加した行を取得して返す（デバッグとフロントエンド更新のため）
    $newId = $db->lastInsertId();
    $stmt2 = $db->prepare("SELECT * FROM directories WHERE id = ?");
    $stmt2->execute([$newId]);
    $inserted = $stmt2->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'directory' => $inserted]);
  } catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
  }
}