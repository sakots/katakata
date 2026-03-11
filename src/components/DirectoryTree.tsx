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

const buildApiUrl = (path: string) => {
  const envBase = import.meta.env.VITE_API_URL ?? '';
  const base = String(envBase).replace(/\/$/, '');
  if (!base) return path;
  if (base.endsWith('/backend')) return `${base}/${path}`;
  return `${base}/backend/${path}`;
};

const fetchTree = async (): Promise<TreeResponse> => {
  const url = buildApiUrl('getTree.php');
  console.log('fetchTree url =', url);
  const res = await axios.get<TreeResponse>(url);
  return res.data;
}

const DirectoryTree: React.FC = () => {
  const queryClient = useQueryClient();
  const [showNewDirForm, setShowNewDirForm] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  // parent id is no longer used because hierarchy is disabled
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [itemParentDir, setItemParentDir] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    item_number: '',
    count: 1,
    remaining_number: '',
    remaining_count: 1,
  });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editRemainingNumber, setEditRemainingNumber] = useState('');
  const [editRemainingCount, setEditRemainingCount] = useState(1);

  const { data, isLoading, error } = useQuery<TreeResponse>({
    queryKey: ['directoryTree'],
    queryFn: fetchTree,
  });

  // Create directory mutation
  const createDirMutation = useMutation({
    mutationFn: async (newDir: { parent_id: number | null; name: string }) => {
      const url = buildApiUrl('makeDirectory.php');
      // always send null parent_id to prevent nested directories
      console.log('createDirMutation url', url, 'parent', newDir.parent_id);
      return axios.post(
        url,
        new URLSearchParams({
          parent_id: '', // ignore parent
          directory_name: newDir.name,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    },
    onSuccess: (res) => {
      console.log('createDirMutation success', res?.data);
      queryClient.invalidateQueries({ queryKey: ['directoryTree'] });
      setShowNewDirForm(false);
      setNewDirName('');
    },
  });

  // Delete directory mutation
  const deleteDirMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildApiUrl('deleteDirectory.php');
      console.log('deleteDirMutation url', url, 'id', id);
      return axios.post(
        url,
        new URLSearchParams({ id: id.toString() }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryTree'] });
    },
    onError: (err) => {
      console.error('deleteDir error', err);
      alert('ディレクトリ削除中にエラーが発生しました: ' + err);
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
          item_number: String(item.item_number),
          count: item.count.toString(),
          remaining_number: item.remaining_number,
          remaining_count: item.remaining_count.toString(),
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      ),
    onSuccess: () => {
      console.log('item created', newItem);
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
    onError: (err) => {
      console.error('createItem error', err);
      alert('アイテム作成中にエラーが発生しました: ' + err);
    },
  });

  // Update note mutation
  const updateItemMutation = useMutation({
    mutationFn: async (update: { id: number; remaining_number: string; remaining_count: number }) =>
      axios.post(
        `${import.meta.env.VITE_API_URL}/updateItem.php`,
        new URLSearchParams({
          id: update.id.toString(),
          remaining_number: update.remaining_number,
          remaining_count: update.remaining_count.toString(),
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryTree'] });
      setEditingNoteId(null);
      setEditRemainingNumber('');
      setEditRemainingCount(1);
    },
  });

  // Delete note mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) =>
      axios.post(
        `${import.meta.env.VITE_API_URL}/deleteItem.php`,
        new URLSearchParams({ id: id.toString() }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryTree'] });
    },
    onError: (err) => {
      console.error('deleteItem error', err);
      alert('アイテム削除中にエラーが発生しました: ' + err);
    },
  });

  if (isLoading) return <div>読み込み中…</div>;
  if (error) return <div>読み込みに失敗しました: {String(error)}</div>;

  console.log('DirectoryTree render', { data, newItem, itemParentDir, showNewItemForm });

  const renderDir = (dir: Directory) => (
    <li key={dir.id}>
      <div style={{marginBottom: '8px'}}>
        <strong>{dir.directory_name}</strong>
        {/* nested folder creation disabled */}
        <button
          onClick={() => {
            setItemParentDir(dir.id);
            setShowNewItemForm(true);
          }}
          style={{marginLeft: '8px', fontSize: '0.9em'}}
        >
          +アイテム
        </button>
        <button
          onClick={() => {
            if (window.confirm(`ディレクトリ "${dir.directory_name}" を削除しますか？`)) {
              deleteDirMutation.mutate(dir.id);
            }
          }}
          style={{marginLeft: '8px', fontSize: '0.9em', color: 'red'}}
          disabled={deleteDirMutation.isPending}
        >
          {deleteDirMutation.isPending ? '削除中...' : '削除'}
        </button>
      </div>
      {dir.notes && dir.notes.length > 0 && (
        <ul>
          {dir.notes.map(note => (
            <li key={note.id} style={{ marginBottom: '4px' }}>
              {editingNoteId === note.id ? (
                <span>
                  <input
                    type="text"
                    value={editRemainingNumber}
                    onChange={e => setEditRemainingNumber(e.target.value)}
                    placeholder="残数"
                    style={{ width: '80px', marginRight: '4px' }}
                  />
                  <input
                    type="number"
                    value={editRemainingCount}
                    onChange={e => setEditRemainingCount(parseInt(e.target.value) || 0)}
                    placeholder="残量"
                    style={{ width: '60px', marginRight: '4px' }}
                  />
                  <button
                    onClick={() => {
                      if (note.id) {
                        updateItemMutation.mutate({
                          id: note.id,
                          remaining_number: editRemainingNumber,
                          remaining_count: editRemainingCount,
                        });
                      }
                    }}
                    disabled={updateItemMutation.isPending}
                  >
                    {updateItemMutation.isPending ? '更新中...' : '保存'}
                  </button>
                  <button onClick={() => setEditingNoteId(null)} style={{ marginLeft: '4px' }}>
                    キャンセル
                  </button>
                </span>
              ) : (
                <span>
                  {note.name} {note.item_number && `(#${note.item_number})`} 数量:{note.count}
                  {note.remaining_number && ` 残数:${note.remaining_number}`}
                  {note.remaining_count !== undefined && ` 残量:${note.remaining_count}`}
                  <button
                    onClick={() => {
                      setEditingNoteId(note.id);
                      setEditRemainingNumber(String(note.remaining_number));
                      setEditRemainingCount(note.remaining_count);
                    }}
                    style={{ marginLeft: '8px', fontSize: '0.8em' }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`アイテム "${note.name}" を削除しますか？`)) {
                        deleteItemMutation.mutate(note.id);
                      }
                    }}
                    style={{ marginLeft: '8px', fontSize: '0.8em', color: 'red' }}
                    disabled={deleteItemMutation.isPending}
                  >
                    {deleteItemMutation.isPending ? '削除中...' : '削除'}
                  </button>
                </span>
              )}
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
            setShowNewDirForm(true);
          }}
          style={{fontSize: '1em', padding: '8px 16px'}}
        >
          + 新規ディレクトリ
        </button>
        {/* アイテムは各ディレクトリごとのボタンのみで追加 */}
      </div>

      {/* Create directory form */}
      {showNewDirForm && (
        <div style={{border: '1px solid #ccc', padding: '12px', marginBottom: '20px', borderRadius: '4px'}}>
          <h3>ディレクトリを作成</h3>
          <div>ルート直下に作成</div>
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
                parent_id: null,
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
      {showNewItemForm && itemParentDir !== null && (
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
              onChange={(e) => {
                try {
                  const v = e.target.value;
                  console.log('item_number changed to', v);
                  setNewItem(prev => ({...prev, item_number: v}));
                } catch (err) {
                  console.error('item_number onChange error', err);
                }
              }}
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
              placeholder="残数(テキスト)"
              value={newItem.remaining_number}
              onChange={(e) => setNewItem({...newItem, remaining_number: e.target.value})}
              style={{marginRight: '8px', padding: '4px', width: '150px'}}
            />
          </div>
          <div style={{marginBottom: '12px'}}>
            <label style={{marginRight: '8px'}}>残量(数値)：</label>
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
            {data.rootNotes.map(note => (
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
