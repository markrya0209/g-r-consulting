# Feature Spec — All 107 Features by Module

Reference for Claude Code. Each feature includes the tables it touches and key implementation notes.

---

## Auth & Identity (8 features)

**Email + password signup/login** `[users]` — Supabase Auth. Email verification required before first booking or going live.

**Google OAuth** `[users]` — Supabase Auth. University students are already authenticated via Google. Reduces signup friction.

**Role selection at signup** `[users]` — Forced screen post-signup. Assigns 'mentor' | 'mentee' to users.role before any redirect.

**Email verification** `[users]` — Supabase handles verification email. Blocks booking (mentee) and going live (mentor) until verified.

**Password reset** `[users]` — Magic link flow. Supabase handles token generation. Resend handles delivery.

**Session persistence & token refresh** — Supabase JS client handles automatically. No custom token logic needed.

**Account deletion (GDPR)** `[users]` — Soft delete: set deleted_at, null name + email + photo_url. Preserve booking records with anonymised user ref. Cancel future bookings with full refunds.

**Age gate (16+ confirmation)** `[users]` — Checkbox at signup. GDPR Portugal minimum. Store timestamp.

---

## Mentor Onboarding (8 features)

**Step 1 — Identity & profile** `[users, mentor_profiles]` — Full name, display name, profile photo (Supabase Storage, auto-crop square), university (seeded dropdown), faculty, degree, current year (1st–5th+), languages spoken (multi-select). Slug derived from display name with numeric suffix.

**Institutional email verification** `[mentor_profiles]` — Send numeric code to .edu or university-domain address. On confirmation: set mentor_profiles.university_verified = true, show "Estudante Verificado" badge. Not a blocker to go live.

**Step 2 — Session types** `[mentor_profiles, session_types]` — Show all 8 types as selectable cards. For each enabled type: custom description field (max 150 chars), price slider (€20–50, server-side enforced). Price per session type, not a global rate.

**Step 3 — Availability setup** `[mentor_profiles]` — Cal.com embed. Mentor sets recurring weekly availability and connects calendar (Google/Outlook). Store cal_user_id and event_type_id on mentor_profiles.

**Step 4 — Stripe Connect onboarding** `[mentor_profiles, payments]` — Stripe Connect Express redirect. On return: check payouts_enabled via Stripe API. Store stripe_account_id. Hard block: is_live cannot be true until stripe_payouts_enabled = true.

**Saved-progress wizard state** `[mentor_profiles]` — Each step writes to DB on Next button press. Refresh/close tab does not reset. Wizard reads current state on mount and skips completed steps.

**Profile completeness indicator** `[mentor_profiles]` — Progress bar in dashboard. Tracks: photo uploaded, session types set, availability set, Stripe verified. Disappears when all complete.

**'Go live' toggle** `[mentor_profiles]` — Sets mentor_profiles.is_active. Requires all four wizard steps complete AND stripe_payouts_enabled = true. Renders as a prominent toggle on dashboard.

---

## Mentee Onboarding (4 features)

**Name & photo** `[users]` — Full name required. Profile photo optional (Supabase Storage). Single-screen after role selection.

**Student type selection** `[users]` — Single-select: '12th_year' | 'recent_graduate' | 'international' | 'diaspora'. Stored on users.student_type. Used for analytics and review display.

**Target pathway selection** `[users]` — Single-select: 'cna_public' | 'private_admissions' | 'international_equivalency'. Stored on users.target_pathway.

**Desired course / area** `[users]` — Free text, optional. Stored on users.desired_course. Pre-fills "what are you hoping to cover?" field in booking flow.

---

## Mentor Profiles (10 features)

**Public profile page /mentors/[username]** `[mentor_profiles, users, session_types, reviews]` — SSR with ISR (revalidate: 60). Hero: large avatar, display name, verified badge, university + course + year, languages, short bio. Below: session type cards, reviews, availability preview.

**Verified student badge** `[mentor_profiles]` — Shown only when mentor_profiles.university_verified = true. Green badge "Estudante Verificado". Shown on profile page and mentor cards in browse.

