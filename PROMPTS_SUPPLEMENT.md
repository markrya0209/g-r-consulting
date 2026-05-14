# Supplementary Prompts & Context

This file contains what the other context docs don't cover:
current project state, context-window efficiency rules, integration
setup steps specific to this project, and deployment instructions.

Read this at the start of any new session **in addition to** the
relevant docs listed in SESSION_PROMPTS.md.

---

## 1 — Current project state (as of 2026-05-14)

Paste this block at the top of any session prompt to skip re-deriving state:

```
CURRENT STATE — do not redo any of this:

Phase 1A is complete and deployed:
- Next.js 15 + TypeScript + Tailwind + shadcn/ui scaffolded at repo root.
- All 8 tables deployed to Supabase project ovvublomhshliiixyyip.supabase.co:
  users, mentor_profiles, session_types, bookings, reviews,
  outcome_reports, payments, notifications — all with RLS enabled.
- Bayesian rating trigger, updated_at triggers, and auth user
  auto-create trigger are live.
- lib/supabase/{client,server,middleware}.ts + database.types.ts exist.
- lib/stripe/{connect,payment-intent,webhook}.ts stubs exist.
- lib/calcom/{booking,availability}.ts stubs exist.
- lib/daily/room.ts and lib/resend/send.ts stubs exist.
- middleware.ts handles session refresh + admin role guard.
- .env.local has: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY filled in.
  Stripe, Cal.com, Daily.co, Resend keys are placeholder — fill in
  each as those integrations are set up.
- supabase/config.toml exists and is linked to ovvublomhshliiixyyip.
- Google OAuth is enabled in Supabase Auth but needs real Google
  Console credentials (client ID + secret) before it works.

Do not re-scaffold, re-migrate, or re-create any of the above.
If you need to see a file's current content, read it directly.
```

---

## 2 — Context window efficiency rules

**200k token budget per session.** The context docs together are ~40k tokens.
Loading all of them every session leaves ~160k for code — workable but wasteful.
Load only what the session actually needs:

| Session | Load these docs |
|---|---|
| Auth (1B) | CLAUDE.md, DECISIONS.md |
| Legal / email (1C) | CLAUDE.md, FEATURE_SPEC.md (Legal section) |
| Mentor onboarding (2A) | CLAUDE.md, FEATURE_SPEC.md (Mentor Onboarding) |
| Profiles + discovery (2B) | CLAUDE.md, FEATURE_SPEC.md (Profiles, Discovery) |
| Booking + payments (3A) | CLAUDE.md, DECISIONS.md, BOOKING_FLOW.md |
| Cancellations + video (3B) | CLAUDE.md, BOOKING_FLOW.md |
| Cron + post-session (3C) | CLAUDE.md, DECISIONS.md |
| Dashboards (4A) | CLAUDE.md, FEATURE_SPEC.md (Dashboards) |
| Notifications + settings (4B) | CLAUDE.md, FEATURE_SPEC.md (Notifications) |
| Admin panel (4C) | CLAUDE.md, FEATURE_SPEC.md (Admin) |
| GDPR (5A) | CLAUDE.md, DECISIONS.md, FEATURE_SPEC.md (Legal) |
| Marketing pages (5B) | CLAUDE.md, FEATURE_SPEC.md (Marketing) |
| Launch checks (5C) | CLAUDE.md, DECISIONS.md, BOOKING_FLOW.md |

**Never** ask Claude to summarise, explain, or audit at session start —
go straight to "build X". Explanatory turns burn tokens without output.

**Pro plan 5-hour daily limit at medium effort:** Each session (500–800
lines of code) uses roughly 20–35 minutes of compute. Budget ~10 sessions
per day. The remaining 13 sessions (1B through 5C) fit comfortably in
two days. Splitting one long phase across two short sessions is better
than one session that runs out of context and truncates output.

**When a session nears the end of context:** Stop at a clean boundary
(complete function, complete file). Start the next session with the
"current state" block above plus: "The previous session finished [X].
Continue from [Y]." Do not ask Claude to re-read what it just wrote.

---

## 3 — Type regeneration

Run this after **any** schema change (new migration file pushed):

```bash
SUPABASE_ACCESS_TOKEN=<your_token> \
  npx supabase gen types typescript \
  --project-id ovvublomhshliiixyyip \
  > lib/supabase/database.types.ts
```

