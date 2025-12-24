# API Specification

Base URL (dev)
- http://localhost:8000

Endpoints

- GET /nodes/
  - Description: 技術ノードの一覧を取得
  - Response: 200 OK
  - Body: JSON array of node objects
    - node object fields:
      - id: integer
      - name: string
      - node_type: string (default `technology`)
      - category: string
      - description: string
      - tags: string[]

- GET /relations/
  - Description: ノード間の関係を取得。`relation_type`、`min_strength`、`max_strength`、`context` でフィルタ可能。
  - Response: 200 OK
  - Body: JSON array of relation objects
    - relation object fields:
      - id: integer
      - from_node_id: integer
      - to_node_id: integer
      - relation_type: string (`prerequisite`, `used_with`, `alternative`, `related`, `built_on`)
      - strength: number (0.0〜1.0)
      - context: string | null

- POST /nodes/ (管理用)
  - Description: 新しい技術ノードを作成（本番 UI からは利用しない）

- POST /relations/ (管理用)
  - Description: 新しい関係を追加（本番 UI からは利用しない）

Notes
- CORS: フロントエンド（http://localhost:4200 など）からのアクセスを許可する必要あり。
- 認証: 現在未想定。将来的に認証をつける場合、書き込み系は認可が必要になる。
- エラー処理: バリデーションエラーは 400 を返し、エラーメッセージを JSON で含めること。

Change log
- 2025-12-17: Draft created to match frontend expectations (level editing in details UI).
- 2025-12-18: Updated to graph-only API (nodes / relations)。
