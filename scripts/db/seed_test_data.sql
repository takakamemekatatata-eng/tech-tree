SET search_path = techtree, public;

-- =========================
-- clean
-- =========================
TRUNCATE TABLE relations RESTART IDENTITY;
TRUNCATE TABLE nodes RESTART IDENTITY CASCADE;

-- =========================
-- graph-based technology nodes and relations
-- =========================
WITH inserted_nodes AS (
  INSERT INTO nodes (name, node_type, category, description, tags) VALUES
    ('Python', 'technology', 'language', 'General-purpose programming language.', '{web,backend,data}'),
    ('Django', 'technology', 'framework', 'Python web framework.', '{web,backend}'),
    ('HTTP', 'technology', 'protocol', 'Hypertext Transfer Protocol.', '{web,protocol}'),
    ('SQL', 'technology', 'language', 'Structured Query Language for relational databases.', '{database,data}'),
    ('PostgreSQL', 'technology', 'database', 'Open source relational database.', '{database,data}'),
    ('REST API', 'technology', 'design', 'RESTful API design principles.', '{web,api}'),
    ('Docker', 'technology', 'tool', 'Containerization platform.', '{devops,infrastructure}'),
    ('Angular', 'technology', 'framework', 'Frontend framework.', '{web,frontend}')
  ON CONFLICT (name) DO UPDATE
    SET category = EXCLUDED.category,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags
  RETURNING id, name
)
SELECT 1 FROM inserted_nodes;

WITH node_lookup AS (
  SELECT id, name FROM nodes WHERE name IN ('Python', 'Django', 'HTTP', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'Angular')
)
INSERT INTO relations (from_node_id, to_node_id, relation_type, strength, context)
SELECT
  (SELECT id FROM node_lookup WHERE name = 'Python'),
  (SELECT id FROM node_lookup WHERE name = 'Django'),
  'prerequisite', 0.9, 'web'
UNION ALL
SELECT
  (SELECT id FROM node_lookup WHERE name = 'Django'),
  (SELECT id FROM node_lookup WHERE name = 'HTTP'),
  'built_on', 0.8, 'web'
UNION ALL
SELECT
  (SELECT id FROM node_lookup WHERE name = 'Django'),
  (SELECT id FROM node_lookup WHERE name = 'REST API'),
  'used_with', 0.7, 'api'
UNION ALL
SELECT
  (SELECT id FROM node_lookup WHERE name = 'SQL'),
  (SELECT id FROM node_lookup WHERE name = 'PostgreSQL'),
  'related', 0.6, 'data'
UNION ALL
SELECT
  (SELECT id FROM node_lookup WHERE name = 'Docker'),
  (SELECT id FROM node_lookup WHERE name = 'Django'),
  'used_with', 0.5, 'deployment'
UNION ALL
SELECT
  (SELECT id FROM node_lookup WHERE name = 'Angular'),
  (SELECT id FROM node_lookup WHERE name = 'REST API'),
  'used_with', 0.8, 'web';
