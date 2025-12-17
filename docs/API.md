# API Specification (Draft)

> 状態: ドラフト（バックエンドの実装はまだ行われていません）。フロントエンド実装で使用する想定のインターフェースです。実装時に差し替えて下さい。

Base URL (dev)
- http://localhost:8000

Endpoints

- GET /skills/
  - Description: 全スキルの一覧を取得
  - Response: 200 OK
  - Body: JSON array of skill objects
    - skill object fields:
      - id: integer
      - name: string
      - category: string | null
      - level: integer (>=1)
      - parent_id: integer | null
  - Example:
    [
      { "id": 1, "name": "Python", "category": "Backend", "level": 3, "parent_id": null },
      { "id": 2, "name": "Django", "category": "Backend", "level": 2, "parent_id": 1 }
    ]

- GET /skills/{id}/
  - Description: 単一スキルの取得
  - Response: 200 OK / 404 Not Found
  - Body: skill object (same shape as above)

- PATCH /skills/{id}/
  - Description: スキルの一部更新（フロントエンドは主に `level` を PATCH する想定）
  - Request: application/json
    - Example: { "level": 4 }
  - Response: 200 OK (updated resource) / 400 Bad Request / 404 Not Found
  - Constraints: `level` は整数、最小値 1（サーバ側でバリデーション）

- POST /skills/
  - Optional: スキルの作成。戻り値は生成されたスキル。

- DELETE /skills/{id}/
  - Optional: スキルの削除。

Notes
- CORS: フロントエンド（http://localhost:4200 など）からのアクセスを許可する必要あり（現行は settings に CORS_ALLOW_ALL_ORIGINS を想定）。
- 認証: 現在未想定。将来的に認証をつける場合、PATCH などは認可が必要になる可能性あり。
- エラー処理: バリデーションエラーは 400 を返し、エラーメッセージを JSON で含めること。
- 実装ヒント (Django REST Framework)
  - Serializer: fields = ['id', 'name', 'category', 'level', 'parent_id']
  - ViewSet: ModelViewSet で list/retrieve/partial_update を提供
  - URL: /skills/ で登録

Integration with frontend
- Frontend expects:
  - GET /skills/ returns an array used to build nodes (main nodes and level nodes)
  - PATCH /skills/{id}/ accepts { level: <number> } and returns updated object; frontend will update Cytoscape node data on success

Change log
- 2025-12-17: Draft created to match frontend expectations (level editing in details UI).
