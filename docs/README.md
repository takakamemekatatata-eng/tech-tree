# TechTree — ドキュメント

## 概要
TechTree はスキル間の依存関係を可視化する Web アプリケーションです。  
フロントエンドは Angular + Cytoscape.js、バックエンドは Django REST Framework を使用しています。

## 関連 OSS / ライブラリ
- フレームワーク / ランタイム
  - Angular (v21), Node.js (dev)
  - Django, Django REST Framework
- フロントエンド
  - cytoscape.js — グラフ可視化
  - cytoscape-dagre (dagre) — レイアウトプラグイン
  - axios — HTTP クライアント
- バックエンド / DB
  - PostgreSQL
  - django-cors-headers
- 開発ツール
  - Angular CLI, Vitest(テストランナー)

## 主要ファイル・設定箇所
- フロントエンド
  - src/app/app.ts — Cytoscape 初期化、イベント、レイアウト操作
  - src/app/visual-config.ts — 表示に関する集中設定（layoutConfig, levelNodeConfig, mainLabelConfig）
  - src/app/style-variables.css — グローバル CSS 変数
  - src/app/app.css / src/styles.css — UI スタイル
  - src/app/app.html — ヘッダー・検索・サイドバー・cy コンテナ（#cy）
- バックエンド
  - skills アプリ: skills/models.py（Skill モデル）、skills/views/…（API）
  - backend/settings.py — DB / CORS / INSTALLED_APPS 等

## 画面機能（ユーザー視点）
- ヘッダー
  - ロゴ、ツールバー（Fit / Zoom / Layout 切替 / Clear / サイドバー切替）
  - 検索入力（ノード名でフィルタ）
- メイン
  - Cytoscape によるノード/エッジ表示
  - ノードをクリックすると詳細がサイドバーに表示
  - レベルノード（Lv.N）は視覚的に小さく、親ノードの「ラベル」扱い
- サイドバー
  - 選択ノードの Label / Category / Level を表示
  - 折りたたみ可能

## 重要な挙動・開発メモ
- レベルノード（classes: `level-node`）
  - `ungrabify()` と `unselectify()` を適用してユーザーが直接ドラッグ/選択できないようにしてある
  - レベルノードをタップすると、親ノード（data.attachedTo）を選択した扱いになる（親の詳細が開く）
- 表示調整（1箇所を編集するだけで全体に反映）
  - `src/app/visual-config.ts` の `mainLabelConfig.textMarginY` でメインラベルの上下位置を調整
  - `src/app/visual-config.ts` の `levelNodeConfig.verticalOffsetFactor` でレベルノードの垂直オフセットを調整
- デバッグ
  - `window.cy` に Cytoscape インスタンスを公開しているため、コンソールから操作可能

## 実行方法（開発）
- フロントエンド
  - npm install
  - ng serve
- バックエンド
  - pip install -r requirements.txt
  - python manage.py runserver
- API
  - フロントはデフォルトで `http://localhost:8000/skills/` を参照

## テスト
- 単体テスト: `ng test`（Vitest / Angular のセットアップに依存）

## ライセンス
- MIT License — see /LICENSE

## アイデア / バックログについて

プロジェクトに関する「思いつき」「新機能案」「改善案」は本リポジトリ内の `docs/IDEAS.md` に追記してください。  
書き方のルール（推奨）:

- 1アイデア＝1エントリ
- 必須項目: 日付 / タイトル / 作成者 / 概要（目的） / 期待効果
- 任意項目: 優先度(High/Med/Low) / 推定工数 / 備考 / 関連ファイル
- ステータス: proposed / accepted / in-progress / done / dropped

目的: シンプルな箇条書きにしておき、議論・実装へつなげやすくします。  
例やテンプレートは `docs/IDEAS.md` を参照してください。
