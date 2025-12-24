# 技術ノード/リレーションモデル概要

グラフ構造で技術知識を管理するためのデータモデルメモです。ツリーや親子階層は持たず、必要に応じてループを含む自由な関係グラフとして扱います。

## モデルの考え方
- 常に **1 つの中心ノード** を基点にし、半径 1〜2 hop のノードを表示する想定。
- 表示や探索は `relation_type` / `strength` / `context` でフィルタして行う。
- 穴（抜けている前提）は、タグや期待前提と実際の `relations` の差分をクエリで検出する。専用テーブルは設けない。
- ノードは本番 UI から新規作成せず、既存データを表示するのみ（データ投入は管理用途）。

## ノード (nodes テーブル)
- 技術を 1 レコードで表現する。
- 主なカラム
  - `id`: 主キー
  - `name`: 技術名（例: Python, Django, HTTP, SQL）
  - `node_type`: 初期値は `technology`
  - `category`: 分類（language / framework / protocol など）
  - `description`: 概要
  - `tags`: 用途タグ（web / backend / data など）
- 親 ID や階層カラムは持たない。

## リレーション (relations テーブル)
- ノード間の意味的なつながりを表現する。
- 主なカラム
  - `from_node_id`, `to_node_id`: 接続するノード ID（ループも許容）
  - `relation_type`: 関係の種類。初期セット: `prerequisite`, `used_with`, `alternative`, `related`, `built_on`
  - `strength`: 関係の強さ (0.0〜1.0)
  - `context`: 任意のコンテキスト（web / api / data など）
- 親子の制約は持たず、関係は重複しても良い。

## 表示・探索の前提
- 中心ノードを軸に 1〜2 hop を取得し、`relation_type` や `strength` でフィルタ。
- ノードは既存データのみを提示し、更新系は管理用エンドポイントで行う。

## PostgreSQL でのテーブル構成
- `nodes`: 技術ノードの保持。`tags` は `text[]` で管理。
- `relations`: ノード同士を接続し、`relation_type` / `strength` / `context` を保持。`strength` は 0.0〜1.0 の CHECK 制約を付与。
- ループや複数のエッジを許容するため、親子制約やユニーク制約を最小限にする。
