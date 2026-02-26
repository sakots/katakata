<?php
// make sure database/table exist
require_once 'index.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
  $db = new PDO('sqlite:katakata.db');
  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $stmt = $db->query("SELECT * FROM directories");
  $dirs = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $stmt = $db->query("SELECT * FROM notes");
  $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // build directory map with children and notes
  $byId = [];
  foreach ($dirs as $dir) {
    $dir['children'] = [];
    $dir['notes'] = [];
    $byId[$dir['id']] = $dir;
  }

  // attach notes to directories based on parent_directory (id or name)
  $rootNotes = [];
  foreach ($notes as $note) {
    $parent = null;
    if (is_numeric($note['parent_directory']) && isset($byId[(int)$note['parent_directory']])) {
      $parent = &$byId[(int)$note['parent_directory']];
    } else {
      foreach ($byId as &$d) {
        if ($d['directory_name'] === $note['parent_directory']) {
          $parent = &$d;
          break;
        }
      }
    }

    if ($parent) {
      $parent['notes'][] = $note;
    } else {
      // no matching directory, treat as root-level note
      $rootNotes[] = $note;
    }
  }

  // build tree
  $tree = [];
  foreach ($byId as $id => &$dir) {
    if ($dir['parent_id'] !== null && isset($byId[$dir['parent_id']])) {
      $byId[$dir['parent_id']]['children'][] = &$dir;
    } else {
      $tree[] = &$dir;
    }
  }

  echo json_encode(['tree' => $tree, 'rootNotes' => $rootNotes]);
} catch (PDOException $e) {
  echo json_encode(['error' => $e->getMessage()]);
}
