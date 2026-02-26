import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

// types derived from API structure
export interface Note {
  id: number
  parent_directory: string
  name: string
  item_number: string
  count: number
  remaining_number: number
  remaining_count: number
  created_at: string
  updated_at: string
}

export interface Directory {
  id: number
  parent_id: number | null
  directory_name: string
  children: Directory[]
  notes: Note[]
}

interface TreeResponse {
  tree: Directory[]
  rootNotes: Note[]
}

const fetchTree = async (): Promise<TreeResponse> => {
  const url = `${import.meta.env.VITE_API_URL}/backend/getTree.php`;
  const res = await axios.get<TreeResponse>(url);
  return res.data;
}

const DirectoryTree: React.FC = () => {
  const { data, isLoading, error } = useQuery<TreeResponse>({
    queryKey: ['directoryTree'],
    queryFn: fetchTree,
  });

  if (isLoading) return <div>Loading directories...</div>;
  if (error) return <div>Failed to load directory structure</div>;

  const renderDir = (dir: Directory) => (
    <li key={dir.id}>
      <strong>{dir.directory_name}</strong>
      {dir.notes && dir.notes.length > 0 && (
        <ul>
          {dir.notes.map(note => (
            <li key={note.id}>
              {note.name} {note.item_number && `(#${note.item_number})`} x{note.count}
            </li>
          ))}
        </ul>
      )}
      {dir.children && dir.children.length > 0 && (
        <ul>{dir.children.map(child => renderDir(child))}</ul>
      )}
    </li>
  );

  return (
    <>
      {data?.rootNotes && data.rootNotes.length > 0 && (
        <div>
          <h2>Unassigned items</h2>
          <ul>
            {data.rootNotes.map(note => (
              <li key={note.id}>
                {note.name} {note.item_number && `(#${note.item_number})`} x{note.count}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul>{data?.tree.map(dir => renderDir(dir))}</ul>
    </>
  );
}

export default DirectoryTree
