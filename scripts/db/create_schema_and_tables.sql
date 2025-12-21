-- Create schema and tables required by the project (idempotent)

-- ensure the schema exists and is owned by the connected role
CREATE SCHEMA IF NOT EXISTS techtree AUTHORIZATION CURRENT_USER;
SET search_path = techtree, public;

-- skills table
CREATE TABLE IF NOT EXISTS skills (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  parent_id BIGINT REFERENCES skills(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT 'スキルの説明は準備中です。',
  user_comment TEXT NOT NULL DEFAULT ''
);

-- helpful indexes
CREATE INDEX IF NOT EXISTS skills_parent_id_idx ON techtree.skills(parent_id);
CREATE INDEX IF NOT EXISTS skills_name_idx ON techtree.skills(LOWER(name));
