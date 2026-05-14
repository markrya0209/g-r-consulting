# Claude Code Session Prompts

Copy-paste these prompts at the start of each Claude Code session.
Each prompt references the task numbers from ROADMAP.md.
Always include: "Read CLAUDE.md, DECISIONS.md, and [relevant files] before starting."

---

## Phase 1 — Foundation

### Session 1A: Repo setup + schema
```
Read CLAUDE.md and DECISIONS.md before starting.

Tasks #3–4: Set up the repository and deploy the initial database schema.

1. Create a Next.js 15 app with TypeScript, Tailwind CSS, and shadcn/ui at the root.
   Use the folder structure defined in CLAUDE.md exactly.
   Add a .env.example with every environment variable listed in CLAUDE.md.

2. Write supabase/migrations/0001_initial_schema.sql containing:
   - All 7 tables: users, mentor_profiles, session_types, bookings, reviews,
     outcome_reports, payments
   - All columns with correct types, nullability, and defaults
   - All foreign key constraints
   - The RLS policies from RLS_POLICIES.md applied to every table
   - The Postgres trigger function that updates mentor_profiles.avg_rating,
     session_count, and bayesian_score on every INSERT, UPDATE, DELETE to reviews
   - A seed of the 8 session type base records in session_types

3. After writing the migration, generate TypeScript types from the schema and write
   them to lib/supabase/database.types.ts. Then create the three Supabase helpers:
   lib/supabase/client.ts (browser), lib/supabase/server.ts (server components),
   lib/supabase/middleware.ts (Next.js middleware).

Use the types throughout — never use 'any' for Supabase query results.
```

### Session 1B: Auth flows
```
Read CLAUDE.md and DECISIONS.md before starting.
The schema is deployed. database.types.ts exists and is up to date.

Tasks #6–15: Build the complete auth system.

Build in this order:
1. Email + password signup with role selection screen (mentor/mentee) — task #8 is
   a required screen between email verification and the first dashboard visit.
2. Google OAuth (same role selection screen applies for new Google users).
3. Email verification gate — middleware should block /dashboard until verified.
4. Password reset (magic link flow, email delivered via Resend not Supabase default).
5. GDPR consent checkbox + age gate (16+) + ToS acceptance — all on the signup form.
   Store terms_accepted_at, tos_accepted_at timestamps on users row.

Route protection rules (from CLAUDE.md):
- Role is stored on users.role, NOT in JWT claims. Middleware does a DB check.
- /dashboard routes: require auth + email verified
- /(mentor)/ routes: require role = 'mentor'
- /(mentee)/ routes: require role = 'mentee'
- /admin/ routes: require role = 'admin'

All auth emails (verification, password reset) go through Resend.
Set up Resend in lib/resend/send.ts with a base React Email template.
```

### Session 1C: Legal static pages + email infrastructure
```
Read CLAUDE.md before starting.

Tasks #1–2, #16: Build the legal pages and Resend infrastructure.

1. Create placeholder static pages at /terms and /privacidade.
   These pages must exist and be linked before any user signup.
   Use the content requirements from FEATURE_SPEC.md (Legal section).
   Mark each with a visible "DRAFT — PENDING LEGAL REVIEW" banner.

2. Set up the cookie consent banner as a global layout component.
   Accept: set localStorage.cookieConsent = 'accepted', cookie for SSR.
   Reject: set localStorage.cookieConsent = 'rejected'.
   No analytics scripts load before acceptance.

3. Set up Resend: configure the client in lib/resend/send.ts.
   Create a base React Email template in components/email/BaseEmail.tsx.
   The base template should accept: subject, preheader, children.
   Create an email_queue table migration if it doesn't exist yet:
   email_queue(id, to, subject, template, payload, status, attempts, created_at, last_attempted_at)
```

---

## Phase 2 — Supply side

