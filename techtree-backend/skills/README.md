# Skills App

Contains Django models and API endpoints for skill nodes, relations, and card selections.

## Models
- `Node`: technology node (name, category, level 0-5, description)
- `Relation`: directional link between nodes with `relation_type` and `strength`
- `CardSelection`: ordered list of spotlighted nodes

## API endpoints
- `/nodes/` — list/create/update nodes
- `/relations/` — list/create/update relations
- `/card-selections/` — manage highlighted cards

The models are marked `managed = False`; schema is created via SQL or `scripts/db/setup_db.sh`.