Then add to the session prompt: "database.types.ts has been regenerated —
use it directly, do not rewrite it."

The email_queue table (added in session 1C) and any reminder columns
added in 4B need to be reflected before those sessions start.

---

## 4 — GitHub → Supabase auto-migration

The Supabase project is linked to markrya0209/g-r-consulting.
When you push a new migration file to `main`, Supabase runs it automatically.

Rules:
- New migrations **always** get a new numbered file: `0002_`, `0003_`, etc.
- Never edit a migration that has already been pushed to Supabase.
  If you need to fix something, write a new migration that alters the table.
- After pushing: confirm the migration ran in the Supabase dashboard
  under Database → Migrations before starting the next session.

Session prompt addition when a new migration is needed:
```
After writing the migration file, push it:
  git add supabase/migrations/000X_description.sql
  git commit -m "feat: add 000X_description migration"
  git push
Then wait for Supabase to confirm it applied before continuing.
```

---

## 5 — Stripe Connect setup (do before Session 3A)

These steps must be done in the Stripe dashboard **before** writing any
payment code. Without a live Connect platform application, 3A cannot be
end-to-end tested even in test mode.

```
STRIPE CONNECT SETUP — complete these in the Stripe dashboard first:

1. Go to dashboard.stripe.com → Connect → Get started.
   Submit the Connect platform application.
   Platform type: "Software platform / marketplace".
   Use case: "Service marketplace — tutoring / education".
   Approval takes 2–7 business days.

2. While waiting: enable test mode Connect accounts.
   Settings → Connect settings → Test mode Express accounts: ON.

3. Add these env vars to .env.local once you have them:
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...        (from webhook endpoint below)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

4. Create a webhook endpoint in Stripe dashboard (test mode):
   Endpoint URL: http://localhost:3000/api/webhooks/stripe
   (For production: https://<vercel-url>/api/webhooks/stripe)
   Events to listen for:
     payment_intent.succeeded
     payment_intent.payment_failed
     account.updated                    (for Stripe Connect status changes)

5. The Connect Express onboarding redirect URL for this app is:
   Return URL:  https://<vercel-url>/onboarding/mentor?step=4&stripe=return
   Refresh URL: https://<vercel-url>/onboarding/mentor?step=4&stripe=refresh

Session 3A prompt addition:
"Stripe Connect platform application is submitted.
 Test mode Express accounts are enabled.
 STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY are set in .env.local.
 STRIPE_WEBHOOK_SECRET will be set after the webhook endpoint is deployed."
```

---

## 6 — Cal.com setup (do before Session 2A)

```
CAL.COM SETUP — complete before writing availability/booking code:

1. Create an organisation account at cal.com (not personal).
   Organisation name: G&R Consulting.

2. Create a default event type that all mentors will clone:
   Duration: 60 minutes.
   Title: "Sessão de mentoria CNA".
   Location: Daily.co (or custom URL — set after Daily.co is configured).
   Add to .env.local:
     CALCOM_API_KEY=cal_live_...

3. The Cal.com OAuth/embed flow for mentor onboarding (Step 3) uses:
   Cal.com Atoms — embed the availability scheduler inline.
   Install: npm install @calcom/atoms
   Wrap the onboarding step in <CalProvider> with the API key.

4. Webhook endpoint for booking events:
   In Cal.com dashboard → Developer → Webhooks:
   URL: https://<vercel-url>/api/webhooks/calcom
   Events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED

5. When a mentor completes Step 3, store on mentor_profiles:
   cal_user_id   = the Cal.com user ID returned after OAuth
   cal_event_type_id = the event type ID for their 60-min slot

Session 2A prompt addition:
"CALCOM_API_KEY is set in .env.local.
 Cal.com organisation exists. Default 60-min event type exists.
 Use @calcom/atoms for the inline availability embed in Step 3."
```

---

## 7 — Daily.co setup (do before Session 3A)