### Session 2A: Mentor onboarding wizard
```
Read CLAUDE.md, DECISIONS.md, and FEATURE_SPEC.md (Mentor Onboarding section) before starting.

Tasks #17–24: Build the full mentor onboarding wizard.

The wizard lives at /onboarding/mentor. It has 4 steps with a progress indicator.
Each step writes to the database immediately on "Seguinte" — closing the tab
and returning should resume from the last completed step.

Step 1 — Identity: name, display name, profile photo (upload to Supabase Storage,
  path: avatars/{user_id}.jpg), university dropdown (hardcode the seeded list),
  faculty, degree name, current year, languages (multi-select).

Step 2 — Session types: show all 8 types as toggle cards. When enabled: reveal
  a custom description input (max 150 chars) and a price input (€20–50, validated
  server-side too). Store each enabled type in session_types table.

Step 3 — Availability: embed Cal.com's inline scheduler for the mentor to set
  recurring weekly availability. Store cal_user_id and event_type_id returned
  by Cal.com on mentor_profiles.

Step 4 — Stripe Connect: redirect to Stripe Connect Express onboarding.
  On return, check payouts_enabled via Stripe API.
  Store stripe_account_id and stripe_payouts_enabled on mentor_profiles.
  If not yet approved: show "A aguardar verificação Stripe" status with a re-launch link.

After all 4 steps: show a "Perfil criado!" confirmation with a link to their public
profile and a toggle to go live (sets is_active = true if Stripe is verified).
```

### Session 2B: Mentor profiles + discovery
```
Read CLAUDE.md and FEATURE_SPEC.md (Mentor Profiles and Discovery sections) before starting.

Tasks #29–43: Build public mentor profiles and the browse page.

1. Public profile at /mentors/[slug] — SSR with ISR (revalidate: 60 seconds).
   Layout as described in FEATURE_SPEC.md. The slug is mentor_profiles.slug
   (set during onboarding from display_name + numeric suffix for uniqueness).
   Fetch mentor profile + active session types + reviews (paginated, 5 per page)
   + Cal.com next 3 available slots (Cal.com API call server-side).

2. Mentor listing page at /mentors — 20 per page.
   Query: mentor_profiles WHERE is_active = true AND stripe_payouts_enabled = true
   AND deleted_at IS NULL, joined with users and session_types.
   Implement all filters (session type, university, language) and sort options
   (relevance = bayesian_score, newest, price ascending).
   Filters serialised to URL params.

3. Mentee onboarding (tasks #25–28): single screen at /onboarding/mentee.
   Name (required), photo (optional), student type, target pathway, desired course.
   Run parallel with mentor onboarding build.
```

---

## Phase 3 — Transaction core

### Session 3A: Booking flow + payments
```
Read CLAUDE.md, DECISIONS.md, and BOOKING_FLOW.md before starting.
This is the most integration-heavy session. Read BOOKING_FLOW.md carefully before writing any code.

Tasks #44–55: Build the complete booking and payment flow.

Follow the happy path sequence in BOOKING_FLOW.md exactly.

1. Booking flow pages (3 steps + confirmation):
   /mentors/[slug]/book?session_type_id=X
   Step 1: Cal.com inline slot picker → create draft booking row
   Step 2: Pre-session context form → UPDATE booking
   Step 3: Summary with price breakdown → POST /api/checkout
   /bookings/[id]/confirmed: confirmation page (never Stripe's hosted page)

2. /api/checkout route:
   Create Stripe PaymentIntent as specified in BOOKING_FLOW.md.
   Return the Stripe Checkout URL.

3. /api/webhooks/stripe route:
   Verify stripe-signature FIRST.
   Handle payment_intent.succeeded: confirm booking, create payment record,
   confirm Cal.com booking, create Daily.co room, send both confirmation emails.
   Handle all errors as described in BOOKING_FLOW.md (log, don't fail the webhook).
   Implement idempotency check.

4. Confirmation emails (tasks #53–55):
   Create React Email templates: BookingConfirmedMentee, BookingConfirmedMentor.
   ICS attachment generated server-side.
```

### Session 3B: Cancellations + video room
```
Read CLAUDE.md, DECISIONS.md, and BOOKING_FLOW.md (Cancellation flows section) before starting.

Tasks #56–63: Cancellation flows and the video session room.

1. Cancellation flows as specified in BOOKING_FLOW.md:
   - Mentor cancel: accessible from mentor dashboard, requires booking ID
   - Mentee cancel >24h: accessible from mentee dashboard
   - Mentee cancel ≤24h: same UI, different outcome
   Each cancellation: Stripe refund (if applicable), booking status update,
   Cal.com cancellation, Resend email to the other party.

2. Session room at /sessions/[bookingId]:
   Auth check: user must be mentor_id or mentee_id on the booking.
   Join button: disabled with countdown until T-10 minutes.
   Daily.co prebuilt embed: <iframe src={booking.room_url} allow="camera; microphone; fullscreen; speaker; display-capture" />.
   Session context panel: session type, mentee_context, current_situation, duration.
```

