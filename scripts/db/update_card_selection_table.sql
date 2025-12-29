\set ON_ERROR_STOP on

CREATE SCHEMA IF NOT EXISTS techtree;
SET search_path TO techtree, public;

-- =========================
-- card_selections table
-- =========================
CREATE TABLE IF NOT EXISTS card_selections (
  id BIGSERIAL PRIMARY KEY,
  node_id BIGINT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- FK constraint (node_id -> nodes.id)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'techtree'
      AND table_name = 'card_selections'
      AND constraint_name = 'card_selections_node_id_fkey'
  ) THEN
    ALTER TABLE techtree.card_selections
      ADD CONSTRAINT card_selections_node_id_fkey
      FOREIGN KEY (node_id)
      REFERENCES techtree.nodes (id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- =========================
-- UNIQUE constraint (node_id)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'techtree'
      AND table_name = 'card_selections'
      AND constraint_name = 'unique_card_selection_node'
  ) THEN
    ALTER TABLE techtree.card_selections
      ADD CONSTRAINT unique_card_selection_node
      UNIQUE (node_id);
  END IF;
END $$;

-- =========================
-- updated_at trigger function
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'card_selections_set_updated_at'
      AND n.nspname = 'techtree'
  ) THEN
    CREATE FUNCTION techtree.card_selections_set_updated_at()
    RETURNS trigger AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- =========================
-- trigger
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'techtree'
      AND event_object_table = 'card_selections'
      AND trigger_name = 'trg_card_selections_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_card_selections_set_updated_at
      BEFORE UPDATE ON techtree.card_selections
      FOR EACH ROW
      EXECUTE FUNCTION techtree.card_selections_set_updated_at();
  END IF;
END $$;
