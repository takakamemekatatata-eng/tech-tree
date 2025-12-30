-- Create schema and tables required by the project (idempotent)

-- ensure the schema exists and is owned by the connected role
CREATE SCHEMA IF NOT EXISTS techtree AUTHORIZATION CURRENT_USER;
SET search_path = techtree, public;

CREATE TABLE IF NOT EXISTS nodes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  node_type VARCHAR(50) NOT NULL DEFAULT 'technology',
  category VARCHAR(100) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 5)
);

CREATE TABLE IF NOT EXISTS relations (
  id BIGSERIAL PRIMARY KEY,
  from_node_id BIGINT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id BIGINT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL,
  strength NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (strength >= 0.0 AND strength <= 1.0)
);

CREATE INDEX IF NOT EXISTS relations_from_node_id_idx ON techtree.relations(from_node_id);
CREATE INDEX IF NOT EXISTS relations_to_node_id_idx ON techtree.relations(to_node_id);
CREATE INDEX IF NOT EXISTS relations_relation_type_idx ON techtree.relations(relation_type);

CREATE TABLE IF NOT EXISTS card_selections (
  id BIGSERIAL PRIMARY KEY,
  node_id BIGINT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