### Session 3C: Cron jobs + post-session
```
Read CLAUDE.md and DECISIONS.md before starting.

Tasks #64–72: Cron jobs, post-session flows, and payout release.

1. Vercel cron: /api/cron/complete-sessions (every 15 minutes)
   Protected by Authorization: Bearer $CRON_SECRET header.
   Query and transition as specified in ROADMAP.md task #64.
   After transitioning: queue review request email for 1h later.

2. Vercel cron: /api/cron/release-payouts (daily at 02:00 UTC)
   Protected by CRON_SECRET.
   Query and Stripe transfer as specified in BOOKING_FLOW.md step 6.

3. Post-session review form at /sessions/[bookingId]/review:
   Only accessible when booking.status = 'session_completed'.
   5-star tap targets, textarea (20–500 chars enforced), recommend toggle.
   On submit: INSERT reviews, trigger fires automatically, send mentor notification.

4. Mentor outcome report at /sessions/[bookingId]/report:
   Only accessible to the mentor on that booking.
   Checklist of topics (contextual to session type — define per session type).
   On submit: INSERT outcome_reports, send formatted email to mentee.

5. vercel.json cron configuration:
   Each cron job gets its own entry. Include complete-sessions, release-payouts,
   retry-emails, graduation-flywheel.
```

---

## Phase 4 — Retention & ops

### Session 4A: Dashboards
```
Read CLAUDE.md and FEATURE_SPEC.md (Dashboards section) before starting.

Tasks #73–82: Build mentor and mentee dashboards.

Mentor dashboard at /(mentor)/dashboard:
- Next session card (task #73): query + join button with T-10 activation
- Earnings widget (task #74): this month / pending / total metric cards
- Upcoming sessions list (task #75): next 7 days, mentee anonymised until T-24h
- Recent reviews strip (task #76): last 3 reviews
- Quick actions (task #77): links to profile, availability, earnings
- Profile completeness banner if wizard not complete

Mentee dashboard at /(mentee)/dashboard:
- Next session card (task #80)
- Pending reviews prompt (task #81): sessions completed without a review
- Find a mentor CTA (task #82): empty state

Both dashboards:
- Supabase Realtime on notifications table for live badge count
- New booking toast for mentor (task #85)
- Join button activates at T-10 without page refresh (task #86)
```

### Session 4B: Notifications + settings + profile editing
```
Read CLAUDE.md and FEATURE_SPEC.md (Notifications, Dashboards) before starting.

Tasks #83–92: Reminder emails, realtime, account settings, profile editing.

1. Vercel cron: /api/cron/reminders (every 30 minutes)
   Query bookings scheduled 23.5–24.5h out → send 24h reminder to both parties.
   Query bookings scheduled 55–65 min out → send 1h reminder to both parties.
   Track sent reminders to avoid duplicates (add reminder_24h_sent, reminder_1h_sent
   boolean columns to bookings, or use a sent_reminders table).

2. In-app notification feed (task #87):
   Supabase Realtime subscription in a client component.
   Notifications table: id, user_id, type, title, body, read, created_at.
   Bell icon in nav with unread count badge. Dropdown showing last 5.

3. Account settings at /settings:
   Update display name, profile photo, email (triggers re-verification), password.
   Email preferences toggles (reminders, marketing).
   Data export button → POST /api/user/export.
   Account deletion button → confirmation modal → soft delete.

4. Mentor profile editing at /(mentor)/profile:
   Edit all Step 1 + Step 2 fields. Add/remove session types. Update prices.
   On save: ISR revalidation of /mentors/[slug] via res.revalidate().
   'On pause' toggle.
```

