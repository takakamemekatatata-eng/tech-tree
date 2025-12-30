# TechTree Backend

Django REST Framework API that serves skill graph data to the Angular frontend.

## Requirements
- Python 3.11+
- PostgreSQL (tables created via provided SQL/script)

## Setup
```bash
pip install -r requirements.txt
```

Apply migrations are not used because the project relies on pre-created tables. Use the setup script to provision them:
```bash
scripts/db/setup_db.sh
```

To run the development server:
```bash
python manage.py runserver
```

## Data import/export helpers
Utilities live under `../scripts/db/`:
- `setup_db.sh`: create database, schema, tables, and seed data.
- `import_data.py` / `export_data.py`: load or dump `nodes.json`, `relations.json`, and `card_selections.json`.

## Notes
- Database tables are unmanaged (`managed = False`), so any schema change must be applied manually via SQL or migrations in your environment.
- Default API endpoints: `/nodes/`, `/relations/`, `/card-selections/`.
