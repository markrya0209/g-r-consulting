-- ============================================================
-- 0001_initial_schema.sql
-- G&R Consulting — Initial schema: 7 tables, RLS, trigger
-- ============================================================

-- uuid-ossp not needed — gen_random_uuid() is built-in since Postgres 13

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE,
  display_name  TEXT,
  photo_url     TEXT,
  role          TEXT NOT NULL CHECK (role IN ('mentor','mentee','admin')),
  terms_accepted_at   TIMESTAMPTZ,
  tos_version         TEXT,
  gdpr_consent_at     TIMESTAMPTZ,
  age_confirmed       BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  institutional_email TEXT,
  institutional_verified BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. mentor_profiles
-- ============================================================
CREATE TABLE mentor_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug                  TEXT UNIQUE,
  bio                   TEXT,
  university            TEXT,
  faculty               TEXT,
  course                TEXT,
  year                  SMALLINT CHECK (year BETWEEN 1 AND 6),
  languages             TEXT[] NOT NULL DEFAULT '{}',
  photo_url             TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_account_id     TEXT,
  stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  cal_user_id           TEXT,
  cal_event_type_id     TEXT,
  avg_rating            NUMERIC(3,2) NOT NULL DEFAULT 0,
  session_count         INTEGER NOT NULL DEFAULT 0,
  bayesian_score        NUMERIC(5,4) NOT NULL DEFAULT 0,
  onboarding_step       SMALLINT NOT NULL DEFAULT 1,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

-- Public: active mentors with Stripe payouts enabled
CREATE POLICY "mentor_profiles_select_public" ON mentor_profiles
  FOR SELECT USING (
    is_active = TRUE AND stripe_payouts_enabled = TRUE AND deleted_at IS NULL
  );

-- Own: mentor always sees their own profile
CREATE POLICY "mentor_profiles_select_own" ON mentor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mentor_profiles_insert_own" ON mentor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mentor_profiles_update_own" ON mentor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 3. session_types
-- ============================================================
CREATE TABLE session_types (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_profile_id  UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  type_key           TEXT NOT NULL CHECK (type_key IN (
    'cna','provas','ordem','curso','equiv','tutor','vida','intl'
  )),
  is_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  description        TEXT CHECK (char_length(description) <= 150),
  price_cents        INTEGER NOT NULL CHECK (price_cents BETWEEN 2000 AND 5000),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mentor_profile_id, type_key)
);

ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;

-- Public: only session types belonging to active mentors
CREATE POLICY "session_types_select_public" ON session_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mentor_profiles mp
      WHERE mp.id = session_types.mentor_profile_id
        AND mp.is_active = TRUE
        AND mp.stripe_payouts_enabled = TRUE
        AND mp.deleted_at IS NULL
    )
  );

-- Own: mentor sees all their session types
CREATE POLICY "session_types_select_own" ON session_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mentor_profiles mp
      WHERE mp.id = session_types.mentor_profile_id
        AND mp.user_id = auth.uid()
    )
  );

-- Modify: only the owning mentor
CREATE POLICY "session_types_modify_own" ON session_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mentor_profiles mp
      WHERE mp.id = session_types.mentor_profile_id
        AND mp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. bookings
-- ============================================================
CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id           UUID NOT NULL REFERENCES users(id),
  mentor_id           UUID NOT NULL REFERENCES users(id),
  mentor_profile_id   UUID NOT NULL REFERENCES mentor_profiles(id),
  session_type_id     UUID NOT NULL REFERENCES session_types(id),
  cal_booking_uid     TEXT,
  daily_room_url      TEXT,
  status              TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment','confirmed','session_completed',
    'cancelled_by_mentor','cancelled_by_mentee','cancelled_late','archived'
  )),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    SMALLINT NOT NULL DEFAULT 60,
  price_cents         INTEGER NOT NULL,
  mentee_context      TEXT CHECK (char_length(mentee_context) BETWEEN 50 AND 500),
  current_situation   TEXT,
  outcome_report_id   UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select_participants" ON bookings
  FOR SELECT USING (
    auth.uid() = mentee_id OR auth.uid() = mentor_id
  );

CREATE POLICY "bookings_insert_mentee" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "bookings_update_participants" ON bookings
  FOR UPDATE USING (
    auth.uid() = mentee_id OR auth.uid() = mentor_id
  );

