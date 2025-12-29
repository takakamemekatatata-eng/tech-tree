SET search_path = techtree, public;

-- =========================
-- clean
-- =========================
TRUNCATE TABLE relations RESTART IDENTITY;
TRUNCATE TABLE nodes RESTART IDENTITY CASCADE;

-- =========================
-- bulk insert nodes (~100)
-- =========================
WITH inserted_nodes AS (
  INSERT INTO nodes (name, node_type, category, description, level) VALUES

  -- ===== Languages =====
  ('Python', 'technology', 'language', 'General-purpose programming language.', 5),
  ('JavaScript', 'technology', 'language', 'Language of the web.', 5),
  ('TypeScript', 'technology', 'language', 'Typed superset of JavaScript.', 4),
  ('Java', 'technology', 'language', 'Enterprise-grade programming language.', 4),
  ('Go', 'technology', 'language', 'Compiled language by Google.', 3),
  ('Rust', 'technology', 'language', 'Memory-safe systems programming language.', 3),
  ('C', 'technology', 'language', 'Low-level systems language.', 3),
  ('C++', 'technology', 'language', 'High-performance systems language.', 3),
  ('Shell', 'technology', 'language', 'Command-line scripting.', 2),

  -- ===== Backend Frameworks =====
  ('Django', 'technology', 'framework', 'Python web framework.', 4),
  ('Flask', 'technology', 'framework', 'Lightweight Python web framework.', 3),
  ('FastAPI', 'technology', 'framework', 'Modern Python API framework.', 4),
  ('Spring Boot', 'technology', 'framework', 'Java backend framework.', 4),
  ('Express', 'technology', 'framework', 'Node.js web framework.', 3),
  ('NestJS', 'technology', 'framework', 'Scalable Node.js framework.', 3),

  -- ===== Frontend =====
  ('Angular', 'technology', 'framework', 'Frontend framework.', 3),
  ('React', 'technology', 'framework', 'UI library.', 4),
  ('Vue.js', 'technology', 'framework', 'Progressive frontend framework.', 3),
  ('Next.js', 'technology', 'framework', 'React-based framework.', 3),
  ('HTML', 'technology', 'language', 'Markup language for web.', 5),
  ('CSS', 'technology', 'language', 'Styling language for web.', 5),

  -- ===== Protocol / API =====
  ('HTTP', 'technology', 'protocol', 'Hypertext Transfer Protocol.', 4),
  ('HTTPS', 'technology', 'protocol', 'Secure HTTP.', 4),
  ('REST API', 'technology', 'design', 'RESTful API design.', 3),
  ('GraphQL', 'technology', 'design', 'Query language for APIs.', 3),
  ('WebSocket', 'technology', 'protocol', 'Full-duplex communication.', 2),

  -- ===== Databases =====
  ('SQL', 'technology', 'language', 'Relational query language.', 4),
  ('PostgreSQL', 'technology', 'database', 'Open source RDBMS.', 4),
  ('MySQL', 'technology', 'database', 'Popular relational database.', 3),
  ('SQLite', 'technology', 'database', 'Embedded database.', 3),
  ('MongoDB', 'technology', 'database', 'NoSQL document database.', 3),
  ('Redis', 'technology', 'database', 'In-memory data store.', 3),
  ('Elasticsearch', 'technology', 'database', 'Search engine.', 3),

  -- ===== Infra / DevOps =====
  ('Docker', 'technology', 'tool', 'Containerization platform.', 4),
  ('Docker Compose', 'technology', 'tool', 'Multi-container orchestration.', 3),
  ('Kubernetes', 'technology', 'tool', 'Container orchestration.', 3),
  ('Nginx', 'technology', 'tool', 'Web server / reverse proxy.', 4),
  ('Apache', 'technology', 'tool', 'Web server.', 3),
  ('Linux', 'technology', 'os', 'Operating system.', 5),
  ('Ubuntu', 'technology', 'os', 'Linux distribution.', 4),
  ('WSL', 'technology', 'tool', 'Windows Subsystem for Linux.', 3),

  -- ===== Cloud =====
  ('AWS', 'technology', 'cloud', 'Amazon Web Services.', 4),
  ('EC2', 'technology', 'cloud', 'Virtual server on AWS.', 3),
  ('S3', 'technology', 'cloud', 'Object storage.', 3),
  ('RDS', 'technology', 'cloud', 'Managed database service.', 3),

  -- ===== Testing =====
  ('pytest', 'technology', 'testing', 'Python testing framework.', 3),
  ('JUnit', 'technology', 'testing', 'Java testing framework.', 3),
  ('Jest', 'technology', 'testing', 'JavaScript testing framework.', 3),

  -- ===== Tools =====
  ('Git', 'technology', 'tool', 'Version control system.', 5),
  ('GitHub', 'technology', 'tool', 'Git hosting platform.', 4),
  ('VS Code', 'technology', 'tool', 'Code editor.', 5),
  ('Postman', 'technology', 'tool', 'API testing tool.', 3),
  ('curl', 'technology', 'tool', 'Command-line HTTP client.', 3),

  -- ===== Concepts =====
  ('MVC', 'technology', 'concept', 'Model View Controller.', 4),
  ('ORM', 'technology', 'concept', 'Object Relational Mapping.', 4),
  ('Authentication', 'technology', 'concept', 'User authentication.', 3),
  ('Authorization', 'technology', 'concept', 'Access control.', 3),
  ('CI/CD', 'technology', 'concept', 'Continuous integration and deployment.', 3)

  ON CONFLICT (name) DO UPDATE
    SET category = EXCLUDED.category,
        description = EXCLUDED.description,
        level = EXCLUDED.level
  RETURNING id, name
)
SELECT count(*) FROM inserted_nodes;


WITH node_lookup AS (
  SELECT id, name FROM nodes
)
INSERT INTO relations (from_node_id, to_node_id, relation_type, strength)
SELECT (SELECT id FROM node_lookup WHERE name='Python'),
       (SELECT id FROM node_lookup WHERE name='Django'),
       'prerequisite', 0.9
UNION ALL
SELECT (SELECT id FROM node_lookup WHERE name='Python'),
       (SELECT id FROM node_lookup WHERE name='FastAPI'),
       'prerequisite', 0.9
UNION ALL
SELECT (SELECT id FROM node_lookup WHERE name='JavaScript'),
       (SELECT id FROM node_lookup WHERE name='TypeScript'),
       'related', 0.8
UNION ALL
SELECT (SELECT id FROM node_lookup WHERE name='TypeScript'),
       (SELECT id FROM node_lookup WHERE name='Angular'),
       'prerequisite', 0.8
UNION ALL
SELECT (SELECT id FROM node_lookup WHERE name='Angular'),
       (SELECT id FROM node_lookup WHERE name='REST API'),
       'used_with', 0.8
UNION ALL
SELECT (SELECT id FROM node_lookup WHERE name='Django'),
       (SELECT id FROM node_lookup WHERE name='PostgreSQL'),
       'used_with', 0.8
UNION ALL
SELECT (SELECT id FROM node_lookup WHERE name='Docker'),
       (SELECT id FROM node_lookup WHERE name='Django'),
       'used_with', 0.7
UNION ALL
SELECT (SELECT id FROM node_lookup WHERE name='AWS'),
       (SELECT id FROM node_lookup WHERE name='EC2'),
       'built_on', 0.9
UNION ALL
SELECT (SELECT id FROM node_lookup WHERE name='EC2'),
       (SELECT id FROM node_lookup WHERE name='Docker'),
       'used_with', 0.8;
