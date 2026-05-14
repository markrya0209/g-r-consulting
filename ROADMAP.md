# Implementation Roadmap

All 111 tasks in the order they should be built for the fastest secure launch.
Tasks marked [BLOCKER] must be completed before dependent tasks can start.
Tasks marked [PARALLEL] can be built at the same time as the task noted.

---

## Phase 1 — Foundation (Weeks 1–2)
Database, auth, legal groundwork. Nothing visible to users yet — everything else depends on this.

| # | Task | Module | Tech | Notes |
|---|------|--------|------|-------|
| 1 | Terms of Service page | Legal | Next.js | Must exist before any signup. Start legal review immediately. [PARALLEL with DB design] |
| 2 | Privacy Policy page | Legal | Next.js | Must cover Supabase, Stripe, Cal.com, Daily.co. [PARALLEL with ToS] |
| 3 | Database schema + RLS policies | Infrastructure | Supabase | All 7 tables with foreign keys and RLS. EVERYTHING depends on this. [BLOCKER] |
| 4 | Postgres trigger: rating aggregates | Infrastructure | Supabase | Updates avg_rating, session_count, bayesian_score on reviews changes. Deploy with schema. |
| 5 | Stripe Connect platform application | Infrastructure | Stripe Connect | Submit paperwork on day 1 — approval takes 2–7 days. [BLOCKER for mentor go-live] [PARALLEL with schema] |
| 6 | Email + password signup/login | Auth | Supabase | First code feature. All other features require authenticated users. [BLOCKER] |
| 7 | Google OAuth | Auth | Supabase | University students already use Google. [PARALLEL with #6] |
| 8 | Role selection at signup | Auth | Next.js | Forced post-signup screen. Assigns mentor/mentee role. [BLOCKER] |
| 9 | Email verification | Auth | Supabase | Gates first booking (mentee) and going live (mentor). [BLOCKER] |
| 10 | Session persistence & token refresh | Auth | Supabase | Verify works across page navigation before building protected routes. [PARALLEL with #6] |
| 11 | GDPR consent at signup | Legal | Next.js | Checkbox + timestamp on users.terms_accepted_at. Present from first signup. [BLOCKER] |
| 12 | Age gate (16+ confirmation) | Auth | Next.js | GDPR Portugal minimum. Checkbox at signup. [PARALLEL — part of signup form] |
| 13 | Terms of Service acceptance | Legal | Next.js | Checkbox at signup. Version + timestamp stored. [PARALLEL — part of signup form] |
| 14 | Cookie consent banner | Legal | Next.js | Accept/reject. No non-essential cookies before consent. Global layout component. |
| 15 | Password reset | Auth | Supabase | Magic link via Supabase. Must work before user onboarding begins. |
| 16 | Resend domain setup + base email template | Infrastructure | Resend | Configure DNS, verify domain, build React Email base template. [BLOCKER for all emails] |

---

## Phase 2 — Supply side (Weeks 3–4)
Mentor onboarding, profiles, and discovery. Get mentors live before demand-side marketing.

| # | Task | Module | Tech | Notes |
|---|------|--------|------|-------|
| 17 | Step 1 — Identity & profile | Mentor Onboarding | Supabase | Name, photo (Supabase Storage), university, faculty, course, year, languages. [BLOCKER] |
| 18 | Saved-progress wizard state | Mentor Onboarding | Supabase | Each step writes to DB immediately. Implement as architecture for all 4 steps. |
| 19 | Step 2 — Session types | Mentor Onboarding | Next.js | 8 predefined types, custom description (150 chars), price (€20–50 enforced). [BLOCKER] |
| 20 | Step 3 — Availability setup | Mentor Onboarding | Cal.com | Cal.com embed. Store cal_user_id and event_type_id on mentor_profiles. [BLOCKER] |
| 21 | Step 4 — Stripe Connect onboarding | Mentor Onboarding | Stripe Connect | Express redirect. Hard block: cannot go live until stripe_payouts_enabled = true. Requires #5 approval. [BLOCKER] |
| 22 | Institutional email verification | Mentor Onboarding | Supabase | Code to .edu domain → Verified Student badge. Not a blocker to go live. [PARALLEL — optional step] |
| 23 | Profile completeness indicator | Mentor Onboarding | Next.js | Progress bar in dashboard until all 4 steps complete. |
| 24 | 'Go live' toggle | Mentor Onboarding | Next.js | Controls discovery visibility. Requires all steps + Stripe verified. [BLOCKER] |
| 25 | Name & photo (mentee) | Mentee Onboarding | Supabase | Full name required, photo optional. [PARALLEL with mentor onboarding] |
| 26 | Student type selection (mentee) | Mentee Onboarding | Next.js | 12th year / recent graduate / international / diaspora. [PARALLEL — part of mentee signup] |
| 27 | Target pathway selection (mentee) | Mentee Onboarding | Next.js | CNA public / private / international. [PARALLEL — part of mentee signup] |
| 28 | Desired course / area (mentee) | Mentee Onboarding | Next.js | Free text, optional. Pre-fills booking context field. [PARALLEL — part of mentee signup] |
| 29 | Public profile page /mentors/[slug] | Profiles | Next.js | Hero, bio, session types, rating, reviews, availability. Most important conversion page. [BLOCKER] |
| 30 | Verified student badge | Profiles | Next.js | Shown when institutional email verified. [PARALLEL — component on profile] |
| 31 | Session type cards with Book CTA | Profiles | Next.js | Each active type with description, price, booking link. Core conversion element. [BLOCKER] |
| 32 | Star rating + session count display | Profiles | Next.js | Reads from mentor_profiles aggregate columns (set by trigger #4). [PARALLEL — component on profile] |
| 33 | Paginated reviews section | Profiles | Supabase | 5 per page, most recent first. Shows star, text, reviewer student type. |
| 34 | Share profile button | Profiles | Next.js | Copies canonical URL to clipboard. Mentors share in WhatsApp groups etc. |
| 35 | Next 3 available slots preview | Profiles | Cal.com | Cal.com API: next available times as chips. Drives urgency. |
| 36 | Mentor listing page /mentors | Discovery | Next.js | 20 per page. Only active mentors with Stripe payouts enabled. [BLOCKER] |
| 37 | Filter: session type | Discovery | Supabase | Multi-select. [PARALLEL — part of #36] |
| 38 | Filter: university | Discovery | Supabase | Multi-select from seeded list. [PARALLEL — part of #36] |
| 39 | Filter: language | Discovery | Supabase | Multi-select. Critical for diaspora segment. [PARALLEL — part of #36] |
| 40 | Sort: relevance, newest, price | Discovery | Supabase | Relevance = Bayesian score from mentor_profiles. [PARALLEL — part of #36] |
| 41 | Text search | Discovery | Supabase | ilike on display_name and university. [PARALLEL — part of #36] |
| 42 | URL-serialised filters | Discovery | Next.js | Filter state in query params. Shareable URLs. [PARALLEL — part of #36] |
| 43 | Empty state with mentor CTA | Discovery | Next.js | Clear filters link + 'Become a mentor' CTA. [PARALLEL — part of #36] |

---

## Phase 3 — Transaction core (Weeks 5–7)
The full mentee experience end-to-end. Every task here is a blocker for the next.

| # | Task | Module | Tech | Notes |
|---|------|--------|------|-------|
| 44 | Slot selection (Cal.com inline) | Booking | Cal.com | Widget scoped to mentor's event_type_id. Returns cal_booking_uid. Creates draft booking row. [BLOCKER] |
| 45 | Pre-session context form | Booking | Next.js | mentee_context required (50–500 chars), current_situation optional. [BLOCKER] |
| 46 | Booking summary with price breakdown | Booking | Next.js | Session fee + 11% + total. Cancellation policy shown here. [BLOCKER] |
| 47 | PaymentIntent with platform fee (11%) | Payments | Stripe Connect | application_fee_amount = 11%. transfer_data.destination = mentor's stripe_account_id. [BLOCKER] |
| 48 | Stripe Checkout redirect | Booking | Stripe Connect | Uses PaymentIntent from #47. [BLOCKER] |
| 49 | Payment capture at checkout | Payments | Stripe Connect | Webhook: payment_intent.succeeded → bookings.status = confirmed. [BLOCKER] |
| 50 | Cal.com booking confirmation on payment | Booking | Cal.com | Confirm provisional booking via Cal.com API in Stripe webhook handler. [BLOCKER] |
| 51 | Daily.co room creation on booking | Booking | Daily.co | Create room on booking confirmation. Store room_url on bookings row. [BLOCKER] |
| 52 | Post-payment confirmation page | Booking | Next.js | Session details, Add to Calendar, what to expect. Never Stripe's hosted page. [BLOCKER] |
| 53 | ICS calendar attachment | Booking | Resend | Generated server-side with Daily.co link. Attached to confirmation email. [PARALLEL — part of #54] |
| 54 | Booking confirmed → mentee (email) | Notifications | Resend | ICS attachment, join link, mentor photo + bio excerpt. [BLOCKER] |
| 55 | New booking → mentor (email) | Notifications | Resend | Mentee's pre-session context, session type, date/time. [BLOCKER] |
| 56 | Mentee cancellation policy | Payments | Next.js | >24h: full refund. ≤24h: no refund. Shown at booking summary. [BLOCKER] |
| 57 | Mentor cancellation → full refund | Payments | Stripe Connect | Stripe Refund API + status update + Cal.com cancellation. [BLOCKER] |
| 58 | Mentor cancellation → mentee (email) | Notifications | Resend | Refund confirmed + rebook CTA. [PARALLEL — triggered by #57] |
| 59 | Mentee cancellation → mentor (email) | Notifications | Resend | Applicable payout info. [PARALLEL — triggered by #56] |
| 60 | Session room page /sessions/[bookingId] | Sessions | Daily.co | Auth-protected. Only mentor + mentee on that booking. [BLOCKER] |
| 61 | Join button with countdown | Sessions | Next.js | Disabled until T-10 minutes. [BLOCKER] |
| 62 | Daily.co prebuilt UI embed | Sessions | Daily.co | No custom video UI at launch. [BLOCKER] |
| 63 | Session context panel | Sessions | Next.js | Sidebar: session type, mentee context, duration. [PARALLEL — part of session room] |
| 64 | Post-session status transition (cron) | Sessions | Vercel Cron | Every 15 min: transition to session_completed at scheduled end time. [BLOCKER] |
| 65 | Mentee review form | Post-session | Next.js | 1–5 stars, review text (20–500 chars), recommend toggle. One per booking. [BLOCKER] |
| 66 | Rating aggregate recalculation | Post-session | Supabase | Verify Postgres trigger (#4) fires correctly on real review inserts. [PARALLEL — verification] |
| 67 | Mentor outcome report form | Post-session | Next.js | Topics checklist + next steps free text. [BLOCKER] |
| 68 | Outcome report emailed to mentee | Post-session | Resend | Formatted HTML of mentor notes. Core tangible deliverable. [BLOCKER] |
| 69 | Review request → mentee (email) | Notifications | Resend | 1h after session end. Direct link to review page. [PARALLEL — triggered by #64] |
| 70 | Review notification to mentor (email) | Post-session | Resend | Sent on review submission. Star rating + text. [PARALLEL — triggered by #65] |
| 71 | Payout release after session (cron) | Payments | Vercel Cron | Daily at 02:00 UTC. 24h after session_completed. [BLOCKER] |
| 72 | Payment released → mentor (email) | Notifications | Resend | Payout confirmed. [PARALLEL — triggered by #71] |

---

## Phase 4 — Retention & ops (Weeks 8–9)
Make the product sticky and operable before launch.

| # | Task | Module | Tech | Notes |
|---|------|--------|------|-------|
| 73 | Mentor: next session card | Dashboards | Next.js | Type, time, context snippet, join button. Primary daily-use surface. [BLOCKER] |
| 74 | Mentor: earnings widget | Dashboards | Next.js | This month / pending / total. [PARALLEL — part of mentor dashboard] |
| 75 | Mentor: upcoming sessions list | Dashboards | Supabase | Next 7 days. [PARALLEL — part of mentor dashboard] |
| 76 | Mentor: recent reviews | Dashboards | Supabase | Last 3 reviews inline. [PARALLEL — part of mentor dashboard] |
| 77 | Mentor: quick actions | Dashboards | Next.js | Edit profile, Manage availability, View earnings. [PARALLEL — part of mentor dashboard] |
| 78 | Mentor earnings page | Payments | Next.js | Lifetime / pending / this month + session-by-session table. [BLOCKER] |
| 79 | Stripe Express dashboard link | Payments | Stripe Connect | Deep link for bank account + tax docs. Don't rebuild — just link. [PARALLEL — on earnings page] |
| 80 | Mentee: next session card | Dashboards | Next.js | Mentor name, type, time, join button. [PARALLEL with mentor dashboard] |
| 81 | Mentee: pending reviews prompt | Dashboards | Next.js | Inline prompt on unreviewed past sessions. [PARALLEL — part of mentee dashboard] |
| 82 | Mentee: 'Find a mentor' CTA | Dashboards | Next.js | Empty state re-engagement. [PARALLEL — part of mentee dashboard] |
| 83 | 24h reminder → both (email) | Notifications | Resend | Vercel cron. Includes direct join link. |
| 84 | 1h reminder → both (email) | Notifications | Resend | Vercel cron. Join link prominent. |
| 85 | Realtime: new booking toast (mentor) | Notifications | Supabase | Supabase Realtime subscription on bookings table. |
| 86 | Realtime: session starting in 10 min | Notifications | Supabase | Client-side timer from booking time. Updates join button state. [PARALLEL — part of dashboard cards] |
| 87 | In-app notification feed | Dashboards | Supabase | Last 5 notifications. Badge count on nav icon. |
| 88 | New review received → mentor (in-app) | Notifications | Resend | Push to notification feed on review submit. |
| 89 | Email preferences settings | Notifications | Next.js | Toggle reminders/non-critical. Transactional always on. JSONB on users. [PARALLEL — part of settings] |
| 90 | Mentor profile editing | Profiles | Next.js | Edit all fields, session types, pricing. Immediate effect. [BLOCKER] |
| 91 | 'On pause' toggle | Profiles | Next.js | Removes from discovery. Existing bookings unaffected. [PARALLEL — part of profile editing] |
| 92 | Report profile link | Profiles | Supabase | Creates flagged row. Surfaces in admin queue. |
| 93 | User list with search (admin) | Admin | Next.js | Search by name/email, filter by role + status. Role-gated. [BLOCKER] |
| 94 | Booking list with status filter (admin) | Admin | Supabase | Filter + sort. Shows both parties. [PARALLEL — part of admin] |
| 95 | Platform revenue summary (admin) | Admin | Next.js | Fees this month + all time. Simple chart. [PARALLEL — part of admin] |
| 96 | Manual refund trigger (admin) | Admin | Stripe Connect | Stripe Refund API. Logs action with admin user_id. [BLOCKER] |
| 97 | Suspend / unsuspend account (admin) | Admin | Supabase | Sets is_suspended. Invalidates sessions. Hides from discovery. [BLOCKER] |
| 98 | Review moderation (admin) | Admin | Supabase | Delete violations. Triggers rating recalc. [PARALLEL — part of admin] |
| 99 | Reported profiles queue (admin) | Admin | Next.js | Flagged profiles. Dismiss or take action. Requires #92. [PARALLEL — part of admin] |

---

## Phase 5 — Launch readiness (Week 10)
Final compliance, marketing pages, and the graduation loop.

| # | Task | Module | Tech | Notes |
|---|------|--------|------|-------|
| 100 | Account settings page | Settings | Next.js | Update name, photo, email (re-verify), password, notif prefs. [BLOCKER] |
| 101 | Account deletion (GDPR) | Auth | Supabase | Soft delete + PII null + cancel future bookings with refunds. Confirmation modal. [BLOCKER] |
| 102 | Data export on request | Legal | Supabase | Edge Function → JSON → Resend. GDPR Article 20. |
| 103 | Right to erasure workflow | Legal | Supabase | Full erasure extending #101 with anonymised booking refs. [PARALLEL — extends #101] |
| 104 | Landing page / | Marketing | Next.js | Hero, how it works, session types, social proof, dual CTAs. [BLOCKER] |
| 105 | How it works /como-funciona | Marketing | Next.js | Both sides. CNA-specific use cases named. [PARALLEL with landing] |
| 106 | For mentors /para-mentores | Marketing | Next.js | Earnings calculator, testimonials, onboarding CTA. [PARALLEL with landing] |
| 107 | For mentees /para-candidatos | Marketing | Next.js | Session type explainers, price reassurance. [PARALLEL with landing] |
| 108 | FAQ /faq | Marketing | Next.js | CNA calendar, cancellation, payment, video, verification. [PARALLEL with landing] |
| 109 | Pricing transparency /precos | Marketing | Next.js | 11% fee with examples. [PARALLEL with landing] |
| 110 | Graduation flywheel email | Post-session | Resend | Monthly cron: 6–12m after mentee session → invite to become mentor. Last feature, longest-delayed trigger. |
| 111 | Stripe Connect end-to-end verification | Payments | Stripe Connect | Full flow test with real bank account before launch. [BLOCKER] |
