# Mentor Marketplace — Claude Code Context

## What this is
A two-sided marketplace where current Portuguese university students (mentors) offer
paid 1:1 sessions to prospective applicants (mentees) navigating the Portuguese
admissions system — primarily the Concurso Nacional de Acesso (CNA), but also
international student pathways and private university admissions.

Sessions: €20–50/hr. Platform takes 11%.

## Tech stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (auth, PostgreSQL, storage, realtime)
- **Payments**: Stripe Connect (marketplace payments)
- **Scheduling**: Cal.com
- **Video**: Daily.co
- **Email**: Resend (React Email templates)
- **Deployment**: Vercel (+ Vercel cron jobs for scheduled tasks)

## Data model — 7 core tables
```
users               — all accounts (mentors + mentees + admins)
mentor_profiles     — mentor-specific data, aggregates, Stripe/Cal IDs
session_types       — the 8 session types each mentor can enable
bookings            — every booking from slot selection through completion
reviews             — mentee reviews of sessions
outcome_reports     — mentor's post-session notes sent to mentee
payments            — Stripe payment records, fee tracking, payout status
```

Row-level security enforced at the database layer on ALL tables.
Never bypass RLS with service role key except in Vercel cron jobs and admin routes.

## The 8 session types
1. CNA score strategy (nota de candidatura calculation)
2. Prova de ingresso selection
3. Candidatura option ordering
4. Course and institution selection
5. Exam equivalency (international/diaspora students)
6. Subject tutoring for national exams
7. "What is university X actually like" guidance
8. International student pathways

## Non-negotiable business rules

### Ratings
- NEVER compute rating aggregates at query time
- avg_rating, session_count, and bayesian_score live on mentor_profiles
- Updated exclusively by Postgres trigger on reviews INSERT/UPDATE/DELETE
- Bayesian score formula: (session_count * avg_rating + 10 * 4.0) / (session_count + 10)

### Discovery
- All mentor discovery queries MUST filter: is_active = true AND stripe_payouts_enabled = true
- Mentors without completed Stripe Connect onboarding never appear in browse

### Booking status transitions
```
pending_payment → confirmed → session_completed → (archived)
              ↘ cancelled_by_mentor
              ↘ cancelled_by_mentee
              ↘ cancelled_late  (mentee, ≤24h before — no refund)
```

### Payments
- Always use application_fee_amount (11%) + transfer_data.destination
- Never split payments manually
- Payout release: 24h after session_completed via Vercel cron, not immediately
- Store payment_released_at on payments row when transfer is made

### Cancellations
- Mentor cancels → full Stripe refund via API, status → cancelled_by_mentor
- Mentee cancels >24h before → full refund, status → cancelled_by_mentee
- Mentee cancels ≤24h before → no refund, mentor keeps earnings, status → cancelled_late

### Deletions (GDPR)
- All user deletions are SOFT deletes
- Set deleted_at timestamp, null the PII fields (name, email, photo_url)
- Preserve booking records with anonymised user references
- Preserve review aggregates (they're not PII)

### Cron jobs — one file per job, independent in vercel.json
1. Session status transitions — every 15 minutes
2. Payout release — daily at 02:00 UTC
3. Reminder emails (24h + 1h before sessions) — every 30 minutes
4. Graduation flywheel emails — monthly, 1st of month

## Folder structure
```
/app
  /(auth)/              — signup, login, reset, role-selection
  /(mentor)/            — mentor dashboard, profile editing, earnings
  /(mentee)/            — mentee dashboard
  /mentors/[slug]/      — public mentor profile page
  /sessions/[id]/       — video session room
  /admin/               — admin panel (role-gated)
  /api/
    /webhooks/stripe/   — Stripe webhook handler
    /webhooks/calcom/   — Cal.com webhook handler (optional)
    /cron/              — cron job routes
/components
  /ui/                  — shadcn/ui primitives only
  /mentor/              — mentor-specific components
  /mentee/              — mentee-specific components
  /booking/             — booking flow components
  /session/             — video session components
  /email/               — React Email templates
/lib
  /supabase/            — client.ts, server.ts, middleware.ts, database.types.ts
  /stripe/              — payment-intent.ts, webhook.ts, connect.ts
  /calcom/              — booking.ts, availability.ts
  /daily/               — room.ts
  /resend/              — send.ts, templates index
/supabase
  /migrations/          — numbered SQL files (0001_, 0002_, etc.)
  /seed.sql             — dev seed data with realistic PT university data
```

## Commands
```bash
npm run dev              # local dev server
npx supabase db push     # push migrations to Supabase
npx supabase gen types typescript --project-id $PROJECT_ID > lib/supabase/database.types.ts
npm run email:dev        # React Email preview server
```

## Environment variables (see .env.example)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY       # cron jobs + admin only
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
CALCOM_API_KEY
DAILY_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

## Auth
- Supabase Auth: email+password + Google OAuth
- Role stored on users.role ('mentor' | 'mentee' | 'admin'), NOT in JWT claims
- Middleware does a lightweight DB check on all protected routes
- All auth emails routed through Resend (not Supabase's built-in templates)
- Session refresh handled automatically by Supabase JS client

## Key integration dependencies
Read BOOKING_FLOW.md before writing any booking or payment code.
Read RLS_POLICIES.md before writing any database queries or migrations.
Read DECISIONS.md for all architectural decisions made so far.

## Seed data (use in dev)
Universities: IST, FCUL, Nova FCM, UC Coimbra, UMinho, UP
Mentor names: Ana Silva, Pedro Santos, Maria Costa, João Ferreira, Inês Rodrigues, Tomás Oliveira
Programs: Engenharia Informática, Medicina, Direito, Economia, Biologia, Arquitetura
