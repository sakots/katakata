import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const envBase = import.meta.env.VITE_API_URL ?? '';
  const base = String(envBase).replace(/\/$/, '');
  let url = '';
  if (!base) {
    url = '/backend/getTree.php';
  } else if (base.endsWith('/backend')) {
    url = `${base}/getTree.php`;
  } else {
    url = `${base}/backend/getTree.php`;
  }
  const res = await axios.get<TreeResponse>(url);
  return res.data;
}

const DirectoryTree: React.FC = () => {
  const queryClient = useQueryClient();
  const [showNewDirForm, setShowNewDirForm] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [newDirParentId, setNewDirParentId] = useState<number | null>(null);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [itemParentDir, setItemParentDir] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    item_number: '',
    count: 1,
    remaining_number: '',
    remaining_count: 1,
  });

  const { data, isLoading, error } = useQuery<TreeResponse>({
    queryKey: ['directoryTree'],
    queryFn: fetchTree,
  });

  // Create directory mutation
  const createDirMutation = useMutation({
    mutationFn: async (newDir: { parent_id: number | null; name: string }) =>
      axios.post(
        `${import.meta.env.VITE_API_URL}/makeDirectory.php`,
        new URLSearchParams({
          parent_id: newDir.parent_id?.toString() || '',
          directory_name: newDir.name,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryTree'] });
      setShowNewDirForm(false);
      setNewDirName('');
      setNewDirParentId(null);
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (item: { parent_directory: number | null; name: string; item_number: string; count: number; remaining_number: string; remaining_count: number }) =>
      axios.post(
        `${import.meta.env.VITE_API_URL}/addItem.php`,
        new URLSearchParams({
          parent_directory: item.parent_directory?.toString() || '',
          name: item.name,
          item_number: item.item_number,
          count: item.count.toString(),
          remaining_number: item.remaining_number,
          remaining_count: item.remaining_count.toString(),
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryTree'] });
      setShowNewItemForm(false);
      setItemParentDir(null);
      setNewItem({
        name: '',
        item_number: '',
        count: 1,
        remaining_number: '',
        remaining_count: 1,
      });
    },
  });

  if (isLoading) return <div>L読み込み中…</div>;
  if (error) return <div>読み込みに失敗しました</div>;

  const renderDir = (dir: Directory) => (
    <li key={dir.id}>
      <div style={{marginBottom: '8px'}}>
        <strong>{dir.directory_name}</strong>
        <button
          onClick={() => {
            setNewDirParentId(dir.id);
            setShowNewDirForm(true);
          }}
          style={{marginLeft: '8px', fontSize: '0.9em'}}
        >
          +フォルダ
        </button>
        <button
          onClick={() => {
            setItemParentDir(dir.id);
            setShowNewItemForm(true);
          }}
          style={{marginLeft: '4px', fontSize: '0.9em'}}
        >
          +アイテム
        </button>
      </div>
      {dir.notes && dir.notes.length > 0 && (
        <ul>
          {dir.notes?.map(note => (
            <li key={note.id}>
              {note.name} {note.item_number && `(#${note.item_number})`} x{note.count} (残: {note.remaining_count})
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
      <div style={{marginBottom: '20px'}}>
        <button
          onClick={() => {
            setNewDirParentId(null);
            setShowNewDirForm(true);
          }}
          style={{fontSize: '1em', padding: '8px 16px'}}
        >
          + 新規ディレクトリ
        </button>
        <button
          onClick={() => {
            setItemParentDir(null);
            setShowNewItemForm(true);
          }}
          style={{marginLeft: '8px', fontSize: '1em', padding: '8px 16px'}}
        >
          + 新規アイテム
        </button>
      </div>

      {/* Create directory form */}
      {showNewDirForm && (
        <div style={{border: '1px solid #ccc', padding: '12px', marginBottom: '20px', borderRadius: '4px'}}>
          <h3>ディレクトリを作成</h3>
          <input
            type="text"
            placeholder="ディレクトリ名"
            value={newDirName}
            onChange={(e) => setNewDirName(e.target.value)}
            style={{marginRight: '8px', padding: '4px'}}
          />
          <button
            onClick={() =>
              createDirMutation.mutate({
                parent_id: newDirParentId,
                name: newDirName,
              })
            }
            disabled={!newDirName || createDirMutation.isPending}
          >
            {createDirMutation.isPending ? '作成中...' : '作成'}
          </button>
          <button
            onClick={() => setShowNewDirForm(false)}
            style={{marginLeft: '4px'}}
          >
            キャンセル
          </button>
          {createDirMutation.isError && (
            <div style={{color: 'red', marginTop: '8px'}}>エラーが発生しました</div>
          )}
        </div>
      )}

      {/* Create item form */}
      {showNewItemForm && (
        <div style={{border: '1px solid #ccc', padding: '12px', marginBottom: '20px', borderRadius: '4px'}}>
          <h3>アイテムを追加</h3>
          <div style={{marginBottom: '8px'}}>
            <input
              type="text"
              placeholder="名前"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              style={{marginRight: '8px', padding: '4px', width: '200px'}}
            />
          </div>
          <div style={{marginBottom: '8px'}}>
            <input
              type="text"
              placeholder="型番"
              value={newItem.item_number}
              onChange={(e) => setNewItem({...newItem, item_number: e.target.value})}
              style={{marginRight: '8px', padding: '4px', width: '150px'}}
            />
          </div>
          <div style={{marginBottom: '8px'}}>
            <label style={{marginRight: '8px'}}>数量：</label>
            <input
              type="number"
              value={newItem.count}
              onChange={(e) => setNewItem({...newItem, count: parseInt(e.target.value) || 0})}
              style={{padding: '4px', width: '80px'}}
            />
          </div>
          <div style={{marginBottom: '8px'}}>
            <input
              type="text"
              placeholder="残数"
              value={newItem.remaining_number}
              onChange={(e) => setNewItem({...newItem, remaining_number: e.target.value})}
              style={{marginRight: '8px', padding: '4px', width: '150px'}}
            />
          </div>
          <div style={{marginBottom: '12px'}}>
            <label style={{marginRight: '8px'}}>残量：</label>
            <input
              type="number"
              value={newItem.remaining_count}
              onChange={(e) => setNewItem({...newItem, remaining_count: parseInt(e.target.value) || 0})}
              style={{padding: '4px', width: '80px'}}
            />
          </div>
          <button
            onClick={() =>
              createItemMutation.mutate({
                parent_directory: itemParentDir,
                ...newItem,
              })
            }
            disabled={!newItem.name || createItemMutation.isPending}
          >
            {createItemMutation.isPending ? '追加中...' : '追加'}
          </button>
          <button
            onClick={() => setShowNewItemForm(false)}
            style={{marginLeft: '4px'}}
          >
            キャンセル
          </button>
          {createItemMutation.isError && (
            <div style={{color: 'red', marginTop: '8px'}}>エラーが発生しました</div>
          )}
        </div>
      )}

      {data?.rootNotes && data.rootNotes.length > 0 && (
        <div>
          <h2>未割当アイテム</h2>
          <ul>
            {data.rootNotes?.map(note => (
              <li key={note.id}>
                {note.name} {note.item_number && `(#${note.item_number})`} x{note.count} (残: {note.remaining_count})
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul>{data?.tree?.map(dir => renderDir(dir))}</ul>
    </>
  );
}

export default DirectoryTree