### Session 4C: Admin panel
```
Read CLAUDE.md and FEATURE_SPEC.md (Admin Panel section) before starting.

Tasks #93–99: Build the admin panel.

Admin panel at /admin — gated by middleware checking users.role = 'admin'.
All queries use Supabase service role key (SUPABASE_SERVICE_ROLE_KEY).

Build each view:
1. /admin/users — searchable user list with role + status filters. User detail panel.
2. /admin/bookings — booking list with status filter, sortable by date.
3. /admin/revenue — three metric cards + monthly bar chart (last 6 months).
4. /admin/refunds — form: input booking ID → show payment details → confirm → refund.
   Log every admin action to admin_actions table (admin_id, action, target_id, note, created_at).
5. /admin/reviews — all reviews, delete button with confirmation.
6. /admin/reports — flagged_profiles queue, dismiss or suspend actions.

Suspend account (task #97): set users.is_suspended = true +
call supabase.auth.admin.signOut(user_id) + set mentor_profiles.is_active = false.
```

---

## Phase 5 — Launch readiness

### Session 5A: GDPR + account management
```
Read CLAUDE.md, DECISIONS.md, and FEATURE_SPEC.md (Legal section) before starting.

Tasks #100–103: Account settings completion and GDPR compliance.

1. Complete account settings page (task #100) if not already done in 4B.

2. Account deletion (task #101):
   Confirmation modal: "Tens a certeza? Esta ação não pode ser revertida."
   On confirm: soft delete (deleted_at, null PII), cancel all pending bookings
   with full Stripe refunds, cancel Cal.com bookings, revoke Stripe payouts.
   Redirect to / with a "Conta eliminada" flash message.

3. Data export (task #102):
   Supabase Edge Function: collect all user data from all tables.
   Format as structured JSON. Send via Resend as .json attachment.

4. Right to erasure (task #103):
   Extend deletion: anonymise bookings (mentee_display = 'Utilizador eliminado'),
   anonymise reviews (reviewer_label = 'Utilizador eliminado').
   These records are kept for financial/legal obligations per GDPR Article 17(3)(e).
```

### Session 5B: Marketing pages
```
Read CLAUDE.md and FEATURE_SPEC.md (Marketing Pages section) before starting.

Tasks #104–109: Build all marketing pages.

All pages are static Next.js pages. No auth required. No DB queries.
All copy in Portuguese. Use realistic PT university context.

Build in parallel:
- / (landing page) — required for launch
- /como-funciona
- /para-mentores (include interactive earnings calculator: hours/week × price → monthly)
- /para-candidatos
- /faq
- /precos

Use the content specifications from FEATURE_SPEC.md for each page.
These pages should share a consistent marketing layout (different from the app layout).
```

### Session 5C: Final systems + launch checks
```
Read CLAUDE.md, DECISIONS.md, and BOOKING_FLOW.md before starting.

Tasks #110–111: Graduation flywheel and final verification.

1. Graduation flywheel cron (task #110):
   /api/cron/graduation-flywheel — runs monthly (1st of month, 09:00 UTC).
   Query as specified in FEATURE_SPEC.md (Reviews & Outcomes section).
   Create React Email template: GraduationInvite.
   Send to qualifying mentees.

2. Stripe Connect end-to-end verification (task #111):
   Using Stripe test mode + a test bank account:
   - Complete full mentor Stripe Connect Express onboarding
   - Make a test booking as a mentee
   - Verify PaymentIntent created correctly with fee and destination
   - Verify webhook fires and booking confirms
   - Verify payout cron releases funds to Connect account
   - Verify refund flow for both cancellation types
   Document any issues found in DECISIONS.md.

3. Pre-launch checklist:
   - All RLS policies tested with different user roles
   - Stripe webhook secret set in production environment
   - CRON_SECRET set and all cron routes protected
   - Terms and Privacy Policy marked as legally reviewed (remove DRAFT banner)
   - Cookie consent working in production (no analytics before accept)
   - GDPR deletion flow tested end-to-end
   - Daily.co room creation failure fallback tested
   - All Resend templates tested in production (not preview)
```

---

## General session-start template
Use this to open any continuation session:
```
Read CLAUDE.md and DECISIONS.md before starting. We're continuing Phase [X].

[Paste any new entries you've added to DECISIONS.md since last session]

Today's tasks: [list task numbers and names from ROADMAP.md]

[Any specific context: "The schema changed — regenerate database.types.ts first."]
[Or: "The previous session completed tasks #X–Y. Start from #Z."]
```
