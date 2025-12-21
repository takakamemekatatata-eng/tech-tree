SET search_path = techtree, public;

-- =========================
-- clean
-- =========================
TRUNCATE TABLE skills RESTART IDENTITY;

-- =====================================================
-- Backend
-- =====================================================
WITH backend_root AS (
  INSERT INTO skills (name, level, category, parent_id, description)
  VALUES ('Backend', 0, 'Backend', NULL, 'サーバーサイド開発全般')
  RETURNING id
)
INSERT INTO skills (name, level, category, parent_id, description)
SELECT
  v.name,
  v.level,
  'Backend',
  backend_root.id,
  v.description
FROM backend_root
CROSS JOIN (
  VALUES
    ('Python', 3, 'Pythonによるバックエンド開発'),
    ('Java', 2, 'Javaによる業務アプリ開発'),
    ('Django', 3, 'Djangoフレームワーク'),
    ('Flask', 2, '軽量Python Webフレームワーク'),
    ('REST API設計', 4, 'RESTful API設計原則'),
    ('認証・認可', 4, 'JWT / Session / OAuth'),
    ('MVCアーキテクチャ', 3, '責務分離設計'),
    ('バリデーション設計', 2, '入力チェック設計'),
    ('例外処理設計', 3, '例外とエラーハンドリング')
) AS v(name, level, description);

-- =====================================================
-- Frontend
-- =====================================================
WITH frontend_root AS (
  INSERT INTO skills (name, level, category, parent_id, description)
  VALUES ('Frontend', 0, 'Frontend', NULL, 'フロントエンド開発全般')
  RETURNING id
)
INSERT INTO skills (name, level, category, parent_id, description)
SELECT
  v.name,
  v.level,
  'Frontend',
  frontend_root.id,
  v.description
FROM frontend_root
CROSS JOIN (
  VALUES
    ('HTML', 3, 'HTML5マークアップ'),
    ('CSS', 3, 'レスポンシブデザイン'),
    ('JavaScript', 3, '基本文法とDOM操作'),
    ('TypeScript', 2, '型付きJavaScript'),
    ('Angular', 3, 'Angularフレームワーク'),
    ('状態管理', 4, '状態管理設計'),
    ('UI設計', 3, 'UI設計原則'),
    ('UX設計', 2, 'ユーザー体験設計'),
    ('アクセシビリティ', 2, 'a11y対応')
) AS v(name, level, description);

-- =====================================================
-- Database
-- =====================================================
WITH database_root AS (
  INSERT INTO skills (name, level, category, parent_id, description)
  VALUES ('Database', 0, 'Database', NULL, 'データベース設計と運用')
  RETURNING id
)
INSERT INTO skills (name, level, category, parent_id, description)
SELECT
  v.name,
  v.level,
  'Database',
  database_root.id,
  v.description
FROM database_root
CROSS JOIN (
  VALUES
    ('PostgreSQL', 4, 'PostgreSQL運用'),
    ('MySQL', 2, 'MySQL基礎'),
    ('SQL', 4, 'SELECT/JOIN/INDEX'),
    ('ER図設計', 4, '論理設計'),
    ('正規化', 3, '第3正規形'),
    ('インデックス設計', 3, '性能最適化'),
    ('トランザクション', 3, 'ACID特性'),
    ('マイグレーション', 3, 'スキーマ変更管理'),
    ('パフォーマンス分析', 2, '実行計画')
) AS v(name, level, description);

-- =====================================================
-- Infra
-- =====================================================
WITH infra_root AS (
  INSERT INTO skills (name, level, category, parent_id, description)
  VALUES ('Infra', 0, 'Infra', NULL, 'インフラ基盤')
  RETURNING id
)
INSERT INTO skills (name, level, category, parent_id, description)
SELECT
  v.name,
  v.level,
  'Infra',
  infra_root.id,
  v.description
FROM infra_root
CROSS JOIN (
  VALUES
    ('Linux', 4, 'Linux基本操作'),
    ('WSL', 3, 'WSL環境構築'),
    ('ネットワーク基礎', 2, 'TCP/IP'),
    ('Nginx', 2, 'Webサーバ'),
    ('Apache', 1, 'Apache基本'),
    ('SSH', 3, 'リモート接続'),
    ('ファイル権限', 3, 'chmod/chown'),
    ('プロセス管理', 2, 'systemctl'),
    ('ログ管理', 2, 'ログ調査')
) AS v(name, level, description);

-- =====================================================
-- DevOps
-- =====================================================
WITH devops_root AS (
  INSERT INTO skills (name, level, category, parent_id, description)
  VALUES ('DevOps', 0, 'DevOps', NULL, '開発と運用の統合')
  RETURNING id
)
INSERT INTO skills (name, level, category, parent_id, description)
SELECT
  v.name,
  v.level,
  'DevOps',
  devops_root.id,
  v.description
FROM devops_root
CROSS JOIN (
  VALUES
    ('Git', 4, 'バージョン管理'),
    ('GitHub', 4, 'PR / Issue運用'),
    ('CI/CD', 3, '自動化パイプライン'),
    ('Docker', 3, 'コンテナ化'),
    ('docker-compose', 2, '複数構成管理'),
    ('環境変数管理', 3, '.env設計'),
    ('ログ監視', 2, '障害検知'),
    ('デプロイ戦略', 2, 'Blue-Green'),
    ('リリース管理', 2, 'バージョニング')
) AS v(name, level, description);

-- =====================================================
-- Testing
-- =====================================================
WITH testing_root AS (
  INSERT INTO skills (name, level, category, parent_id, description)
  VALUES ('Testing', 0, 'Testing', NULL, 'テスト全般')
  RETURNING id
)
INSERT INTO skills (name, level, category, parent_id, description)
SELECT
  v.name,
  v.level,
  'Testing',
  testing_root.id,
  v.description
FROM testing_root
CROSS JOIN (
  VALUES
    ('単体テスト', 3, 'Unit Test'),
    ('結合テスト', 2, 'Integration Test'),
    ('E2Eテスト', 2, 'End-to-End'),
    ('pytest', 3, 'Pythonテスト'),
    ('テスト設計', 3, '観点整理'),
    ('モック', 2, '依存分離'),
    ('カバレッジ', 2, '網羅率'),
    ('テスト自動化', 3, 'CI連携'),
    ('品質分析', 2, '品質評価')
) AS v(name, level, description);

-- =====================================================
-- Product
-- =====================================================
WITH product_root AS (
  INSERT INTO skills (name, level, category, parent_id, description)
  VALUES ('Product', 0, 'Product', NULL, 'プロダクト開発')
  RETURNING id
)
INSERT INTO skills (name, level, category, parent_id, description)
SELECT
  v.name,
  v.level,
  'Product',
  product_root.id,
  v.description
FROM product_root
CROSS JOIN (
  VALUES
    ('要件定義', 4, '要求整理'),
    ('仕様策定', 3, '機能仕様'),
    ('MVP設計', 3, '最小構成'),
    ('ユーザーストーリー', 2, '利用視点'),
    ('ロードマップ', 2, '計画立案'),
    ('優先度付け', 3, '価値判断'),
    ('仮説検証', 2, '改善サイクル'),
    ('KPI設計', 2, '指標設計'),
    ('ドキュメント管理', 3, 'README等')
) AS v(name, level, description);
