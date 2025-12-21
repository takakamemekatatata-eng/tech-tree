-- Seed data for TechTree (assumes empty database)

SET search_path = techtree, public;

-- Start from a clean slate
TRUNCATE TABLE skills RESTART IDENTITY;

-- Create a richer set of skills (10 categories x 10 skills = 100 rows)
DO $$
DECLARE
  categories TEXT[] := ARRAY[
    'Backend', 'Frontend', 'Infra', 'Database', 'Testing',
    'Data', 'Mobile', 'Security', 'DevOps', 'Product'
  ];
  category TEXT;
  base_id BIGINT;
  i INT;
  base_description TEXT := 'このスキルの説明は準備中です。';
BEGIN
  FOREACH category IN ARRAY categories LOOP
    -- Root skill per category (Lv0)
    INSERT INTO skills (name, level, category, parent_id, description, user_comment)
    VALUES (category, 0, category, NULL, base_description, '')
    RETURNING id INTO base_id;

    -- Create nine child skills under each category root
    FOR i IN 1..9 LOOP
      INSERT INTO skills (name, level, category, parent_id, description, user_comment)
      VALUES (
        category || ' Skill ' || to_char(i, 'FM00'),
        (i % 6),
        category,
        base_id,
        base_description || ' (' || category || ' Skill ' || to_char(i, 'FM00') || ')',
        ''
      );
    END LOOP;
  END LOOP;
END $$;

