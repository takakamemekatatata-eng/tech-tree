#!/usr/bin/env python3
"""
Import techtree data from JSON into PostgreSQL.

- Data is read from per-table JSON files (nodes/relations/card_selections).
- Existing data in target tables is removed before import.
- IDs are auto-generated; node references are resolved by name.
- Input is expected to have deterministic ordering, but import will
  also sort to ensure stable results.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, Iterable, List

import psycopg2
from psycopg2.extras import execute_values


DEFAULT_DATA_DIR = Path(__file__).parent


def get_connection():
    return psycopg2.connect(
        host=os.environ.get("PGHOST", "localhost"),
        port=os.environ.get("PGPORT", 5432),
        dbname=os.environ.get("DB_NAME", "techtree"),
        user=os.environ.get("DB_USER", "techtree_user"),
        password=os.environ.get("DB_PASSWORD", "password"),
    )


def load_json_list(path: Path) -> List[Dict[str, Any]]:
    path = path.expanduser().resolve()
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"Expected list in {path}")
    return list(data)


def load_data(nodes_path: Path, relations_path: Path, card_selections_path: Path) -> Dict[str, Any]:
    return {
        "nodes": load_json_list(nodes_path),
        "relations": load_json_list(relations_path),
        "card_selections": load_json_list(card_selections_path),
    }


def truncate_tables(cur) -> None:
    cur.execute("SET search_path TO techtree, public;")
    cur.execute("TRUNCATE relations, card_selections, nodes RESTART IDENTITY CASCADE;")


def insert_nodes(cur, nodes: Iterable[Dict[str, Any]]) -> None:
    sorted_nodes = sorted(nodes, key=lambda n: n["name"])
    execute_values(
        cur,
        """
        INSERT INTO nodes (name, node_type, category, description, level)
        VALUES %s;
        """,
        [
            (
                n["name"],
                n.get("node_type", "technology"),
                n.get("category", ""),
                n.get("description", ""),
                int(n.get("level", 0)),
            )
            for n in sorted_nodes
        ],
    )


def build_node_lookup(cur) -> Dict[str, int]:
    cur.execute("SELECT name, id FROM nodes;")
    return {name: node_id for name, node_id in cur.fetchall()}


def insert_relations(cur, relations: Iterable[Dict[str, Any]], node_ids: Dict[str, int]) -> None:
    sorted_relations = sorted(
        relations,
        key=lambda r: (r["from_node"], r["to_node"], r.get("relation_type", "")),
    )
    rows: List[tuple] = []
    for rel in sorted_relations:
        try:
            from_id = node_ids[rel["from_node"]]
            to_id = node_ids[rel["to_node"]]
        except KeyError as exc:
            raise ValueError(f"Unknown node in relations: {exc}") from exc
        rows.append(
            (
                from_id,
                to_id,
                rel.get("relation_type", ""),
                float(rel.get("strength", 0.5)),
            )
        )
    if rows:
        execute_values(
            cur,
            """
            INSERT INTO relations (from_node_id, to_node_id, relation_type, strength)
            VALUES %s;
            """,
            rows,
        )


def insert_card_selections(cur, selections: Iterable[Dict[str, Any]], node_ids: Dict[str, int]) -> None:
    sorted_selections = sorted(
        selections,
        key=lambda s: (int(s.get("position", 0)), s.get("node", "")),
    )
    rows: List[tuple] = []
    for selection in sorted_selections:
        node_name = selection.get("node")
        if node_name is None:
            raise ValueError("card_selections entry missing 'node'")
        try:
            node_id = node_ids[node_name]
        except KeyError as exc:
            raise ValueError(f"Unknown node in card_selections: {exc}") from exc
        rows.append((node_id, int(selection.get("position", len(rows)))))
    if rows:
        execute_values(
            cur,
            """
            INSERT INTO card_selections (node_id, position)
            VALUES %s;
            """,
            rows,
        )


def main():
    data_dir = Path(os.environ.get("DATA_DIR", DEFAULT_DATA_DIR)).expanduser()
    nodes_path = Path(os.environ.get("NODES_PATH", data_dir / "nodes.json"))
    relations_path = Path(os.environ.get("RELATIONS_PATH", data_dir / "relations.json"))
    card_selections_path = Path(os.environ.get("CARD_SELECTIONS_PATH", data_dir / "card_selections.json"))

    data = load_data(nodes_path, relations_path, card_selections_path)

    with get_connection() as conn:
        with conn.cursor() as cur:
            truncate_tables(cur)
            insert_nodes(cur, data["nodes"])
            node_lookup = build_node_lookup(cur)
            insert_relations(cur, data["relations"], node_lookup)
            insert_card_selections(cur, data["card_selections"], node_lookup)
        conn.commit()
    print(f"✅ Import complete from {data_dir.resolve()}")


if __name__ == "__main__":
    main()