```
DAILY.CO SETUP — complete before writing session room code:

1. Create a Daily.co account at daily.co.
   Add to .env.local:
     DAILY_API_KEY=...

2. The room creation logic is already stubbed in lib/daily/room.ts.
   Room names follow the pattern: session-{bookingId}.
   Rooms expire 2 hours after the scheduled session start time.

3. For the session room page (/sessions/[id]):
   Use Daily.co's prebuilt iframe embed (no SDK install needed at launch):
   <iframe
     src={booking.daily_room_url}
     allow="camera; microphone; fullscreen; speaker; display-capture"
     style={{ width: '100%', height: '100%', border: 'none' }}
   />
   The prebuilt UI handles device permission prompts, mute, camera, screenshare.

4. No recording at launch (requires consent collection + storage + deletion flow).
   Room max_participants = 2 (mentor + mentee only).

Session 3B prompt addition:
"DAILY_API_KEY is set in .env.local.
 Room creation stub exists in lib/daily/room.ts.
 Use the prebuilt Daily.co iframe embed — do not install the Daily.co SDK."
```

---

## 8 — Resend setup (do before Session 1C)

```
RESEND SETUP — complete before writing any email templates:

1. Create a Resend account at resend.com.
   Add to .env.local:
     RESEND_API_KEY=re_...

2. Verify the sending domain (required for production deliverability).
   If you don't have a domain yet, use Resend's shared domain for dev:
   From address for dev: onboarding@resend.dev
   From address for production: noreply@<your-domain>
   Update the FROM constant in lib/resend/send.ts when the domain is verified.

3. In Supabase Auth dashboard → Email Templates:
   Disable all Supabase default email templates.
   Supabase will call your custom Resend endpoints instead.
   (This is handled in Session 1B via the auth hooks setup.)

4. All 6 email types in this project:
   BookingConfirmedMentee  — to mentee after payment
   BookingConfirmedMentor  — to mentor after payment (includes mentee context)
   BookingCancelledMentee  — cancellation notice
   BookingCancelledMentor  — cancellation notice
   SessionReminder         — 24h and 1h versions
   GraduationInvite        — monthly flywheel
   (Plus auth emails: verification, password reset — built in Session 1B)

Session 1C prompt addition:
"RESEND_API_KEY is set in .env.local.
 lib/resend/send.ts exists with the base sendEmail() helper.
 Use React Email for all templates (already installed).
 The FROM address is noreply@resend.dev for now — update when domain is verified."
```

---

## 9 — Vercel deployment (do after Session 3C)

```
VERCEL DEPLOYMENT — run after all cron jobs are written:

1. Install Vercel CLI: npm i -g vercel
   Link: vercel link (connect to the markrya0209/g-r-consulting GitHub repo)

2. Add ALL env vars from .env.local to Vercel:
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add STRIPE_SECRET_KEY production
   vercel env add STRIPE_WEBHOOK_SECRET production
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
   vercel env add CALCOM_API_KEY production
   vercel env add DAILY_API_KEY production
   vercel env add RESEND_API_KEY production
   vercel env add NEXT_PUBLIC_APP_URL production
   vercel env add CRON_SECRET production
   (Set NEXT_PUBLIC_APP_URL to your production domain, not localhost)

3. Write vercel.json at repo root with this exact cron config:
   {
     "crons": [
       { "path": "/api/cron/complete-sessions",    "schedule": "*/15 * * * *" },
       { "path": "/api/cron/release-payouts",      "schedule": "0 2 * * *"   },
       { "path": "/api/cron/reminders",            "schedule": "*/30 * * * *" },
       { "path": "/api/cron/graduation-flywheel",  "schedule": "0 9 1 * *"   }
     ]
   }
   All 4 cron routes must verify Authorization: Bearer $CRON_SECRET.

4. Update Supabase Auth → Site URL to your production Vercel URL.
   Update the redirect allowlist to include the Vercel URL.
   Run:
     curl -X PATCH https://api.supabase.com/v1/projects/ovvublomhshliiixyyip/config/auth \
       -H "Authorization: Bearer <token>" \
       -H "Content-Type: application/json" \
       -d '{"site_url":"https://<vercel-url>","uri_allow_list":"https://<vercel-url>/**"}'

5. Update Stripe webhook endpoint from localhost to the Vercel production URL.

Session prompt for this step:
"Write vercel.json with all 4 cron entries as specified in PROMPTS_SUPPLEMENT.md.
 All cron handlers must be written and verify CRON_SECRET before this is deployed."
```

---

## 10 — Schema additions needed in upcoming sessions

These columns/tables don't exist yet. Add them as new migration files
in the sessions that need them (do not edit 0001_initial_schema.sql):

