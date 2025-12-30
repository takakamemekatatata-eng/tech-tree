このディレクトリには、テックツリーのスキーマ管理とデータ入出力のための開発用スクリプトが含まれます。

- `setup_db.sh`  
  スキーマを作成し、`nodes.json` / `relations.json` / `card_selections.json` を読み込んで初期データを投入します。既存データベースを削除した上で再作成します。
- `create_schema_and_tables.sql`  
  スキーマとテーブルの定義です。`setup_db.sh` や他のスクリプトから利用されます。
- `export_data.py`  
  現在の DB データをテーブルごとの JSON（`nodes.json` / `relations.json` / `card_selections.json`）にエクスポートします（`id` を除外し、ノード参照は名前に変換）。内容は全体を上書きします。
- `import_data.py`  
  テーブルごとの JSON を読み込み、既存データを削除して再投入します（`id` は自動採番、名前を `id` に解決して保存）。
- `nodes.json` / `relations.json` / `card_selections.json`  
  Git で管理するデータファイルです。差分が小さくなるよう、エクスポート時にカラム順・データ順は固定でソートされます。
