-- Migration 0003: mentor slug generation + mentee profile columns + mentor display_name
-- Session 2A: Mentor onboarding wizard + Mentee onboarding prep

-- ============================================================
-- 1. Add display_name to mentor_profiles (separate from users.display_name)
-- ============================================================
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ============================================================
-- 2. Add mentee-specific columns to users
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_type TEXT
  CHECK (student_type IN ('12th_year', 'recent_graduate', 'international', 'diaspora'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS target_pathway TEXT
  CHECK (target_pathway IN ('cna_public', 'private_admissions', 'international_equivalency'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS desired_course TEXT;

-- ============================================================
-- 3. Slug generation function (called via supabase.rpc())
-- ============================================================
CREATE OR REPLACE FUNCTION generate_mentor_slug(
  p_display_name TEXT,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_counter INT := 1;
BEGIN
  -- Normalise: lowercase, replace non-alphanumeric with hyphens, collapse
  v_base := lower(p_display_name);
  v_base := regexp_replace(v_base, '[^a-z0-9]', '-', 'g');
  v_base := regexp_replace(v_base, '-+', '-', 'g');
  v_base := trim(BOTH '-' FROM v_base);
  v_base := left(v_base, 50);

  IF v_base = '' THEN
    v_base := 'mentor';
  END IF;

  v_slug := v_base;

  WHILE EXISTS (
    SELECT 1 FROM mentor_profiles
    WHERE slug = v_slug
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) LOOP
    v_counter := v_counter + 1;
    v_slug := left(v_base, 46) || '-' || v_counter::TEXT;
  END LOOP;

  RETURN v_slug;
END;
$$;

-- Grant execute to authenticated users (needed for RPC calls)
GRANT EXECUTE ON FUNCTION generate_mentor_slug(TEXT, UUID) TO authenticated;