-- ============================================================
-- 5. reviews
-- ============================================================
CREATE TABLE reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL UNIQUE REFERENCES bookings(id),
  mentee_id         UUID NOT NULL REFERENCES users(id),
  mentor_profile_id UUID NOT NULL REFERENCES mentor_profiles(id),
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body              TEXT CHECK (
    char_length(body) BETWEEN 20 AND 500
  ),
  reviewer_type     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public: reviews visible to anyone
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (TRUE);

-- Insert: mentee on the booking, once per booking
CREATE POLICY "reviews_insert_mentee" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = mentee_id
    AND NOT EXISTS (
      SELECT 1 FROM reviews r2
      WHERE r2.booking_id = reviews.booking_id
    )
  );

-- Update: mentee can edit within 24h
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (
    auth.uid() = mentee_id
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- ============================================================
-- 6. outcome_reports
-- ============================================================
CREATE TABLE outcome_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL UNIQUE REFERENCES bookings(id),
  mentor_id   UUID NOT NULL REFERENCES users(id),
  summary     TEXT NOT NULL,
  next_steps  TEXT,
  resources   JSONB DEFAULT '[]',
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE outcome_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outcome_reports_select_participants" ON outcome_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = outcome_reports.booking_id
        AND (b.mentor_id = auth.uid() OR b.mentee_id = auth.uid())
    )
  );

CREATE POLICY "outcome_reports_insert_mentor" ON outcome_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = outcome_reports.booking_id
        AND b.mentor_id = auth.uid()
    )
  );

CREATE POLICY "outcome_reports_update_mentor" ON outcome_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = outcome_reports.booking_id
        AND b.mentor_id = auth.uid()
    )
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- ============================================================
-- 7. payments
-- ============================================================
CREATE TABLE payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id               UUID NOT NULL REFERENCES bookings(id),
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id         TEXT,
  amount_total_cents       INTEGER NOT NULL,
  amount_fee_cents         INTEGER NOT NULL,
  amount_mentor_cents      INTEGER NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'eur',
  status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','succeeded','refunded','partially_refunded','failed'
  )),
  refunded_at              TIMESTAMPTZ,
  payment_released_at      TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_participants" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = payments.booking_id
        AND (b.mentor_id = auth.uid() OR b.mentee_id = auth.uid())
    )
  );

-- INSERT / UPDATE / DELETE handled by service role only (cron + webhooks)

-- ============================================================
-- 8. notifications (lightweight — Supabase Realtime)
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: update rating aggregates on reviews change
-- Formula: bayesian = (session_count * avg_rating + 10 * 4.0) / (session_count + 10)
-- ============================================================
CREATE OR REPLACE FUNCTION update_mentor_rating_aggregates()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_mentor_profile_id UUID;
  v_avg_rating        NUMERIC(3,2);
  v_session_count     INTEGER;
  v_bayesian_score    NUMERIC(5,4);
BEGIN
  -- Determine which mentor_profile_id to update
  IF TG_OP = 'DELETE' THEN
    v_mentor_profile_id := OLD.mentor_profile_id;
  ELSE
    v_mentor_profile_id := NEW.mentor_profile_id;
  END IF;

  -- Compute fresh aggregates
  SELECT
    COALESCE(AVG(rating)::NUMERIC(3,2), 0),
    COUNT(*)::INTEGER
  INTO v_avg_rating, v_session_count
  FROM reviews
  WHERE mentor_profile_id = v_mentor_profile_id;

  -- Bayesian smoothing: (n * avg + 10 * 4.0) / (n + 10)
  v_bayesian_score := (v_session_count * v_avg_rating + 10 * 4.0) / (v_session_count + 10);

  UPDATE mentor_profiles
  SET
    avg_rating     = v_avg_rating,
    session_count  = v_session_count,
    bayesian_score = v_bayesian_score,
    updated_at     = NOW()
  WHERE id = v_mentor_profile_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_mentor_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_mentor_rating_aggregates();

-- ============================================================
-- Auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_mentor_profiles_updated_at
  BEFORE UPDATE ON mentor_profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_session_types_updated_at
  BEFORE UPDATE ON session_types FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_outcome_reports_updated_at
  BEFORE UPDATE ON outcome_reports FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- Trigger: auto-create users row on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
