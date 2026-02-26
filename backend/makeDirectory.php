<?php
//-------------
// Katakata
//-------------
// A simple note-taking web application
// Backend file for making directories
//-------------

require_once 'index.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $parent_id = filter_input(INPUT_POST, 'parent_id');
  $directory_name = filter_input(INPUT_POST, 'directory_name');

  try {
    $db = new PDO('sqlite:katakata.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ディレクトリを追加
    $stmt = $db->prepare("INSERT INTO directories (parent_id, directory_name) VALUES (?, ?)");
    $stmt->execute([$parent_id, $directory_name]);

    echo json_encode(['status' => 'success']);
  } catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
  }
}