**Session type cards with Book CTA** `[session_types]` — One card per active session type. Shows: type name, mentor's custom description, price, duration, "Reservar sessão" button. Button links to booking flow with session_type_id param.

**Star rating + session count display** `[reviews, mentor_profiles]` — Read from mentor_profiles.avg_rating and mentor_profiles.session_count. Never computed at query time. Show as "4.8 ★ · 23 sessões".

**Paginated reviews section** `[reviews]` — 5 per page. Query reviews WHERE mentor_profile_id = ? ORDER BY created_at DESC. Show: star rating, review text, reviewer's student_type label (not full name).

**Next 3 available slots preview** `[mentor_profiles]` — Cal.com API: GET /v1/availabilities for mentor's event type. Show as 3 date+time chips below the fold. On click: jump to booking flow.

**Share profile button** — navigator.clipboard.writeText(window.location.href). Show "Copiado!" feedback for 2s. No external service.

**Report profile link** — Low-prominence text link. On click: INSERT into flagged_profiles (reporter_id, mentor_profile_id, reason). Show "Denúncia enviada" confirmation.

**Mentor profile editing** `[mentor_profiles, session_types]` — Accessible from dashboard quick actions. Edit all fields from Steps 1–2. Add/remove session types. Update pricing. Changes live immediately (ISR revalidation on save).

**'On pause' toggle** `[mentor_profiles]` — Sets mentor_profiles.is_active = false without touching is_suspended. Hides from discovery. Existing confirmed bookings are unaffected. Toggle back to active restores discovery immediately.

---

## Discovery & Browse (8 features)

**Mentor listing page /mentors** `[mentor_profiles, users, session_types, reviews]` — 20 per page. Query: mentor_profiles WHERE is_active = true AND stripe_payouts_enabled = true AND deleted_at IS NULL. Each card: avatar, name, university + course + year, top 2 session types (by booking_count), star rating + session count, price range (MIN–MAX of active session types), "Ver perfil" button.

**Filter: session type** `[session_types]` — Multi-select dropdown. Filter to mentors who have at least one of the selected session types active (EXISTS subquery on session_types).

**Filter: university** `[mentor_profiles]` — Multi-select. Seeded list of PT universities. Exact match on mentor_profiles.university.

**Filter: language** `[mentor_profiles]` — Multi-select. mentor_profiles.languages is an array column. Filter: languages && ARRAY[selected_languages].

**Sort: relevance, newest, price** `[mentor_profiles, reviews]` — Relevance: ORDER BY mentor_profiles.bayesian_score DESC. Newest: ORDER BY mentor_profiles.created_at DESC. Price ascending: ORDER BY MIN(session_types.price_cents) ASC.

**Text search** `[mentor_profiles, users]` — Single input. Query: WHERE mentor_profiles.display_name ILIKE '%q%' OR mentor_profiles.university ILIKE '%q%'. No full-text search at launch.

**URL-serialised filters** — All filter state in URL search params. ?type=cna,tutoring&university=IST&lang=pt&sort=relevance. On mount: read params and set filter state. On filter change: push to router. Enables shareable filtered views.

**Empty state with mentor CTA** — When query returns 0 results: "Nenhum mentor encontrado" + "Limpar filtros" link + "Tornar-me mentor" CTA button.

---

## Booking Flow (8 features)

**Slot selection (Cal.com inline)** `[bookings]` — Cal.com inline embed scoped to mentor's event_type_id. On slot selection: Cal.com returns provisional booking uid. INSERT bookings row with status = 'pending_payment', cal_booking_uid = uid.

**Pre-session context form** `[bookings]` — Two fields: mentee_context (required, 50–500 chars, validated client + server), current_situation (optional, max 1000 chars). UPDATE bookings on submit. This content is forwarded verbatim to mentor in their confirmation email.

