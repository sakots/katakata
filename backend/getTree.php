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
  // filter out any malformed rows (e.g. id null)
  $dirs = array_filter($dirs, function($d) {
    return is_array($d) && isset($d['id']) && $d['id'] !== null && $d['id'] !== '';
  });

  $stmt = $db->query("SELECT * FROM notes");
  $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // build directory map with children and notes (no references)
  // since hierarchy is disabled we ignore any parent relationships
  $byId = [];
  foreach ($dirs as $dir) {
    if (!is_array($dir)) continue;
    $id = (int)$dir['id'];
    $byId[$id] = [
      'id' => $id,
      // parent_id kept for compatibility but not used
      'parent_id' => null,
      'directory_name' => $dir['directory_name'],
      'created_at' => $dir['created_at'],
      'updated_at' => $dir['updated_at'],
      'children' => [],
      'notes' => [],
    ];
  }

  // attach notes to directories based on parent_directory (id or name)
  $rootNotes = [];
  foreach ($notes as $note) {
    $parentId = null;
    if (is_numeric($note['parent_directory'])) {
      $parentId = (int)$note['parent_directory'];
    }
    if ($parentId !== null && isset($byId[$parentId])) {
      $byId[$parentId]['notes'][] = $note;
    } else {
      // try matching by name
      $found = false;
      foreach ($byId as &$d) {
        if ($d['directory_name'] === $note['parent_directory']) {
          $d['notes'][] = $note;
          $found = true;
          break;
        }
      }
      if (!$found) {
        $rootNotes[] = $note;
      }
    }
  }

  // build tree without references. with hierarchy disabled we simply return all directories as roots
  $tree = array_values($byId);

  echo json_encode(['tree' => $tree, 'rootNotes' => $rootNotes]);
} catch (PDOException $e) {
  echo json_encode(['error' => $e->getMessage()]);
}
