# katakata

ねこちゃん用記憶補助アプリです

## 概要

```txt
画材
　└名前、型番、個数、残量
コスメ
　└部位
　　└名前、型番、個数、残量
　　└名前、型番、個数、残量
　└部位
　　└名前、型番、個数、残量
```

こんな感じに

- フォルダ分け（いろんな階層対応）
- 名前、型番、個数、残量は固定
- データベース化（再帰クエリが使えそうなので隣接リストでよい）

かなー

## フロントエンド

React アプリケーションは `src/App.tsx` から始まり、`DirectoryTree` コンポーネントが
PHP バックエンド（`backend/getTree.php`）から取得したディレクトリ構造をツリー表示します。

### 機能

- **ディレクトリ・アイテムの表示**
  - `axios` で `/backend/getTree.php` に GET リクエスト
  - `@tanstack/react-query` の `useQuery` でデータをフェッチ

- **ディレクトリ作成**
  - トップレベルまたはディレクトリ配下に新規フォルダを作成可能
  - `/backend/makeDirectory.php` に POST リクエスト
    - `parent_id` が空文字列の場合はサーバー側で `NULL` に変換されるため、正しくルート/サブディレクトリに振り分けられる。
  - フロントエンドはAPI URLと送信される `parent_id` をコンソールに出力し、サーバーも PHP の `error_log` に親IDを記録するようになった。
  - 作成後、自動的にツリーを再取得

- **アイテム作成**
  - ディレクトリ配下または未割当に新規アイテムを追加可能
  - `/backend/addItem.php` に POST リクエスト
  - 名前、型番、数量 (x表示)、
    残数 (表示されないテキスト)、残量 (一覧に "残量:" として表示) を入力可能
  - 作成後、自動的にツリーを再取得
- **アイテム編集**
  - 各アイテム横の「編集」ボタンで残数・残量を修正
  - `/backend/updateItem.php` に POST リクエスト(id, remaining_number, remaining_count)
  - 更新後、自動的にツリーを再取得

### セットアップ

1. PHP サーバーをバックエンドディレクトリで起動

   ```bash
   php -S localhost:8000 -t backend
   ```

2. フロントエンドを起動

   ```bash
   pnpm install
   pnpm dev
   ```

3. `.env` で `VITE_API_URL` を設定（例: `http://localhost:8000`）。
   - `VITE_API_URL` はバックエンド PHP が動いている**プロトコル・ホスト・パス**までを指定。最後に `/backend` を含めても含めなくても動作するようにフロントエンドが調整している。
   - 例: `https://localhost/dev/katakata/backend` からリクエストされる場合、最終的な URL は
     `https://localhost/dev/katakata/backend/getTree.php` になる。
   - ブラウザの開発者ツール `Network` タブで実際のリクエスト先を確認するとトラブルシューティングがしやすい。

## バックエンド エンドポイント

- **`GET /getTree.php`** - ディレクトリツリーとアイテム取得
  - サーバー側で不正なディレクトリ行（NULL id 等）は自動的に除外され、
    参照ではなく値としてセーフにツリーを構築するので null エントリが出力されません。
- **`POST /makeDirectory.php`** - ディレクトリ作成（`parent_id`, `directory_name`）
- **`POST /addItem.php`** - アイテム追加（`parent_directory`, `name`, `item_number`, `count`, `remaining_number`, `remaining_count`）。
  成功時は追加されたアイテムの全フィールドを `item` プロパティで返す。

## 更新履歴

### [2026/03/11] v0.0.0

- とりあえずうごく

### [2026/02/26]

- GUI でディレクトリとアイテムを作成可能に
- 各ディレクトリに `+フォルダ` `+アイテム` ボタンを実装
- `useMutation` でフォーム処理を実装

### [2026/02/19]

- データベース作成

### [2026/02/07]

- README作成