**Booking summary with price breakdown** `[bookings, payments]` — Show: mentor avatar + name, session type, date + time (user's timezone), duration. Price: session fee (€X) + platform fee (11% = €Y) = Total (€Z). Cancellation policy shown as collapsible text. "Pagar e confirmar" CTA.

**Stripe Checkout redirect** `[bookings, payments]` — POST to /api/checkout: creates PaymentIntent, UPDATE bookings SET stripe_payment_intent_id = ..., return Stripe Checkout URL. Redirect client.

**Post-payment confirmation page** `[bookings]` — Stripe redirects to /bookings/[id]/confirmed. Show: checkmark, mentor name + avatar, session type, date/time, join link (Daily.co URL). "Adicionar ao calendário" downloads ICS. "O que esperar" tips accordion.

**Daily.co room creation on booking** `[bookings]` — POST to Daily.co API in Stripe webhook handler. Body: { name: booking.id, privacy: 'private', properties: { enable_recording: false } }. Store response.url on bookings.room_url.

**Cal.com booking confirmation on payment** `[bookings]` — In Stripe webhook handler, after DB update: POST to Cal.com /v1/bookings/{uid}/confirm. On failure: log to errors table, continue (do not fail the webhook).

**ICS calendar attachment** `[bookings]` — Generate .ics file server-side with: DTSTART, DTEND, SUMMARY (session type + mentor name), DESCRIPTION (join link + context), LOCATION (Daily.co URL). Attach to confirmation emails via Resend.

---

## Video Sessions (5 features)

**Session room page /sessions/[bookingId]** `[bookings]` — Server component validates: user is authenticated AND (user.id = booking.mentee_id OR user.id = booking.mentor_id). If neither: redirect to /dashboard. Fetch booking + mentor/mentee details + room_url.

**Join button with countdown** `[bookings]` — Calculate: canJoin = now >= scheduled_at - 10 minutes. If canJoin: render active "Entrar na sessão" button linking to room_url. If not: render disabled button with live countdown timer (client-side, updates every second).

**Daily.co prebuilt UI embed** — Render Daily.co's prebuilt iframe: <iframe src={room_url} allow="camera; microphone; fullscreen; speaker; display-capture">. No custom video UI. No recording (enable_recording: false on room creation).

**Session context panel** `[bookings]` — Sidebar/drawer alongside video iframe. Shows: session type name and description, mentee's pre-session context (mentee_context field), current_situation if provided, scheduled duration. Visible to both participants.

**Post-session status transition (cron)** `[bookings]` — /api/cron/complete-sessions runs every 15 minutes. Query: SELECT * FROM bookings WHERE status = 'confirmed' AND scheduled_at + (scheduled_duration_minutes || ' minutes')::interval < NOW(). UPDATE status = 'session_completed', SET session_completed_at = NOW(). Then queue post-session emails.

---

## Reviews & Outcomes (6 features)

**Mentee review form** `[reviews, mentor_profiles]` — Accessible at /sessions/[bookingId]/review, only when bookings.status = 'session_completed'. UI: 5 large tappable stars, textarea (placeholder: "Como foi a tua sessão?", min 20 / max 500 chars), "Recomendarias este mentor?" yes/no toggle. One review per booking enforced by DB constraint.

**Rating aggregate recalculation** `[reviews, mentor_profiles]` — Postgres trigger on reviews (INSERT, UPDATE, DELETE): recalculate AVG(rating) and COUNT(*) for mentor_profile_id. Update mentor_profiles.avg_rating, session_count, bayesian_score = (session_count * avg_rating + 10 * 4.0) / (session_count + 10).

**Review notification to mentor (email)** `[reviews]` — Triggered on review INSERT. Resend email to mentor: star rating displayed as filled stars, review text, reviewer's student type label.

**Mentor outcome report form** `[outcome_reports]` — Accessible at /sessions/[bookingId]/report for the mentor. Topics covered: checklist contextual to session type (e.g. CNA Strategy: nota calculation, prova de ingresso selection, candidatura ordering, phase strategy). Recommended next steps: optional textarea. One report per booking.

**Outcome report emailed to mentee** `[outcome_reports]` — On outcome_report INSERT: send Resend email to mentee. Formatted HTML: mentor name + avatar at top, "Topics covered" section with checked items, "Recommended next steps" if provided, link to book another session.

**Graduation flywheel email** `[users, bookings]` — Monthly Vercel cron. Query: users WHERE role = 'mentee' AND created_at < NOW() - INTERVAL '6 months' AND id NOT IN (SELECT user_id FROM mentor_profiles) AND id IN (SELECT mentee_id FROM bookings WHERE status = 'session_completed'). Send Resend email: "Já passaste por isto — ajuda outros a passar também." with mentor onboarding CTA.

---

## Payments & Payouts (8 features)

**Stripe Connect Express onboarding** `[mentor_profiles]` — Redirect to Stripe-hosted onboarding. On return: call Stripe API to check account.payouts_enabled. Store stripe_account_id, set stripe_payouts_enabled = true/false.

**PaymentIntent with platform fee (11%)** `[payments]` — Server-side: stripe.paymentIntents.create({ amount, currency: 'eur', application_fee_amount: Math.round(amount * 0.11), transfer_data: { destination: mentor.stripe_account_id }, capture_method: 'automatic', metadata: { booking_id, mentor_id, mentee_id } }).

**Payment capture at checkout** `[payments, bookings]` — Stripe webhook: payment_intent.succeeded. Idempotency check: if payments row with stripe_payment_intent_id exists, skip. CREATE payments row. UPDATE bookings.status = 'confirmed'.

**Payout release after session** `[payments]` — Vercel cron at 02:00 UTC. For each payment WHERE status = 'held' AND booking session_completed_at < NOW() - INTERVAL '24 hours': call stripe.transfers.create({ amount: mentor_payout_cents, currency: 'eur', destination: stripe_account_id }). UPDATE payments SET status = 'released', payment_released_at = NOW().

**Mentor cancellation → full refund** `[payments, bookings]` — stripe.refunds.create({ payment_intent: stripe_payment_intent_id, reason: 'requested_by_customer' }). UPDATE bookings.status = 'cancelled_by_mentor'. UPDATE payments.status = 'refunded'. Cancel Cal.com booking.

**Mentee cancellation policy** `[payments, bookings]` — Check: is NOW() < booking.scheduled_at - INTERVAL '24 hours'? Yes: full refund flow. No: no refund, UPDATE status = 'cancelled_late', payment proceeds to payout on normal schedule. Policy shown at booking summary step.

**Mentor earnings page** `[payments, bookings]` — /dashboard/earnings. Three metric cards: Este mês (SUM of released payments this calendar month), Pendente (SUM of held payments for completed sessions), Total (SUM of all released payments). Table: date, mentee pseudonym, session type, gross amount, platform fee, net payout, status.

**Stripe Express dashboard link** — Button on earnings page: generates Stripe Express dashboard login link via stripe.accounts.createLoginLink(stripe_account_id). Opens in new tab. Mentor manages bank account, views tax docs, downloads payouts.

---

## Dashboards (9 features)

**Mentor: next session card** `[bookings]` — Query: SELECT * FROM bookings WHERE mentor_id = auth.uid() AND status = 'confirmed' AND scheduled_at > NOW() ORDER BY scheduled_at ASC LIMIT 1. Show: mentee's student type, session type, formatted date/time, mentee_context snippet (first 100 chars). Join button: active if NOW() >= scheduled_at - 10 min.

**Mentor: earnings widget** `[payments]` — Three cards: Este mês, Pendente, Total. Queries on payments table. Link to /dashboard/earnings. Refreshes on page focus.

**Mentor: upcoming sessions list** `[bookings, users]` — Next 7 days. Columns: session type, date + time, duration, status badge. Mentee name anonymised until 24h before session (show "Mentee" then reveal first name).

**Mentor: recent reviews** `[reviews]` — Last 3 reviews. Show star rating, first 120 chars of text, "ver todos" link to profile's reviews section.

**Mentor: quick actions** — Links: "Editar perfil" (/dashboard/profile), "Gerir disponibilidade" (Cal.com dashboard link), "Ver ganhos" (/dashboard/earnings). Rendered as card grid or sidebar section.

**Mentee: next session card** `[bookings]` — Same structure as mentor card. Shows mentor avatar + name, session type, time, join button with countdown. Query: bookings WHERE mentee_id = auth.uid() AND status = 'confirmed' ORDER BY scheduled_at ASC LIMIT 1.

**Mentee: pending reviews prompt** `[bookings, reviews]` — Query: bookings WHERE mentee_id = auth.uid() AND status = 'session_completed' AND id NOT IN (SELECT booking_id FROM reviews WHERE mentee_id = auth.uid()). For each: show mentor name, session type, date, "Deixar avaliação" button inline.

**Mentee: 'Find a mentor' CTA** — Shown in mentee dashboard when no upcoming confirmed bookings. Card with "Encontrar um mentor" button → /mentors.

**In-app notification feed** — Supabase Realtime SUBSCRIBE to notifications table WHERE user_id = auth.uid(). Last 5 notifications shown in dropdown from nav bell icon. Badge shows unread count. Mark as read on open.

---

## Notifications (13 features)

All emails via Resend using React Email templates extending a shared base template.

**Booking confirmed → mentee** — Trigger: bookings.status = 'confirmed' (Stripe webhook). Content: mentor avatar + name, session type, date/time (mentee's timezone), join link, ICS attachment, 3 pre-session tips.

**New booking → mentor** — Trigger: same as above. Content: mentee's student type, pre-session context (verbatim), current situation (if provided), session type, date/time, link to dashboard.

**24h reminder → both** — Vercel cron every 30 min. Query: bookings WHERE status = 'confirmed' AND scheduled_at BETWEEN NOW() + INTERVAL '23.5 hours' AND NOW() + INTERVAL '24.5 hours'. Send to mentor + mentee. Includes join link.

**1h reminder → both** — Same cron. Query window: 55–65 minutes out. Join link prominent in header.

**Mentor cancellation → mentee** — Trigger: status = 'cancelled_by_mentor'. Content: session details, "refund will appear in 5–10 business days", link to browse mentors with same session type.

**Mentee cancellation → mentor** — Trigger: status = 'cancelled_by_mentee' or 'cancelled_late'. Content: session details, payout info (cancelled_late: "you will still be paid your €X"), availability reminder.

**Review request → mentee** — Trigger: 1h after session_completed_at (queued in cron). Single email, not repeated. Direct link to /sessions/[id]/review.

**Outcome report → mentee** — Trigger: outcome_reports INSERT. Formatted HTML of topics covered + next steps. "Sessão concluída com [Mentor Name]" subject line.

**Payment released → mentor** — Trigger: payments.status = 'released'. Content: net payout amount, session details, cumulative earnings this month. Encourages setting more availability.

**New review received → mentor** — Trigger: reviews INSERT. Content: star display, review text, updated average. Link to profile.

**Realtime: new booking toast (mentor)** — Supabase Realtime on bookings table INSERT WHERE mentor_id = auth.uid(). Show toast: "Nova reserva! [Session type] em [Date]".

**Realtime: session starting in 10 min** — Client-side interval in dashboard. Check: booking.scheduled_at - NOW() <= 10 minutes. Update join button from disabled+countdown to active. Show in-page banner.

**Email preferences settings** `[users]` — JSONB field users.email_preferences: { reminders: true, marketing: true }. Transactional emails (confirmations, cancellations, payment, review) always sent regardless of preferences.

---

## Admin Panel (7 features)

All routes under /admin are gated by middleware: users.role = 'admin'. Use Supabase service role key.

**User list with search** `[users, mentor_profiles]` — Table with search input. Columns: name, email, role, created_at, status (active / suspended / deleted). Click row: user detail panel with account actions.

**Booking list with status filter** `[bookings, users]` — Filter by status. Columns: booking id, mentor name, mentee name, session type, scheduled_at, status, amount. Sortable by date.

**Platform revenue summary** `[payments]` — Cards: total processed (all time), total fees collected (all time), this month processed, this month fees. Bar chart: monthly revenue for last 6 months.

**Manual refund trigger** `[payments, bookings]` — Input: booking ID. Fetch payment details. Show: amount, mentor, mentee. Confirm button → stripe.refunds.create. Log to admin_actions table with admin user_id, timestamp, reason.

**Suspend / unsuspend account** `[users, mentor_profiles]` — Set users.is_suspended = true. Call supabase.auth.admin.signOut(user_id) to invalidate sessions. If mentor: set mentor_profiles.is_active = false. Unsuspend reverses both. Log to admin_actions.

**Review moderation** `[reviews]` — Table of all reviews with flag count. Delete button → DELETE from reviews (service role, bypasses RLS). Deletion triggers Postgres rating recalculation via trigger.

**Reported profiles queue** `[mentor_profiles]` — Table of flagged_profiles WHERE resolved = false. Show: reporter, reported mentor, date. Actions: "Dismiss" (resolved = true) or "Suspend" (triggers #97).

---

## Legal & Compliance (7 features)

**GDPR consent at signup** `[users]` — Checkbox: "Li e aceito os Termos de Serviço e a Política de Privacidade" with links. Required. On submit: store users.terms_accepted_at = NOW(), users.terms_version = '1.0'.

**Cookie consent banner** — Fixed bottom bar on first visit (check localStorage.cookieConsent). "Aceitar" sets all consent. "Rejeitar" sets analytics = false. No Google Analytics, Hotjar, etc. loaded before acceptance. Store in localStorage + cookie for SSR.

**Terms of Service acceptance** `[users]` — Same checkbox as GDPR consent (combined). Store separately: users.tos_accepted_at.

**Data export on request** `[users, bookings, reviews]` — Button in account settings. POST to /api/user/export. Supabase Edge Function: query all user data → JSON. Send via Resend as attachment. Response: "O teu arquivo será enviado para o teu email em breve."

**Right to erasure workflow** `[users]` — Extends account deletion. After soft delete: anonymise all associated bookings (set mentee_display = 'Utilizador eliminado'), anonymise reviews (set reviewer_label = 'Utilizador eliminado'). Keep records for financial/legal obligations.

**Terms of Service page** — Static /terms. Must be legally reviewed before launch. Include: platform description, session types, payment terms, cancellation policy (>24h/≤24h), liability limits, data processing summary.

**Privacy Policy page** — Static /privacidade. Must name all processors: Supabase (EU data residency), Stripe (PCI DSS), Cal.com, Daily.co, Resend. Include: data collected, purposes, retention, user rights (access, portability, erasure), DPA contact.

---

## Marketing Pages (6 features)

All static Next.js pages. No auth required. No DB queries.

**Landing page /** — Hero: "Fala com quem já passou por isto" + subline. CTAs: "Encontrar mentor" + "Tornar-me mentor". Below: 3-step how-it-works strip. 8 session type cards. 3 review quotes (static). Pricing transparency block with fee calculation example.

**How it works /como-funciona** — Step-by-step for both sides in tabs. CNA calendar context. What happens in a session. Post-session outcome report explanation.

**For mentors /para-mentores** — Earnings calculator (interactive: input hours/week → estimated monthly earnings at chosen price). Mentor testimonials. Onboarding CTA.

**For mentees /para-candidatos** — Session type cards with detailed descriptions. "What to expect" section. Price reassurance: "Significativamente abaixo das taxas de consultoria profissional." FAQ accordion.

**FAQ /faq** — Covers: CNA calendar (when to book), cancellation policy, how payment works, what to prepare, video session setup, how mentor verification works, what if I'm not happy.

**Pricing transparency /precos** — Full worked example: €35 session → €3.85 fee → €31.15 to mentor. Why the fee: platform infrastructure, payment processing, support. Comparison to professional consulting rates (€100–200/hr).
