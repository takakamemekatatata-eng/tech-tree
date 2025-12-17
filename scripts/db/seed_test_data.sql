-- Seed data for TechTree (assumes empty database)

SET search_path = techtree, public;

-- =========================
-- Backend (root)
-- =========================
INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Python', 3, 'Backend', NULL),
  ('Java', 2, 'Backend', NULL);

-- Python ecosystem
INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Django', 2, 'Backend', (SELECT id FROM skills WHERE name='Python')),
  ('FastAPI', 2, 'Backend', (SELECT id FROM skills WHERE name='Python')),
  ('Flask', 1, 'Backend', (SELECT id FROM skills WHERE name='Python'));

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Django REST Framework', 2, 'Backend', (SELECT id FROM skills WHERE name='Django')),
  ('SQLAlchemy', 2, 'Backend', (SELECT id FROM skills WHERE name='Python'));

-- Java ecosystem
INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Spring Boot', 2, 'Backend', (SELECT id FROM skills WHERE name='Java')),
  ('MyBatis', 1, 'Backend', (SELECT id FROM skills WHERE name='Java'));

-- =========================
-- Frontend (root)
-- =========================
INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('JavaScript', 3, 'Frontend', NULL),
  ('TypeScript', 2, 'Frontend', NULL);

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Angular', 2, 'Frontend', (SELECT id FROM skills WHERE name='TypeScript')),
  ('React', 2, 'Frontend', (SELECT id FROM skills WHERE name='JavaScript')),
  ('Vue.js', 1, 'Frontend', (SELECT id FROM skills WHERE name='JavaScript'));

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('RxJS', 2, 'Frontend', (SELECT id FROM skills WHERE name='Angular')),
  ('NgRx', 1, 'Frontend', (SELECT id FROM skills WHERE name='Angular'));

-- =========================
-- Database (root)
-- =========================
INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Database', 3, 'Database', NULL);

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('PostgreSQL', 3, 'Database', (SELECT id FROM skills WHERE name='Database')),
  ('MySQL', 2, 'Database', (SELECT id FROM skills WHERE name='Database')),
  ('SQLite', 2, 'Database', (SELECT id FROM skills WHERE name='Database'));

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Index Design', 2, 'Database', (SELECT id FROM skills WHERE name='PostgreSQL')),
  ('Query Optimization', 2, 'Database', (SELECT id FROM skills WHERE name='PostgreSQL')),
  ('Transaction', 2, 'Database', (SELECT id FROM skills WHERE name='PostgreSQL'));

-- =========================
-- Infrastructure (root)
-- =========================
INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Infrastructure', 3, 'Infra', NULL);

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Linux', 3, 'Infra', (SELECT id FROM skills WHERE name='Infrastructure')),
  ('Docker', 2, 'Infra', (SELECT id FROM skills WHERE name='Infrastructure')),
  ('AWS', 2, 'Infra', (SELECT id FROM skills WHERE name='Infrastructure'));

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('EC2', 2, 'Infra', (SELECT id FROM skills WHERE name='AWS')),
  ('RDS', 2, 'Infra', (SELECT id FROM skills WHERE name='AWS')),
  ('S3', 2, 'Infra', (SELECT id FROM skills WHERE name='AWS'));

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Docker Compose', 2, 'Infra', (SELECT id FROM skills WHERE name='Docker')),
  ('Kubernetes', 1, 'Infra', (SELECT id FROM skills WHERE name='Docker'));

-- =========================
-- Tooling / Others
-- =========================
INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('Git', 3, 'Tooling', NULL),
  ('CI/CD', 2, 'Tooling', NULL);

INSERT INTO skills (name, level, category, parent_id)
VALUES
  ('GitHub Actions', 2, 'Tooling', (SELECT id FROM skills WHERE name='CI/CD')),
  ('Jenkins', 1, 'Tooling', (SELECT id FROM skills WHERE name='CI/CD'));

