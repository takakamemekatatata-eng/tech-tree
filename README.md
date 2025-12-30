## Overview
TechTree is a skill visualization app that renders technology relationships as an interactive graph.

## Repository layout
- `techtree-frontend/`: Angular + Cytoscape.js client. Development docs live in `docs/FRONTEND_ARCHITECTURE.md`.
- `techtree-backend/`: Django REST Framework API backed by PostgreSQL. See `techtree-backend/README.md` for setup.
- `docs/`: Product and architecture docs (see below for entrypoint).
- `scripts/`: Utility scripts (e.g., DB bootstrap under `scripts/db`).

## Quick start
1. Prepare the backend (PostgreSQL required):
   ```bash
   cd techtree-backend
   pip install -r requirements.txt
   python manage.py runserver
   ```
2. Launch the frontend in another terminal:
   ```bash
   cd techtree-frontend
   npm install
   ng serve
   ```
3. Open `http://localhost:4200` and connect to the API at `http://localhost:8000`.

## Documentation & ideas
- ドキュメントの入口: `docs/README.md`
- フロントエンド構成メモ: `docs/FRONTEND_ARCHITECTURE.md`
- 仕様やモデル: `docs/API.md`, `docs/GRAPH_MODEL.md`
- 改善案やアイデア: `docs/IDEAS.md` （テンプレート付き）
