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
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS relations (
  id BIGSERIAL PRIMARY KEY,
  from_node_id BIGINT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id BIGINT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL,
  strength NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (strength >= 0.0 AND strength <= 1.0),
  context VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS relations_from_node_id_idx ON techtree.relations(from_node_id);
CREATE INDEX IF NOT EXISTS relations_to_node_id_idx ON techtree.relations(to_node_id);
CREATE INDEX IF NOT EXISTS relations_relation_type_idx ON techtree.relations(relation_type);
CREATE INDEX IF NOT EXISTS relations_context_idx ON techtree.relations(context);
