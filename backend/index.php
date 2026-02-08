<?php
//-------------
// Katakata
//-------------
// A simple note-taking web application
// Backend file
//-------------

// なければDB作成
if (!file_exists('katakata.db')){
  $dbname = 'katakata.db';
  try {
    $db = new PDO('sqlite:'.$dbname);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- ID
      parent_id INTEGER, -- 親ノートID
      name TEXT, -- 名前
      item_number TEXT, -- 型番
      count INTEGER, -- 数量
      remaining_number INTEGER, -- 残数
      remaining_count INTEGER, -- 残量
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    echo 'DB created';
  } catch (PDOException $e) {
    echo "Database error: " . $e->getMessage();
    exit();
  }
}
