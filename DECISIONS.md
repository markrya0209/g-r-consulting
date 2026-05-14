# Architectural Decisions Log

Append new entries here after each Claude Code session.
Format: ## YYYY-MM-DD — Topic

---

## Planning — Data model

- **7 tables, no more at launch**: users, mentor_profiles, session_types, bookings,
  reviews, outcome_reports, payments. Notifications implemented as Supabase Realtime
  on a lightweight notifications table rather than a separate service.

- **Rating aggregates are pre-computed**: avg_rating, session_count, and bayesian_score
  live as columns on mentor_profiles, updated by Postgres trigger on every review
  INSERT/UPDATE/DELETE. Never computed at query time. Bayesian smoothing prevents
  new mentors with 1×5-star from outranking established mentors.

- **Soft deletes everywhere**: deleted_at timestamp + PII nulling. Booking history
  and review aggregates are preserved for platform integrity.

- **Role stored in users table, not JWT**: users.role ('mentor' | 'mentee' | 'admin').
  Middleware does a DB check. Avoids JWT invalidation complexity when roles change.

---

## Planning — Auth

- **Google OAuth is required from day 1**: University students are already authenticated
  via Google. Removing this friction is material to mentor acquisition.

- **Resend handles all auth emails, not Supabase's built-in**: Consistent branding,
  better deliverability, same sending domain as transactional emails.

- **Email verification is a soft gate**: Required before first booking (mentee) and
  before going live (mentor). Not a hard block on account creation.

- **Institutional email verification is separate from account verification**: Mentor
  can verify their university email (.edu / university domain) to earn a "Verified
  Student" badge. This is optional — not required to go live.

---

## Planning — Payments

- **Stripe Connect Express, not Standard**: Express handles KYC and bank account
  management for mentors. We don't want to build that UI.

- **11% platform fee**: Applied via application_fee_amount on every PaymentIntent.
  Never split manually. Stripe handles the transfer to the mentor's Connect account.

- **24h payout delay**: Funds released 24h after session_completed, not immediately.
  Gives time to handle disputes before funds leave the platform.

- **Stripe platform application submitted on day 1**: Approval can take 2–7 days.
  Blocking if not started early.

---

## Planning — Scheduling & Video

- **Cal.com for scheduling, Daily.co for video — no custom implementations**:
  Both have prebuilt UIs that handle the hard parts (timezone, device permissions,
  calendar sync). Building custom versions of either is out of scope for launch.

- **Daily.co room created at booking confirmation, not at session start**:
  Eliminates a failure mode 10 minutes before a live session.

- **No session recording at launch**: Requires consent collection, storage costs,
  and deletion workflows. Re-evaluate post-launch.

- **Join button disabled with countdown until T-10 minutes**: Prevents accidental
  early joins and empty rooms.

---

## Planning — Booking flow

- **Cal.com provisional booking confirmed synchronously in the Stripe webhook handler**:
  Not in a separate async job. Keeps the confirmed state consistent.

- **Provisional Cal.com bookings are deleted (not kept) if payment fails**:
  Prevents slot pollution from abandoned checkout sessions.

- **ICS calendar attachment generated server-side on confirmation**:
  Contains Daily.co room URL. Attached to confirmation email via Resend.

- **Post-payment always lands on our confirmation page, never Stripe's**:
  Consistent experience, allows us to show session context and next steps.

---

## Planning — Post-session

- **Mentor outcome report is a required step, not optional**:
  The structured post-session report emailed to the mentee is a core value prop —
  a tangible deliverable after a €30 session. It also drives referrals.

- **Minimum review length enforced (20 chars)**: Prevents one-word reviews.
  Maximum 500 chars keeps reviews readable in discovery.

- **One review per booking, no editing after 24h**: Prevents review manipulation.

- **Graduation flywheel email sent 6–12 months after mentee session**:
  Invites mentees to become mentors. Core supply-side acquisition loop.
  Implemented as a monthly Vercel cron job.

---

## Planning — Architecture

- **One Vercel cron job per file**: complete-sessions, release-payouts, retry-emails,
  graduation-flywheel. Independent failure isolation.

- **All cron routes protected by CRON_SECRET env var**:
  `Authorization: Bearer $CRON_SECRET` header verified in each handler.
  Do not rely on Vercel's built-in cron protection alone.

- **Admin panel uses service role key directly**:
  Route-gated to users.role = 'admin'. Never expose service role to client.

- **Stripe webhook idempotency**:
  Check payments table for existing stripe_payment_intent_id before processing.
  Always return 200 to Stripe even if already processed.

- **Email failures never block booking confirmations**:
  Log to email_queue table with status = 'failed'. Retry cron handles re-sends.
  Booking is confirmed in DB regardless of email success.

---

## Planning — Marketing & Legal

- **Marketing pages are static Next.js pages with no DB dependency**:
  Can be deployed independently. No auth required.

- **Terms of Service and Privacy Policy must be legally reviewed before launch**:
  Privacy Policy must name all data processors: Supabase, Stripe, Cal.com, Daily.co, Resend.

- **GDPR compliance requirements for Portugal**:
  - Consent checkbox at signup with timestamp
  - Cookie consent banner (reject must work — no non-essential cookies before consent)
  - Age gate: 16+ minimum
  - Data export on request (GDPR Article 20) — Edge Function → JSON → Resend
  - Right to erasure — soft delete + PII nulling

---
<!-- New entries go below this line -->