| Session | Migration needed |
|---|---|
| 1C | `email_queue` table: id, to, subject, template, payload jsonb, status text, attempts int, created_at, last_attempted_at |
| 2A | `users.student_type`, `users.target_pathway`, `users.desired_course` text columns |
| 4B | `bookings.reminder_24h_sent` bool, `bookings.reminder_1h_sent` bool |
| 4C | `admin_actions` table: id, admin_id uuid, action text, target_id uuid, note text, created_at; `users.is_suspended` bool; `flagged_profiles` table |
| 5A | No new tables — uses existing soft-delete pattern |

After each migration push, regenerate database.types.ts (see section 3).

---

## 11 — Session 1B precision additions

The SESSION_PROMPTS.md prompt for 1B is correct. Add these specifics:

```
Additional context for Session 1B:

Auth callback URL for Google OAuth (already configured in Supabase):
  https://ovvublomhshliiixyyip.supabase.co/auth/v1/callback

After a Google sign-in, Supabase redirects to:
  /auth/callback?code=...
Create app/auth/callback/route.ts to exchange the code for a session,
then redirect to /role-selection if users.role is null, or to the
appropriate dashboard if role is already set.

The role-selection screen must:
- Be unreachable if the user already has a role (redirect to dashboard)
- Write users.role before any other navigation is allowed
- Show mentor vs mentee as two large cards, not a dropdown

For Resend auth emails: Supabase has a "Custom SMTP" and "Auth Hooks"
option. Use Auth Hooks (Edge Functions) to intercept the
send_email event and relay it through Resend instead. This gives full
control over the email template without disabling Supabase's token flow.
Hook setup: Supabase dashboard → Auth → Hooks → Send Email.
```

---

## 12 — Session 2A precision additions

```
Additional context for Session 2A:

Slug generation rule (not specified in FEATURE_SPEC.md):
  base = display_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  If base is taken: append -2, -3, etc.
  Max length: 50 chars. Do this in a Postgres function called on INSERT.

Photo upload to Supabase Storage:
  Bucket: avatars (public bucket, 5MB max, image/* only)
  Path: {user_id}/avatar.{ext}
  After upload: set mentor_profiles.photo_url = the public URL.
  Crop to square client-side before upload (use browser Canvas API — no library).

The Cal.com embed for Step 3 requires an OAuth flow to get the mentor's
cal_user_id. Until Cal.com OAuth is configured, scaffold the step with a
placeholder "Connect availability" card and a TODO comment. Do not block
the rest of the wizard on this.

Stripe Connect Express onboarding (Step 4) redirect:
  POST /api/stripe/connect-onboarding → create account link → redirect.
  On return (?stripe=return): call stripe.accounts.retrieve(accountId)
  to check charges_enabled + payouts_enabled.
  If not yet enabled: show status card, poll every 10s for 60s max, then
  show a "Verificação pendente" message with a refresh button.
```

---

## 13 — Session 3A precision additions

```
Additional context for Session 3A (read BOOKING_FLOW.md first):

The Cal.com slot picker in the booking flow is NOT the same embed as in
mentor onboarding. In booking, use Cal.com's inline embed pointing at the
mentor's specific event type ID (stored on mentor_profiles.cal_event_type_id).
Install: @calcom/embed-react
Usage:
  import Cal from "@calcom/embed-react";
  <Cal calLink={`${mentor.cal_user_id}/${mentor.cal_event_type_id}`}
       config={{ name: mentee.display_name, email: mentee.email }} />

Draft booking row creation:
  Create the booking row with status='pending_payment' BEFORE redirecting
  to Stripe. This ensures a booking ID exists for the PaymentIntent metadata.
  If payment fails or is abandoned, a cron job (or webhook on
  payment_intent.payment_failed) must clean up draft rows older than 24h.

Stripe webhook idempotency (critical):
  Before processing payment_intent.succeeded:
    SELECT id FROM payments WHERE stripe_payment_intent_id = ?
  If a row exists → return 200 immediately, do nothing.
  This prevents double-confirms if Stripe retries.

The checkout route returns a Stripe Checkout Session URL, not a client secret.
Use stripe.checkout.sessions.create() with mode='payment', the PaymentIntent
data, and success_url pointing to /bookings/{bookingId}/confirmed.
After payment, Stripe redirects to:
  /bookings/{bookingId}/confirmed?session_id={checkoutSessionId}
```
