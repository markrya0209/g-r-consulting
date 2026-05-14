# Row-Level Security Policies

Apply these policies exactly as written. Do not infer or simplify.
All tables have RLS enabled. No anonymous access to any table except where noted.

---

## users

```sql
-- SELECT: own row only
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- INSERT: only during signup (handled by trigger, not direct insert)
-- No direct INSERT policy — user row created by Supabase auth trigger

-- UPDATE: own row only
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- DELETE: nobody (soft delete only via UPDATE)
-- No DELETE policy
```

---

## mentor_profiles

```sql
-- SELECT (public): active mentors with Stripe payouts enabled
CREATE POLICY "mentor_profiles_select_public" ON mentor_profiles
  FOR SELECT USING (
    is_active = true AND stripe_payouts_enabled = true AND deleted_at IS NULL
  );

-- SELECT (own): mentor can always see their own profile regardless of status
CREATE POLICY "mentor_profiles_select_own" ON mentor_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: only the authenticated user can create their own mentor profile
CREATE POLICY "mentor_profiles_insert_own" ON mentor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: only the authenticated user can update their own profile
CREATE POLICY "mentor_profiles_update_own" ON mentor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: nobody (use is_active = false instead)
```

---

## session_types

```sql
-- SELECT (public): session types for active mentors only
CREATE POLICY "session_types_select_public" ON session_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mentor_profiles mp
      WHERE mp.id = session_types.mentor_profile_id
        AND mp.is_active = true
        AND mp.stripe_payouts_enabled = true
        AND mp.deleted_at IS NULL
    )
  );

-- SELECT (own): mentor sees all their own session types
CREATE POLICY "session_types_select_own" ON session_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mentor_profiles mp
      WHERE mp.id = session_types.mentor_profile_id
        AND mp.user_id = auth.uid()
    )
  );

-- INSERT / UPDATE / DELETE: only the owning mentor
CREATE POLICY "session_types_modify_own" ON session_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mentor_profiles mp
      WHERE mp.id = session_types.mentor_profile_id
        AND mp.user_id = auth.uid()
    )
  );
```

---

## bookings

```sql
-- SELECT: only the mentor or mentee on that booking
CREATE POLICY "bookings_select_participants" ON bookings
  FOR SELECT USING (
    auth.uid() = mentee_id OR auth.uid() = mentor_id
  );

-- INSERT: only the mentee can create a booking (for themselves)
CREATE POLICY "bookings_insert_mentee" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

-- UPDATE: mentee can update status (cancellation) or mentee_context
--         mentor can update status (cancellation) and outcome fields
CREATE POLICY "bookings_update_participants" ON bookings
  FOR UPDATE USING (
    auth.uid() = mentee_id OR auth.uid() = mentor_id
  );

-- DELETE: nobody
```

---

## reviews

```sql
-- SELECT: public — reviews are visible to anyone browsing mentor profiles
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (true);

-- INSERT: only the mentee on the booking, once per booking
CREATE POLICY "reviews_insert_mentee" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = mentee_id
    AND NOT EXISTS (
      SELECT 1 FROM reviews r2
      WHERE r2.booking_id = reviews.booking_id
    )
  );

-- UPDATE: mentee can edit their review within 24h of submission
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (
    auth.uid() = mentee_id
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- DELETE: nobody (admin deletes via service role in admin panel)
```

---

## outcome_reports

```sql
-- SELECT: only the mentor (author) or mentee (recipient) on that booking
CREATE POLICY "outcome_reports_select_participants" ON outcome_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = outcome_reports.booking_id
        AND (b.mentor_id = auth.uid() OR b.mentee_id = auth.uid())
    )
  );

-- INSERT: only the mentor on that booking
CREATE POLICY "outcome_reports_insert_mentor" ON outcome_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = outcome_reports.booking_id
        AND b.mentor_id = auth.uid()
    )
  );

-- UPDATE: only the mentor, within 24h
CREATE POLICY "outcome_reports_update_mentor" ON outcome_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = outcome_reports.booking_id
        AND b.mentor_id = auth.uid()
    )
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- DELETE: nobody
```

---

## payments

```sql
-- SELECT: mentor sees payments for their sessions, mentee sees their own charges
CREATE POLICY "payments_select_participants" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = payments.booking_id
        AND (b.mentor_id = auth.uid() OR b.mentee_id = auth.uid())
    )
  );

-- INSERT / UPDATE / DELETE: service role only (handled by cron + webhook handlers)
-- No user-facing write policies on payments
```

---

## notifications (if implemented as a table)

```sql
-- SELECT: only the recipient
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: service role only
-- UPDATE: user can mark as read
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Admin access
Admin routes use the Supabase service role key directly.
Admin middleware checks `users.role = 'admin'` before allowing access.
Never expose service role key to the client.

## Notes
- All cron job routes (`/api/cron/*`) use service role key and are protected by
  `Authorization: Bearer $CRON_SECRET` header verified in each handler.
- Stripe webhook handler (`/api/webhooks/stripe`) uses service role key.
  Verify `stripe-signature` header before any DB operation.
