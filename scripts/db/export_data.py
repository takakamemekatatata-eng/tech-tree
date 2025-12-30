#!/usr/bin/env python3
"""
Export techtree tables to JSON (one file per table) for git management.

- IDs are excluded so they can be re-generated on import.
- Node references (relations/card_selections) are stored by node name.
- Output order is deterministic to minimize diff noise.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import psycopg2


DEFAULT_OUTPUT_DIR = Path(__file__).parent


def get_connection():
    return psycopg2.connect(
        host=os.environ.get("PGHOST", "localhost"),
        port=os.environ.get("PGPORT", 5432),
        dbname=os.environ.get("DB_NAME", "techtree"),
        user=os.environ.get("DB_USER", "techtree_user"),
        password=os.environ.get("DB_PASSWORD", "password"),
    )


def fetch_nodes(cur) -> List[Dict[str, Any]]:
    cur.execute(
        """
        SET search_path TO techtree, public;
        SELECT name, node_type, category, description, level
        FROM nodes
        ORDER BY name;
        """
    )
    return [
        {
            "name": name,
            "node_type": node_type,
            "category": category,
            "description": description,
            "level": int(level),
        }
        for name, node_type, category, description, level in cur.fetchall()
    ]


def fetch_relations(cur) -> List[Dict[str, Any]]:
    cur.execute(
        """
        SELECT from_node.name AS from_name,
               to_node.name AS to_name,
               r.relation_type,
               r.strength
        FROM relations r
        JOIN nodes from_node ON r.from_node_id = from_node.id
        JOIN nodes to_node ON r.to_node_id = to_node.id
        ORDER BY from_name, to_name, r.relation_type, r.id;
        """
    )
    return [
        {
            "from_node": from_name,
            "to_node": to_name,
            "relation_type": relation_type,
            "strength": float(strength),
        }
        for from_name, to_name, relation_type, strength in cur.fetchall()
    ]


def fetch_card_selections(cur) -> List[Dict[str, Any]]:
    cur.execute(
        """
        SELECT n.name AS node_name, c.position
        FROM card_selections c
        JOIN nodes n ON c.node_id = n.id
        ORDER BY c.position, n.name, c.id;
        """
    )
    return [
        {
            "node": node_name,
            "position": int(position),
        }
        for node_name, position in cur.fetchall()
    ]


def export_json(output_path: Path) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            nodes = fetch_nodes(cur)
            relations = fetch_relations(cur)
            card_selections = fetch_card_selections(cur)

    output_path = output_path.expanduser().resolve()
    output_path.mkdir(parents=True, exist_ok=True)

    def write_json(filename: str, payload: Any) -> None:
        target = output_path / filename
        target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    write_json("nodes.json", nodes)
    write_json("relations.json", relations)
    write_json("card_selections.json", card_selections)

    print(f"✅ Export complete: {output_path}")


if __name__ == "__main__":
    output = Path(os.environ.get("OUTPUT_DIR", DEFAULT_OUTPUT_DIR))
    export_json(output)
