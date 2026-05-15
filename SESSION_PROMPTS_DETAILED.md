# Detailed Session Prompts

Copy the prompt for your target session and paste it into Claude Code.
Each prompt is self-contained: it includes what was built before, what to build, and what docs to load.

---

## Session 1B: Auth flows

```
Read CLAUDE.md and DECISIONS.md before starting.

CURRENT STATE:
- Phase 1A complete: Next.js 15, Supabase schema deployed (8 tables, RLS on all),
  lib/supabase/{client,server,middleware,database.types}.ts exist,
  middleware.ts handles session refresh + admin role guard.
- Supabase Auth: email+password and Google OAuth are *enabled in the dashboard*
  but have no real Google credentials yet (will use placeholder).
- .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY are filled in. Stripe/Cal.com/Daily.co/Resend
  are placeholder.
- Do not re-scaffold, re-migrate, or touch lib/supabase.

Tasks #6–15: Build the complete auth system.

BUILD IN THIS ORDER:

1. Email + password signup + role selection:
   Create app/(auth)/signup/page.tsx. Form fields: email, password, confirm
   password, full name. Below: checkboxes for age gate (16+), GDPR consent,
   ToS acceptance (store timestamps on users: age_confirmed, gdpr_consent_at,
   terms_accepted_at). Submit → Supabase Auth signup → on success, redirect to
   /role-selection.

2. Role selection screen:
   Create app/(auth)/role-selection/page.tsx. Show two large cards: "Sou Mentor"
   and "Sou Mentee". On click: PATCH users.role ('mentor' | 'mentee'),
   then redirect to /email-verification.
   Guard: if user already has a role, redirect to appropriate dashboard.

3. Email verification gate:
   Create app/(auth)/email-verification/page.tsx. Show "Verifica o teu email"
   with resend button. Middleware (already in middleware.ts, update it):
   /dashboard/* and /(mentor)/* and /(mentee)/* require email_verified = true.
   If not verified, redirect to /email-verification.

4. Google OAuth:
   Same flow as email+password but via supabase.auth.signInWithOAuth({provider:'google'}).
   Redirect to /role-selection after Google returns.
   Create app/auth/callback/route.ts: exchange code for session, then navigate
   to /role-selection if users.role is null, or to the appropriate dashboard
   if role already set.

5. Password reset (magic link via Resend):
   Create app/(auth)/reset/page.tsx: email input → POST /api/auth/reset-password.
   That route: supabase.auth.resetPasswordForEmail(email) → Supabase generates
   the token → grab the reset link from Supabase and send via Resend instead
   of Supabase's default email.
   Create the reset password confirmation page at app/(auth)/reset-confirm/page.tsx.
   Receives token in URL, form for new password → supabase.auth.updateUser({password}).

6. Resend auth email templates:
   Create components/email/VerificationEmail.tsx and ResetPasswordEmail.tsx
   using React Email. Base template: @react-email/components.
   Both should include: G&R Consulting branding, action button (verify / reset),
   fallback link, expiry info.

7. Supabase Auth Hooks (critical):
   In Supabase dashboard → Auth → Hooks → Send Email:
   Create an Edge Function that intercepts send_email events and relays them
   through Resend instead of Supabase's built-in mailer.
   Function should determine template (verification vs password reset) and call
   lib/resend/send.ts with the appropriate React Email template.
   This ensures all auth emails go through Resend (consistent branding).

TESTING CHECKLIST:
- Sign up with email, verify email arrives via Resend, click link, redirects to
  /email-verification.
- Complete email verification, redirects to /role-selection.
- Select role → redirects to appropriate dashboard (placeholder for now).
- Sign up with Google OAuth → same flow (role selection → dashboard).
- Try accessing /dashboard without auth → redirects to /login.
- Try accessing /dashboard with auth but unverified email → redirects to
  /email-verification.
- Password reset flow: request → email arrives → reset → login works.

After completing all steps, git add, commit with message referencing tasks #6–15,
and push. Do NOT write the legal pages yet (that's Session 1C).
```

---

## Session 1C: Legal pages + email infrastructure

```
Read CLAUDE.md and FEATURE_SPEC.md (Legal section) before starting.

CURRENT STATE:
- Session 1B complete: email+password, Google OAuth, role selection, email
  verification, password reset, Resend email templates all working.
- Auth emails flow through Resend via Supabase Auth Hooks.
- lib/resend/send.ts exists with base sendEmail() function.
- Do not modify auth flows.

Tasks #1–2, #16: Legal pages and cookie consent.

BUILD IN THIS ORDER:

1. Terms of Service page:
   Create app/terms/page.tsx. Static Next.js page (no DB queries, no auth required).
   Portuguese content. Must include:
   - User responsibilities (mentors: timely cancellation, professionalism;
     mentees: preparation, respect)
   - Payment terms (11% fee, non-refundable if mentee cancels ≤24h)
   - Cancellation policy (mentor: full refund; mentee >24h: full; ≤24h: none)
   - Liability disclaimer (Daily.co technical issues, etc.)
   - Data processing (name, email used for platform operation)
   - IP and content (mentors own their content, G&R has right to display)
   At top: <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
   DRAFT — PENDING LEGAL REVIEW. Do not use in production.
   </div>
   Link from signup page: "Aceito os Termos de Serviço" checkbox with href to /terms.

2. Privacy Policy page:
   Create app/privacidade/page.tsx. Portuguese. Must include:
   - Data controller: G&R Consulting
   - Data processors: Supabase (auth, storage), Stripe (payments), Cal.com
     (scheduling), Daily.co (video), Resend (email)
   - Data retention: users soft-deleted (PII nulled) on account deletion
   - Rights: export (GDPR Article 20), erasure (Article 17)
   - Contact: privacy@grmentoria.pt (placeholder)
   - Cookies: see cookie banner below
   Same DRAFT banner as /terms.
   Link from signup: "Política de Privacidade" with href to /privacidade.

3. Cookie consent banner:
   Create components/CookieConsent.tsx (client component). Sticky footer banner:
   "Usamos cookies para melhorar a experiência." [Aceitar] [Rejeitar] buttons.
   On Aceitar: localStorage.setItem('cookieConsent', 'accepted') + set cookie for SSR.
   On Rejeitar: localStorage.setItem('cookieConsent', 'rejected').
   At app layout level: conditionally load analytics (Vercel Analytics or similar)
   only if cookieConsent === 'accepted'. Do NOT load any tracking before consent.
   Banner shows on every page until dismissed; after consent is set, show for
   30 days then prompt again.

4. Email queue table (migration):
   Create supabase/migrations/0002_email_queue.sql:
   ```sql
   CREATE TABLE email_queue (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     to TEXT NOT NULL,
     subject TEXT NOT NULL,
     template TEXT NOT NULL,
     payload JSONB NOT NULL DEFAULT '{}',
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
     attempts INTEGER NOT NULL DEFAULT 0,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     last_attempted_at TIMESTAMPTZ
   );
   ```
   Push this migration:
   git add supabase/migrations/0002_email_queue.sql
   git commit -m "feat: add email_queue table (session 1C)"
   git push
   Wait for Supabase to confirm it applied.

5. Resend helper enhancements:
   Update lib/resend/send.ts:
   - Add FROM constant: const FROM = "noreply@resend.dev" (for dev; will change
     when domain is verified).
   - Add sendEmailWithFallback(): if Resend fails, INSERT into email_queue
     with status='failed'. Log the error. Do NOT throw — emails must not block
     critical flows.
   - Add queue retry logic (stub for Session 4B): function to query email_queue
     WHERE status='failed' AND attempts < 3, retry via Resend, update status.

6. React Email base template:
   Create components/email/BaseLayout.tsx:
   ```tsx
   interface Props {
     subject: string;
     preheader?: string;
     children: React.ReactNode;
   }
   export default function BaseLayout({ subject, preheader, children }: Props) {
     return (
       <Html lang="pt">
         <Head>
           <title>{subject}</title>
           <Preview>{preheader}</Preview>
         </Head>
         <Body style={{ fontFamily: 'Geist, sans-serif', backgroundColor: '#FBF9F5' }}>
           <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
             <Heading as="h1">G&R Consulting</Heading>
             {children}
           </Container>
         </Body>
       </Html>
     );
   }
   ```
   Use in all email templates (verification, reset, etc.).

TESTING CHECKLIST:
- Visit /terms and /privacidade, see DRAFT banners.
- Signup page has checkboxes linking to both pages.
- Cookie banner appears at bottom. Click Rejeitar → localStorage set, banner
  persists on refresh (30 days).
- Do NOT load analytics script on page with cookieConsent='rejected'. Verify
  in browser DevTools Network tab.
- Send a test email via lib/resend/send.ts → should arrive with base template
  styling.
- Intentionally fail email (bad API key) → check email_queue table has the row
  with status='failed'.

After all complete, push and confirm migration applied to Supabase.
Do NOT build signup form styling yet (that's Phase 2+).
```

---

## Session 2A: Mentor onboarding wizard

```
Read CLAUDE.md and FEATURE_SPEC.md (Mentor Onboarding section) before starting.

CURRENT STATE:
- Sessions 1B, 1C complete: auth flows and legal pages live.
- lib/supabase, lib/stripe, lib/calcom, lib/daily, lib/resend are stubbed.
- .env.local: Supabase keys filled; Stripe, Cal.com, Daily.co, Resend keys
  are placeholder (will fill before integration).
- Do not modify auth or legal pages.

IMPORTANT PREREQUISITES (do these before starting this session):
- Read sections 5, 6, 7, 8 of PROMPTS_SUPPLEMENT.md for setup steps.
- Stripe Connect platform application: submit via dashboard (approval 2–7 days).
  While waiting: enable Test mode Express accounts.
- Cal.com: create organisation, create default 60-min event type "Sessão de
  mentoria CNA". Add CALCOM_API_KEY to .env.local.
- Resend: create account, add RESEND_API_KEY to .env.local.
- Daily.co: create account, add DAILY_API_KEY to .env.local.
- If any service is not ready, stub that step with TODO comments and move on.

Tasks #17–24: Build the 4-step mentor onboarding wizard at /onboarding/mentor.

BUILD IN THIS ORDER:

1. Wizard shell + progress indicator:
   Create app/(mentor)/onboarding/page.tsx with useState for currentStep (1–4).
   Progress bar: 4 equal segments, filled up to currentStep.
   Back/Next buttons at bottom. Persist currentStep to localStorage for
   tab-close recovery. On mount: read localStorage to resume from last step.

2. Step 1 — Identity & profile:
   Form: full name, display name, profile photo (file input), university
   (select dropdown: IST, FCUL, Nova FCM, UC Coimbra, UMinho, UP), faculty,
   degree name, current year (1–5), languages (multi-select checkboxes).
   On Next: validate all required fields, upload photo to Supabase Storage
   (bucket: avatars, path: {user_id}/avatar.{ext}, crop to square client-side
   using Canvas API). On success: INSERT into mentor_profiles with these values,
   set onboarding_step = 2, save to localStorage. Show "Perfil atualizado!"
   toast.

3. Step 2 — Session types:
   Show 8 type cards (hardcoded from FEATURE_SPEC.md: cna, provas, ordem, curso,
   equiv, tutor, vida, intl). Each card: type name, short description, toggle
   switch. When toggled on: reveal description input (max 150 chars, counter),
   price slider (€20–50, formatted as currency). On Next: validate enabled types
   have descriptions, INSERT into session_types for each enabled type, set
   onboarding_step = 3. No server-side validation yet (Cal.com stubs the form).

4. Step 3 — Availability setup (Cal.com):
   Until Cal.com OAuth is configured: show placeholder card "Conecta a tua
   disponibilidade" with a TODO comment explaining this step.
   Once Cal.com OAuth is ready: use @calcom/atoms (install: npm install @calcom/atoms)
   to embed the availability scheduler inline. On successful calendar connection:
   receive cal_user_id and event_type_id from Cal.com → update mentor_profiles,
   set onboarding_step = 4.

5. Step 4 — Stripe Connect onboarding:
   Create /api/stripe/connect-onboarding route:
   POST request → call stripe.accountLinks.create({ account: stripeAccountId,
   type: 'account_onboarding', refresh_url: ..., return_url: ... }).
   Return the redirect URL. On the page: button "Vá para Stripe" → opens the
   link in a modal or new window.
   On return (?stripe=return): call stripe.accounts.retrieve(accountId).
   Check charges_enabled and payouts_enabled. If not yet approved, show status
   card: "A sua conta Stripe está sob verificação. Pode levar 1–2 dias."
   with a refresh button that polls every 10s for 60s max. If approved:
   set stripe_payouts_enabled = true, onboarding_step = 4 (already complete).

6. Confirmation screen:
   After Step 4 succeeds: show "Parabéns! Perfil de mentor criado com sucesso!"
   with two buttons: "Ver meu perfil" (→ /mentors/[slug]) and "Ir para o painel"
   (→ /(mentor)/dashboard). Also: "Go live toggle" (disabled until all 4 steps
   complete AND Stripe is verified). When user clicks toggle: set is_active = true,
   show "Seu perfil está agora visível para candidatos!" toast.

7. Database functions:
   Add a Postgres function to auto-generate slug on mentor_profiles INSERT:
   ```sql
   CREATE OR REPLACE FUNCTION generate_mentor_slug()
   RETURNS TRIGGER AS $$
   DECLARE
     base_slug TEXT;
     final_slug TEXT;
     counter INTEGER := 0;
   BEGIN
     base_slug := LOWER(REGEXP_REPLACE(NEW.display_name, '[^a-z0-9]', '-', 'g'));
     final_slug := base_slug;
     WHILE EXISTS (SELECT 1 FROM mentor_profiles WHERE slug = final_slug) LOOP
       counter := counter + 1;
       final_slug := base_slug || '-' || counter;
     END LOOP;
     NEW.slug := final_slug;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   CREATE TRIGGER trg_generate_mentor_slug
   BEFORE INSERT ON mentor_profiles FOR EACH ROW
   EXECUTE FUNCTION generate_mentor_slug();
   ```
   Push as a new migration (0003_mentor_slug_function.sql).

8. Profile completeness indicator (dashboard stub):
   In /(mentor)/dashboard (stub for now): show progress bar tracking:
   - Photo uploaded: yes/no
   - Session types enabled: yes/no
   - Calendar connected: yes/no (N/A until Cal.com is ready)
   - Stripe verified: yes/no
   This bar will be fully wired in Session 4A.

TESTING CHECKLIST:
- Step 1: upload a photo, verify it appears in Supabase Storage, localStorage
  persists on browser close/refresh, can resume from Step 2.
- Step 2: toggle types on/off, enable 2 types with prices, verify
  session_types rows created.
- Step 3: see the TODO placeholder (Cal.com pending).
- Step 4: see the Stripe placeholder or full form if STRIPE_SECRET_KEY is set.
- If Stripe is not ready: stub the form with TODO, show "Verificação Stripe
  pendente" message.
- Confirmation screen: verify "Go live" toggle is disabled until all steps pass.
- Slug generation: verify unique slugs (e.g., ana-silva, ana-silva-2).

After all steps complete, commit (tasks #17–24) and push.
Do NOT build the public profile page yet (that's Session 2B).
```

---

## Session 2B: Mentor profiles + discovery

```
Read CLAUDE.md and FEATURE_SPEC.md (Profiles, Discovery, Mentee Onboarding)
before starting.

CURRENT STATE:
- Session 2A complete: 4-step mentor wizard deployed, mentors have profiles
  with photos, session types, and (stubbed or live) calendar/Stripe.
- mentor_profiles table populated with test mentors from dev seed.
- Slugs auto-generated.
- Do not modify onboarding.

Tasks #25–43: Public mentor profiles, mentor discovery, mentee onboarding.

BUILD IN THIS ORDER:

1. Public mentor profile page /mentors/[slug]:
   Create app/mentors/[slug]/page.tsx with generateStaticParams() and
   generateMetadata() for SEO. SSR with ISR (revalidate: 60).
   Fetch mentor profile + user + session types + reviews by slug.
   Layout (from FEATURE_SPEC.md):
   - Hero: large avatar (200px), display name, verified badge (if
     university_verified = true), university + course + year + languages,
     bio (max 300 chars).
   - Below: 4 session type cards (name, description, price, "Reservar sessão"
     button → /mentors/[slug]/book?session_type_id=X).
   - Reviews section: paginate 5 per page, show rating + text + reviewer type.
   - Next 3 available slots: fetch from Cal.com API server-side, display as
     date+time chips. On click: jump to booking flow.
   - Share button: copy URL to clipboard, show "Copiado!" feedback 2s.
   - Report link: form submission → INSERT into flagged_profiles, show
     "Denúncia enviada" toast.

2. Mentor listing page /mentors:
   Create app/mentors/page.tsx. Query mentor_profiles WHERE is_active = true
   AND stripe_payouts_enabled = true AND deleted_at IS NULL, JOIN with
   users and session_types.
   Layout:
   - 20 mentors per page, grid layout.
   - Each card: avatar, name, university, languages, avg_rating ★ + count,
     session type badges (multi-select filter above), price range.
   - Filters (URL params, serialised state):
     * Session type (multi-select): cna, provas, ordem, etc.
     * University (multi-select): IST, FCUL, etc.
     * Language (multi-select): pt, en, es, fr.
   - Sort (single-select dropdown):
     * Relevance (bayesian_score DESC)
     * Newest (created_at DESC)
     * Price (price_cents ASC)
   - Text search: ilike on users.display_name and mentor_profiles.university.
   - Empty state: "Nenhum mentor encontrado. Limpe os filtros." + "Torne-se
     mentor" CTA button.

3. Mentee onboarding:
   Create app/(mentee)/onboarding/page.tsx (single screen, no wizard steps).
   Form: full name (required), profile photo (optional, same upload as mentor),
   student type (single-select: 12th_year, recent_graduate, international,
   diaspora), target pathway (single-select: cna_public, private_admissions,
   international_equivalency), desired course (free text, optional).
   On submit: INSERT/UPDATE users with these fields, redirect to
   /(mentee)/dashboard (stub for now).
   Add schema columns: users.student_type, users.target_pathway,
   users.desired_course (new migration 0004_mentee_fields.sql).

4. Verified student badge:
   On /mentors/[slug] and in mentor cards: show green badge "Estudante
   Verificado" only if mentor_profiles.university_verified = true.
   This will be wired in Session 2A (institutional email verification is
   optional at launch, so leave as a TODO).

5. Reviews pagination:
   In /mentors/[slug]: paginate reviews 5 per page. Query:
   SELECT * FROM reviews WHERE mentor_profile_id = ? ORDER BY created_at DESC
   LIMIT 5 OFFSET ?.
   Show: ★★★★★ (rating), review text (max 500 chars), reviewer_type label
   (e.g., "Aluno 12º ano" not full name).

TESTING CHECKLIST:
- /mentors: shows 20 mentors, filters work (URL params update), sort options
  change order.
- Text search: search "IST" → filters to IST mentors.
- Click on a mentor card → lands on /mentors/[slug].
- /mentors/[slug]: avatar, name, bio, all session types, next 3 slots from
  Cal.com (if Cal.com is live; else placeholder), share button works.
- Mentee onboarding: form submits, user gets student_type + target_pathway.

After all complete, push and confirm migrations (0003, 0004) applied.
Commit tasks #25–43.
Do NOT build the booking flow yet (that's Session 3A).
```

---

## Session 3A: Booking flow + payments

```
Read CLAUDE.md, DECISIONS.md, and BOOKING_FLOW.md before starting.

CURRENT STATE:
- Sessions 2A, 2B complete: mentors live with profiles, discovery is browsable,
  mentee onboarding exists.
- lib/stripe stubs exist: connect.ts, payment-intent.ts, webhook.ts.
- .env.local: STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must
  be set (get from Stripe dashboard test mode).
- STRIPE_WEBHOOK_SECRET will be set after webhook endpoint is deployed.

CRITICAL PREREQUISITE:
- Stripe Connect platform application must be submitted (done before Session 2A).
  Test mode must have Express accounts enabled.
- If not done: STOP, submit platform application first.

Tasks #44–55: Booking flow (3 steps + confirmation) + payments + confirmation emails.

BUILD IN THIS ORDER:

1. Booking flow shell:
   Create app/mentors/[slug]/book/page.tsx. Route params: ?session_type_id=X.
   State: step (1–3), slot (Cal.com UID), menteeContext, currentSituation.
   Progress indicator: 3 steps: Data/hora, Contexto, Pagamento, Confirmação.
   Back button on Step 2–3, back to /mentors/[slug] from Step 1.

2. Step 1 — Slot selection (Cal.com):
   Embed Cal.com inline slot picker using @calcom/embed-react (install if not
   already done). Config: event_type_id from mentor_profiles.cal_event_type_id,
   mentee email + name from auth.
   On booking: receive cal_booking_uid, CREATE draft bookings row:
   INSERT INTO bookings (mentee_id, mentor_id, mentor_profile_id,
   session_type_id, cal_booking_uid, status, scheduled_at, price_cents, ...)
   VALUES (..., 'pending_payment', scheduled_at_from_cal_booking_uid, ...).
   Return booking.id. Show "Slot reservado!" toast, proceed to Step 2.

3. Step 2 — Pre-session context:
   Form: menteeContext textarea (required, 50–500 chars), currentSituation
   textarea (optional). UPDATE the bookings row with these values.
   Show form submission feedback (loading state).

4. Step 3 — Summary + payment:
   Card: session type, mentor name, date/time, duration, mentee context,
   price breakdown (session fee + 11% platform fee = total).
   Cancellation policy: "Se cancelar até 24h: reembolso integral. Até 24h:
   sem reembolso."
   Button: "Proceder ao pagamento" → POST /api/checkout.

5. /api/checkout route:
   Input: bookingId, email, returnUrl.
   Implement createPaymentIntent() from lib/stripe/payment-intent.ts:
   - Compute fees (11% of session price).
   - Call stripe.paymentIntents.create({ amount: totalCents,
     application_fee_amount: feeCents, transfer_data: {destination:
     mentor.stripe_account_id}, metadata: {bookingId} }).
   - Create Stripe Checkout Session with mode='payment', intent={paymentIntentId}.
   - Return the session.url.
   - Redirect user to Stripe Checkout.

6. Stripe webhook handler /api/webhooks/stripe:
   Verify stripe-signature header FIRST using lib/stripe/webhook.ts.
   On payment_intent.succeeded event:
   - Check for idempotency: SELECT id FROM payments WHERE
     stripe_payment_intent_id = intent.id. If exists, return 200 (already
     processed).
   - Otherwise: INSERT into payments table (booking_id, stripe_payment_intent_id,
     amount_total_cents, amount_fee_cents, amount_mentor_cents, status='succeeded').
   - UPDATE bookings SET status = 'confirmed'.
   - Call confirmBooking() from lib/calcom/booking.ts to confirm the Cal.com
     booking (change from provisional to confirmed).
   - Call createRoom() from lib/daily/room.ts with booking.scheduled_at →
     get room_url, UPDATE bookings SET daily_room_url = room_url.
   - Send two confirmation emails via Resend (see step 7).
   - Catch all errors: log to email_queue with status='failed', return 200
     (webhook must not fail — errors logged internally).

7. Confirmation emails (React Email templates):
   Create components/email/BookingConfirmedMentee.tsx:
   - To: mentee email
   - Subject: "Sessão confirmada com {mentor.display_name}"
   - Body: session type, mentor name, date/time, Zoom room link
     (booking.daily_room_url), mentee context summary, "Entra na sessão"
     button (→ booking.daily_room_url, disabled until T-10 min).
   - Attachment: ICS calendar file (generated server-side with room URL in
     description).

   Create components/email/BookingConfirmedMentor.tsx:
   - To: mentor email
   - Subject: "Nova sessão: {mentee.display_name} em {date}"
   - Body: mentee name (hidden until T-24h), mentee student_type, mentee
     desired_course (from profile), mentee_context summary, session type,
     date/time, "Entra na sessão" button.

   Generate ICS server-side:
   Create lib/ics/generate.ts:
   - Function: generateICS({ title, startTime, endTime, location, description })
   - Return .ics file content as string.
   - Attach to email via Resend's attachment field.

8. Confirmation page /bookings/[id]/confirmed:
   Route params: ?payment_intent=X (from Stripe redirect).
   Page: "Sessão reservada com sucesso!"
   Card showing:
   - Session type, mentor, date/time, room link.
   - "A sessão inicia em X dias. Abre 10 minutos antes."
   - Button: "Ir para o painel" (→ /(mentee)/dashboard).

TESTING CHECKLIST (MUST USE TEST STRIPE ACCOUNT):
- /mentors/[slug]/book?session_type_id=cna → Cal.com slot picker shows.
- Select a slot → draft booking created, proceed to Step 2.
- Step 2 form → Step 3 summary.
- Click "Proceder ao pagamento" → redirects to Stripe Checkout (test mode).
- Use test card 4242 4242 4242 4242, any expiry/CVC → payment succeeds.
- Webhook fires: check bookings.status = 'confirmed', payments row created.
- Check Resend dashboard: two confirmation emails arrived (mentee + mentor).
- ICS attachment in email: can import to calendar.
- Redirect to /bookings/[id]/confirmed → shows success page.

After all complete, commit (tasks #44–55) and push.
STRIPE_WEBHOOK_SECRET will be set in .env.local once webhook endpoint is live
in production (Session 5C).
Do NOT build cancellations yet (that's Session 3B).
```

---

## Session 3B: Cancellations + video room

```
Read CLAUDE.md and BOOKING_FLOW.md (Cancellation flows section) before starting.

CURRENT STATE:
- Session 3A complete: bookings flow, Stripe webhook, confirmation emails all live.
- bookings table populated with confirmed bookings.
- Stripe webhook endpoint (/api/webhooks/stripe) is deployed.
- Do not modify auth, onboarding, discovery, or booking creation.

Tasks #56–63: Cancellation flows (mentor/mentee, refunds) + Daily.co video room.

BUILD IN THIS ORDER:

1. Cancellation flows:
   Both accessible from dashboards (stub for Session 4A, but build the flows now).

   Mentor cancellation:
   Create POST /api/bookings/[id]/cancel-mentor route.
   Input: bookingId (auth check: user must be mentor on booking).
   - Call stripe.refunds.create({charge_id: payments.stripe_charge_id,
     amount: payment.amount_total_cents}) to refund full amount.
   - UPDATE bookings SET status = 'cancelled_by_mentor'.
   - Call cancelBooking() from lib/calcom/booking.ts to cancel Cal.com event.
   - Send cancellation email to mentee.
   - Return {success: true}.

   Mentee cancellation (>24h before session):
   Create POST /api/bookings/[id]/cancel-mentee route.
   Input: bookingId (auth check: user must be mentee on booking).
   - Check: (bookings.scheduled_at - NOW()) > 24 hours?
   - If yes: full refund. Call stripe.refunds.create() as above.
   - UPDATE bookings SET status = 'cancelled_by_mentee'.
   - Call cancelBooking() from lib/calcom/booking.ts.
   - Send cancellation emails to both.
   - Return {success: true, refunded: true}.

   Mentee cancellation (≤24h before session):
   - Check: (bookings.scheduled_at - NOW()) <= 24 hours?
   - If yes: NO refund. UPDATE bookings SET status = 'cancelled_late'.
   - Call cancelBooking() from lib/calcom/booking.ts.
   - Send cancellation email to mentor ("Mentee cancelled — no refund issued").
   - Return {success: true, refunded: false}.

   Cancellation email templates:
   Create components/email/BookingCancelledMentee.tsx and ...Mentor.tsx
   using React Email base layout. Include: session type, date, reason (mentor
   initiated vs mentee + refund status).

2. Session room page /sessions/[id]:
   Create app/sessions/[id]/page.tsx. Route param: bookingId.
   Auth check: user must be mentor_id or mentee_id on the booking.
   Guard: booking.status must be 'confirmed' or 'session_completed'.
   Redirect to /dashboard if booking is cancelled or not yet confirmed.

   Layout:
   - Top bar: session type badge, "Sessão em andamento" timer (mm:ss).
   - Left (60%): Daily.co iframe:
     <iframe
       src={booking.daily_room_url}
       allow="camera; microphone; fullscreen; speaker; display-capture"
       style={{ width: '100%', height: '100%', border: 'none' }}
     />
   - Right sidebar (40%): session context card:
     * Session type
     * Mentee context (required, shown to mentor)
     * Current situation (optional)
     * Duration: 60 minutes
     * "Sair da sessão" button → /dashboard
   - Join button: disabled with countdown until T-10 minutes.
     JavaScript: compute (scheduled_at - NOW() in minutes).
     When <= 10: enable button, show "Entra na sessão" CTA.
     (This will be wired to auto-enable in Session 4A via Realtime.)

3. Daily.co room management:
   Rooms are created on booking confirmation (Session 3A).
   Rooms expire 2h after scheduled_at (lib/daily/room.ts already handles this).
   No recording at launch (requires consent + storage + deletion workflow).

TESTING CHECKLIST:
- Create a test booking via booking flow (Session 3A).
- Navigate to /sessions/[id] → see Daily.co iframe, context sidebar.
- Join button is disabled. Wait until T-10 min, verify button enables.
- (In test: set scheduled_at to NOW() + 5 min, refresh, button should
  enable immediately.)
- Try cancelling the booking via POST /api/bookings/[id]/cancel-mentee
  (>24h before) → booking.status = 'cancelled_by_mentee', refund created.
- Check Resend: cancellation emails arrived.
- Try cancelling with ≤24h before → status = 'cancelled_late', no refund.

After all complete, commit (tasks #56–63) and push.
Do NOT wire the join button to Realtime yet (that's Session 4A).
Do NOT build session completion cron yet (that's Session 3C).
```

---

## Session 3C: Cron jobs + post-session

```
Read CLAUDE.md and DECISIONS.md before starting.

CURRENT STATE:
- Sessions 3A, 3B complete: booking flow, cancellations, video room all live.
- bookings table has confirmed and completed bookings (manually set to test).
- lib/resend/send.ts has sendEmailWithFallback() for email queue.
- Do not modify booking creation, cancellation, or video room.

Tasks #64–72: Cron jobs (session completion, payout release), post-session
review form, outcome report form.

BUILD IN THIS ORDER (cron jobs must be protected by CRON_SECRET):

1. Session completion cron /api/cron/complete-sessions (every 15 min):
   Create app/api/cron/complete-sessions/route.ts.
   Guard: verify Authorization: Bearer $CRON_SECRET header. Return 401 if
   missing or incorrect.
   Logic:
   - Query: SELECT * FROM bookings WHERE status = 'confirmed' AND
     scheduled_at <= NOW().
   - For each: UPDATE bookings SET status = 'session_completed'.
   - For each: INSERT into notifications table (to mentee + mentor):
     type='session_completed', title='Sessão concluída',
     body='{mentor.display_name}: deixe uma avaliação'.
   - For each: queue a review request email (insert into email_queue,
     scheduled for 1h later via a helper function).
   - Return {processed: count} JSON.

2. Payout release cron /api/cron/release-payouts (daily 02:00 UTC):
   Create app/api/cron/release-payouts/route.ts.
   Guard: verify CRON_SECRET.
   Logic:
   - Query: SELECT * FROM payments WHERE status = 'succeeded' AND
     payment_released_at IS NULL AND created_at <= NOW() - INTERVAL '24 hours'.
   - For each: call stripe.transfers.create({
     amount: payment.amount_mentor_cents,
     currency: 'eur',
     destination: (mentor.stripe_account_id from JOIN),
     source_transaction: payment.stripe_charge_id
   }).
   - UPDATE payments SET payment_released_at = NOW(), status = 'released'.
   - For each mentor: send a notification (email optional, at launch just update
     earnings dashboard in Session 4A).
   - Return {released: count, amount_eur: total}.

3. Review form /sessions/[id]/review:
   Create app/sessions/[id]/review/page.tsx.
   Guard: user must be mentee, booking.status = 'session_completed'.
   Form:
   - Star rating: 5 tap targets (1–5 stars).
   - Review text: textarea, min 20 chars, max 500 chars, char counter.
   - "Recomendaria este mentor?" toggle (optional).
   - Submit button: "Enviar avaliação".
   On submit:
   - INSERT into reviews (booking_id, mentee_id, mentor_profile_id, rating,
     body, reviewer_type from users.student_type).
   - Trigger fires automatically → updates mentor_profiles (avg_rating,
     session_count, bayesian_score) — trigger from Session 1A.
   - Send mentor notification: "{mentee.display_name} deixou uma avaliação
     de 5 estrelas".
   - INSERT into notifications (to mentor).
   - Redirect to /bookings/[id]/confirmed with "Obrigado!" message.

4. Outcome report form /sessions/[id]/report:
   Create app/sessions/[id]/report/page.tsx.
   Guard: user must be mentor, booking.status = 'session_completed'.
   Form (context-aware to session type):
   - Checklist of topics (per session type, hardcoded for now):
     * CNA: calculou a nota? discutiu provas? ordenação candidatura?
     * Provas: selecionou provas? validou com o aluno?
     * Etc. (8 types × 3–4 topics each).
   - Summary textarea (required, 100–500 chars): "Resumo de o que foi discutido".
   - Next steps textarea (optional): "Próximas ações recomendadas".
   - Resources textarea (optional): links or text, stored as JSONB array.
   On submit:
   - INSERT into outcome_reports (booking_id, mentor_id, summary, next_steps,
     resources, sent_at = NOW()).
   - Create a React Email template (components/email/OutcomeReport.tsx) with
     formatted report, send to mentee via Resend.
   - Redirect to /(mentor)/dashboard with "Relatório enviado ao aluno" message.

5. Email queue retry cron /api/cron/retry-emails (every 30 min):
   Create app/api/cron/retry-emails/route.ts.
   Guard: verify CRON_SECRET.
   Logic:
   - Query: SELECT * FROM email_queue WHERE status = 'failed' AND
     attempts < 3.
   - For each: call sendEmailWithFallback() (from lib/resend/send.ts).
   - On success: UPDATE status = 'sent', attempts += 1.
   - On failure: UPDATE attempts += 1, last_attempted_at = NOW().
   - Return {retried: count, succeeded: count, failed: count}.

6. Vercel cron config:
   Create vercel.json at repo root (or update if it exists from Session 1B):
   ```json
   {
     "crons": [
       {"path": "/api/cron/complete-sessions", "schedule": "*/15 * * * *"},
       {"path": "/api/cron/release-payouts", "schedule": "0 2 * * *"},
       {"path": "/api/cron/retry-emails", "schedule": "*/30 * * * *"}
     ]
   }
   ```
   (Graduation flywheel is added in Session 5C.)

TESTING CHECKLIST (LOCAL):
- Set a booking's scheduled_at to NOW() - 1 min, manually call
  /api/cron/complete-sessions with CRON_SECRET → status updates to
  'session_completed'.
- Verify notifications inserted.
- Navigate to /sessions/[id]/review → form appears.
- Submit review → reviews row created, mentor_profiles stats updated.
- Set a payment to 24h old, call /api/cron/release-payouts with CRON_SECRET
  → Stripe transfer created (test mode).
- Verify payments.payment_released_at is set.

After all complete, commit (tasks #64–72) and push.
Do NOT add vercel.json to git yet (will be finalized in Session 5C after
graduation cron is written).
Do NOT wire notifications to dashboards yet (that's Session 4B).
```

---

## Session 4A: Dashboards

```
Read CLAUDE.md and FEATURE_SPEC.md (Dashboards section) before starting.

CURRENT STATE:
- Sessions 3A–3C complete: booking, cancellation, video room, post-session
  flows, and cron jobs all live.
- Mentor and mentee can view upcoming sessions and reviews.
- Do not modify booking, payment, or cron flows.

Tasks #73–82: Build mentor and mentee dashboards.

BUILD IN THIS ORDER:

MENTOR DASHBOARD at /(mentor)/dashboard:

1. Next session card (top, prominent):
   Query: SELECT * FROM bookings WHERE mentor_id = auth.uid() AND
   status = 'confirmed' AND scheduled_at > NOW() ORDER BY scheduled_at ASC LIMIT 1.
   Card: mentee name (hidden until T-24h; show "Candidato anónimo" before),
   session type, date/time, "Entra na sessão" button (disabled until T-10 min).
   If no upcoming bookings: "Nenhuma sessão agendada. Partilhe o seu perfil!"

2. Earnings widget:
   Show 3 metric cards:
   - "Este mês": SUM(payments.amount_mentor_cents) WHERE payment_released_at
     BETWEEN start_of_month AND NOW() / 100 = EUR amount.
   - "Pendente": SUM(payments.amount_mentor_cents) WHERE status = 'succeeded'
     AND payment_released_at IS NULL / 100 = EUR amount.
   - "Total": SUM(payments.amount_mentor_cents) / 100 = EUR amount.

3. Upcoming sessions list (next 7 days):
   Query: SELECT * FROM bookings WHERE mentor_id = auth.uid() AND
   status = 'confirmed' AND scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
   ORDER BY scheduled_at ASC.
   List: date, time, mentee name (anon until T-24h), session type, duration,
   "Entra na sessão" button.

4. Recent reviews strip:
   Query: SELECT * FROM reviews WHERE mentor_profile_id = (SELECT id FROM
   mentor_profiles WHERE user_id = auth.uid()) ORDER BY created_at DESC LIMIT 3.
   Show: star rating, review text (truncated to 100 chars), reviewer type label.

5. Quick actions menu:
   Links: "Ver o meu perfil" (→ /mentors/[slug]), "Disponibilidade" (→ edit
   calendar, stub for now), "Ganhos" (→ earnings page, stub for now).

6. Profile completeness banner (if onboarding not complete):
   Show progress bar (photo, types, calendar, Stripe).
   "Complete o seu perfil para aparecer em buscas" (only if is_active = false).
   "Go live" toggle (visible, enabled only if all steps + Stripe verified).

MENTEE DASHBOARD at /(mentee)/dashboard:

1. Next session card:
   Query: SELECT * FROM bookings WHERE mentee_id = auth.uid() AND
   status = 'confirmed' AND scheduled_at > NOW() ORDER BY scheduled_at ASC LIMIT 1.
   Card: mentor name, session type, date/time, mentor avatar, "Entra na sessão"
   button.
   If no upcoming bookings: "Nenhuma sessão agendada." + "Encontrar mentor" CTA
   (→ /mentors).

2. Pending reviews prompt:
   Query: SELECT COUNT(*) FROM bookings WHERE mentee_id = auth.uid() AND
   status = 'session_completed' AND id NOT IN (SELECT booking_id FROM reviews).
   If count > 0: show a card "Deixe uma avaliação de {count} sessão(ões)"
   with a link to the first pending review form (/sessions/[id]/review).

3. Empty state:
   If no bookings at all: "Ainda não tem nenhuma sessão marcada."
   + "Encontrar mentor" button (→ /mentors).

SHARED (BOTH DASHBOARDS):

1. Join button auto-enable (Supabase Realtime):
   In next session card: subscribe to bookings table for the user's next
   booking. When scheduled_at <= NOW() + 10 minutes, auto-enable the button
   without page refresh.
   Pseudo-code:
   ```tsx
   useEffect(() => {
     const sub = supabase
       .channel(`bookings-${userId}`)
       .on('postgres_changes', {event: '*', schema: 'public', table: 'bookings',
            filter: `id=eq.${bookingId}`}, (payload) => {
         setBooking(payload.new);
       })
       .subscribe();
     return () => sub.unsubscribe();
   }, [bookingId]);
   ```

2. Notifications badge (Realtime):
   In nav: show unread count badge on bell icon. Fetch from notifications
   table, filter by read_at IS NULL. Subscribe to Realtime for new
   notifications (will be wired fully in Session 4B).

TESTING CHECKLIST:
- Mentor: create a confirmed booking, navigate to dashboard → next session
  card shows, upcoming list shows booking.
- Mentor: upcoming sessions 7-day list shows multiple bookings correctly ordered.
- Mentor: recent reviews strip shows 3 most recent (if 3 exist).
- Mentor: earnings widget shows correct amounts (if payments are released).
- Mentee: navigate to dashboard → next session shows, mentor name + avatar.
- Mentee: if session is completed but not reviewed, "Deixe uma avaliação"
  card appears.
- Join button: disabled, enable 10 min before scheduled_at (test by setting
  scheduled_at to NOW() + 5 min).

After all complete, commit (tasks #73–82) and push.
Do NOT wire full notification feed yet (that's Session 4B).
```

---

## Session 4B: Notifications + settings + profile editing

```
Read CLAUDE.md and FEATURE_SPEC.md (Notifications, Dashboards) before starting.

CURRENT STATE:
- Session 4A complete: mentor and mentee dashboards live, next session cards,
  earnings, reviews, join buttons all working.
- notifications table exists with RLS.
- Do not modify dashboards or cron jobs.

Tasks #83–92: Reminder emails, notification feed, account settings, profile
editing.

BUILD IN THIS ORDER:

1. Reminder email cron /api/cron/reminders (every 30 min):
   Create app/api/cron/reminders/route.ts.
   Guard: verify CRON_SECRET.
   Add two columns to bookings table (migration 0005_reminder_flags.sql):
   bookings.reminder_24h_sent BOOLEAN DEFAULT FALSE
   bookings.reminder_1h_sent BOOLEAN DEFAULT FALSE
   Logic:
   - Query: SELECT * FROM bookings WHERE status = 'confirmed' AND
     reminder_24h_sent = FALSE AND
     (scheduled_at - NOW()) BETWEEN 23.5 hours AND 24.5 hours.
   - For each: send reminder email (template: components/email/
     SessionReminder24h.tsx) to both mentor and mentee.
   - UPDATE bookings SET reminder_24h_sent = TRUE.
   - Query: SELECT * FROM bookings WHERE status = 'confirmed' AND
     reminder_1h_sent = FALSE AND
     (scheduled_at - NOW()) BETWEEN 55 minutes AND 65 minutes.
   - For each: send 1h reminder (components/email/SessionReminder1h.tsx).
   - UPDATE bookings SET reminder_1h_sent = TRUE.
   - Return {sent_24h: count, sent_1h: count}.
   Update vercel.json: add /api/cron/reminders to crons list.

2. Notification feed UI:
   Create components/NotificationBell.tsx (client component).
   Bell icon in nav with red unread badge. On click: dropdown showing last 5
   notifications (or modal with full list).
   Fetch from notifications table WHERE user_id = auth.uid() ORDER BY
   created_at DESC LIMIT 5.
   Subscribe to Supabase Realtime: when new notifications inserted, add to list.
   Mark as read: PATCH notification SET read_at = NOW().

3. Account settings page /settings:
   Create app/settings/page.tsx. Tabs or sections:

   Profile section:
   - Display name (editable text input)
   - Profile photo (file upload, same as onboarding)
   - Email (read-only display; edit triggers verification flow)
   - Password (current password + new password inputs, POST /api/auth/change-password)

   Email preferences (checkboxes):
   - Receber lembretes de sessão (notifications sent by cron)
   - Receber newsletters/updates (marketing emails)
   Store as users.preferences JSONB.

   Data & privacy:
   - "Exportar meus dados" button → POST /api/user/export → triggers Edge
     Function to collect all data (stub for now, fully implemented in 5A).
   - "Eliminar minha conta" button → confirmation modal → soft-delete flow
     (fully implemented in 5A).

4. Update password route POST /api/auth/change-password:
   Input: currentPassword, newPassword.
   Auth check: user must be authenticated.
   - Verify currentPassword via supabase.auth.signInWithPassword() (without
     committing the session).
   - If valid: supabase.auth.updateUser({password: newPassword}).
   - Return {success: true} or {error: "senha atual incorreta"}.

5. Mentor profile editing /(mentor)/profile:
   Create app/(mentor)/profile/page.tsx.
   Form: all fields from Step 1 (identity + bio) and Step 2 (session types +
   prices). Read from mentor_profiles + session_types on mount.
   On submit: UPDATE mentor_profiles, UPDATE session_types (or INSERT if new).
   Call res.revalidatePath('/mentors/[slug]') to trigger ISR on profile page.
   Show "Perfil atualizado!" toast.
   Also show "On pause" toggle (sets is_active = false without suspending
   account). When toggled off: disappears from discovery. When toggled back on:
   reappears immediately.

TESTING CHECKLIST:
- Set a booking scheduled for NOW() + 24.5 hours, call /api/cron/reminders
  → check Resend for 24h reminder email to both parties.
- Set a booking scheduled for NOW() + 60 minutes, call /api/cron/reminders
  → check Resend for 1h reminder email.
- Verify reminder_24h_sent and reminder_1h_sent are set to TRUE.
- Open notification bell in nav → see dropdown with recent notifications.
- Subscribe to notifications via Realtime: manually INSERT a notification,
  verify it appears in dropdown without page refresh.
- Go to /settings → change password, change display name, verify updates
  persist.
- Mentor: go to /(mentor)/profile → edit session type prices, verify
  /mentors/[slug] updates immediately (ISR revalidation).
- Mentor: toggle "On pause" → disappears from /mentors listing, toggle back →
  reappears.

After all complete, commit (tasks #83–92) and push.
Migration 0005_reminder_flags.sql must be pushed before Session 5C.
Do NOT implement full data export or account deletion yet (that's Session 5A).
```

---

## Session 4C: Admin panel

```
Read CLAUDE.md and FEATURE_SPEC.md (Admin section) before starting.

CURRENT STATE:
- Sessions 4A, 4B complete: dashboards, notifications, settings all live.
- Do not modify user-facing flows.

IMPORTANT: All admin queries use SUPABASE_SERVICE_ROLE_KEY (never expose to client).
All routes gated by middleware: users.role = 'admin'.

Tasks #93–99: Admin panel with user list, booking list, revenue, refunds,
reviews, reports, suspension.

BUILD IN THIS ORDER:

1. Admin middleware gate:
   Update middleware.ts: if pathname.startsWith('/admin'), check users.role = 'admin'.
   If not: redirect to /. (Stub from Session 1B, now fully enforce.)

2. Admin layout /admin:
   Create app/admin/layout.tsx. Sidebar nav with links:
   - Users
   - Bookings
   - Revenue
   - Refunds
   - Reviews
   - Reports
   - Settings (admin-only settings, stub for now)

3. Users list /admin/users:
   Create app/admin/users/page.tsx.
   Table: email, display_name, role, email_verified, created_at, actions.
   Search box: ilike on email or display_name.
   Filter: role (mentor/mentee/admin), email_verified (yes/no).
   On row click: side panel showing user details, session count, total spent/
   earned, action buttons:
   - "View bookings" (filter bookings to this user)
   - "Suspend account" (soft-delete user, set users.is_suspended = true,
     call supabase.auth.admin.signOut(user_id))
   - "Send email" (compose form, send via Resend)

4. Bookings list /admin/bookings:
   Create app/admin/bookings/page.tsx.
   Table: mentee, mentor, session type, date, status, amount, actions.
   Filter: status (pending, confirmed, completed, cancelled).
   Sort: date DESC, amount DESC.
   On row click: details panel showing full booking + payment info, action
   buttons:
   - "Mark as completed" (set status = 'session_completed')
   - "Cancel & refund" (trigger cancellation flow)
   - "View messages" (stub, no built-in messaging at launch)

5. Revenue metrics /admin/revenue:
   Create app/admin/revenue/page.tsx.
   Three metric cards:
   - "Total platform fee (this month)" = SUM(payments.amount_fee_cents) / 100
   - "Total mentor payouts (this month)" = SUM(payments.amount_mentor_cents) / 100
   - "Total GMV (this month)" = SUM(payments.amount_total_cents) / 100
   Below: bar chart of last 6 months revenue (mock chart using recharts or
   similar).

6. Refunds form /admin/refunds:
   Create app/admin/refunds/page.tsx.
   Form: input booking_id, submit → fetch booking + payment details, display
   mentor/mentee, amount, show "Refund" button.
   On confirm: call stripe.refunds.create({charge_id, amount}), UPDATE
   payments.status = 'refunded', log to admin_actions table.
   Show "Refund processed" confirmation.

7. Reviews moderation /admin/reviews:
   Create app/admin/reviews/page.tsx.
   List: all reviews, star rating, reviewer, text, actions.
   Filter: rating (1–5 stars).
   On row click: modal showing full review + mentor profile, action buttons:
   - "Delete review" (confirm → DELETE from reviews, trigger automatically
     updates mentor_profiles stats)
   - "Flag mentor profile" (INSERT into flagged_profiles)

8. Flagged profiles queue /admin/reports:
   Create app/admin/reports/page.tsx.
   Table: flagged profile (mentor name, course), report reason (if any),
     actions.
   On row click: mentor profile details, action buttons:
   - "Dismiss" (DELETE from flagged_profiles)
   - "Suspend mentor" (set mentor_profiles.is_active = false + users.is_suspended
     = true, call supabase.auth.admin.signOut(mentor_id))

9. Admin actions logging:
   Create new migration 0006_admin_actions.sql:
   ```sql
   CREATE TABLE admin_actions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     admin_id UUID NOT NULL REFERENCES users(id),
     action TEXT NOT NULL,
     target_id UUID,
     note TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
   Log every admin action: DELETE review, refund payment, suspend user, etc.

TESTING CHECKLIST:
- Create admin user (manually: INSERT users with role='admin').
- Login as admin → /admin accessible, user list loads.
- Search users by email → results filter correctly.
- Click on a mentor user → side panel shows details, "Suspend account" button.
- Click "Suspend account" → confirm → user suspended, bookings visible.
- Go to /admin/bookings → table loads, filter by status works.
- Go to /admin/revenue → metric cards show correct amounts (if payments exist).
- Go to /admin/refunds → input a booking_id, confirm refund → check Stripe
  test mode for refund transaction.
- Go to /admin/reviews → list reviews, delete one → check reviews table + verify
  mentor_profiles stats updated.

After all complete, commit (tasks #93–99) and push.
Migration 0006_admin_actions.sql must be applied before Session 5C.
```

---

## Session 5A: GDPR + account management

```
Read CLAUDE.md, DECISIONS.md, FEATURE_SPEC.md (Legal section) before starting.

CURRENT STATE:
- Sessions 4A–4C complete: dashboards, notifications, admin panel all live.
- /settings page has placeholder buttons for export and delete.
- Do not modify admin flows or cron jobs.

Tasks #100–103: Account deletion, data export (GDPR), right to erasure.

BUILD IN THIS ORDER:

1. Account deletion confirmation modal:
   In /settings: "Eliminar minha conta" button opens modal.
   Modal: "Tens a certeza? Esta ação não pode ser revertida."
   Warning: all future bookings cancelled, full refunds issued, account
   deleted permanently (soft-delete).
   Two buttons: "Cancelar" and "Eliminar conta" (red destructive button).

2. Account deletion route POST /api/user/delete:
   Input: password (verify user identity first via signInWithPassword).
   Logic:
   - Set users.deleted_at = NOW(), NULL name/email/photo_url.
   - Query all bookings WHERE mentee_id = user_id OR mentor_id = user_id
     AND status IN ('pending_payment', 'confirmed').
   - For each: UPDATE status = 'cancelled_late' (no refund), cancel Cal.com,
     send cancellation email to other party.
   - For mentors: set mentor_profiles.is_active = false, cancel all future
     bookings (refund the booking owner if mentee).
   - Call supabase.auth.admin.deleteUser(user_id) to remove from Auth.
   - Redirect to / with flash message "Conta eliminada com sucesso."

3. Data export (GDPR Article 20):
   Create /api/user/export route (can use Supabase Edge Function or Next.js
   API route).
   Query & collect:
   - users row (all columns)
   - mentor_profiles row (if mentor)
   - session_types rows (if mentor)
   - bookings rows (mentee or mentor)
   - payments rows (related to bookings)
   - reviews rows (mentee or mentor)
   - outcome_reports rows (mentor)
   - notifications rows (user_id)
   Format as JSON object:
   {
     "user": {...},
     "mentor_profile": {...} or null,
     "bookings": [...],
     "payments": [...],
     "reviews": [...],
     ...
   }
   Create a React Email template: components/email/DataExport.tsx.
   Attach the JSON file to email, send to user via Resend.
   Show "Seus dados foram enviados para seu email" confirmation.

4. Right to erasure (GDPR Article 17(3)(e)):
   Extend deletion flow:
   - Query all bookings WHERE mentee_id = user_id OR mentor_id = user_id.
   - For each booking: SET mentee_display_name = 'Utilizador eliminado'
     (if mentee was deleted), mentor_display_name = 'Utilizador eliminado'
     (if mentor was deleted).
   - Query all reviews WHERE mentee_id = user_id: SET reviewer_label =
     'Utilizador eliminado'.
   - Keep booking + payment + review records (financial/legal obligations).

5. Update /settings page:
   - "Exportar meus dados" button → POST /api/user/export → show loading,
     then "Dados enviados para seu email" confirmation.
   - "Eliminar minha conta" button → opens confirmation modal (from step 1).

TESTING CHECKLIST:
- Go to /settings, click "Exportar meus dados" → check Resend for email with
  JSON attachment containing all user data.
- Click "Eliminar minha conta" → open modal, click "Eliminar conta" → confirm
  → redirected to / with message.
- Verify users.deleted_at is set, name/email/photo_url are NULLed.
- Query admin: bookings with deleted user should be cancelled.
- Query admin: reviews from deleted user should have reviewer_label =
  'Utilizador eliminado'.

After all complete, commit (tasks #100–103) and push.
Do NOT remove DRAFT banners from /terms and /privacidade yet (that's Session 5C).
```

---

## Session 5B: Marketing pages

```
Read CLAUDE.md and FEATURE_SPEC.md (Marketing section) before starting.

CURRENT STATE:
- Sessions 5A complete: GDPR and account deletion flows live.
- Do not modify app flows.

Tasks #104–109: Build all static marketing pages (no auth, no DB queries).
All in Portuguese. Use realistic PT university context.

BUILD IN THIS ORDER (all pages are static Next.js pages, no DB):

1. Landing page / (app/page.tsx — may already exist):
   Hero section:
   - Large headline: "Fala com quem já passou por isso."
   - Subheader: "Mentoria 1:1 em vídeo com estudantes universitários
     portugueses que navegaram o Concurso Nacional de Acesso há um ou dois anos.
     Sessões de 60 minutos, a partir de €20."
   - Two CTAs: "Encontrar mentor" and "Tornar-me mentor".
   
   Trust strip (from prototype):
   - "4,9 ★" | "11% taxa" | "60 min" | "6 universidades"
   
   How it works section (4 steps):
   - Find mentor → browse profiles, read reviews
   - Book session → select time, add context
   - Video call → 60-min 1:1 with mentor
   - Leave review → help next candidates
   
   Feature cards: "Mentores verificados" | "Agendamento fácil" | "Vídeo integrado"

2. /como-funciona (How it works detail page):
   - Full breakdown of the 4-step process with more detail than landing.
   - Per-step section: description, what to expect, example mentor profile.
   - Timeline: "Tudo leva 5 minutos: procura, reserva, conversa."

3. /para-mentores (For mentors):
   - Headline: "Ganhe enquanto ajuda."
   - Value prop: flexible schedule, set your own prices (€20–50), earn
     instantly.
   - Earnings calculator (client-side JS):
     Input: hours/week, price per session → output: "Ganhe €X por mês"
     (e.g., 5 hours/week × €40 = €800/month).
   - How it works: onboarding 4 steps → profile goes live → students book →
     you earn.
   - FAQ: "Quanto ganho?" "Como funciona o pagamento?" "Posso pausar?"

4. /para-candidatos (For candidates):
   - Headline: "Orientação de especialistas. Resultados reais."
   - Value prop: 1:1 mentoring from real students, affordable, flexible timing.
   - Outcomes: "Calculei minha nota e criei minha estratégia CNA" (testimonial
     style).
   - Session types overview: 8 cards (cna, provas, ordem, curso, equiv, tutor,
     vida, intl).
   - CTA: "Encontrar mentor".

5. /faq (FAQ page):
   Common questions (both mentors and candidates):
   - "Como funciona uma sessão?" (60 min, vídeo, com ou sem agenda prévia)
   - "Posso remarcar?" (sim, com 24h de antecedência)
   - "É seguro?" (Stripe para pagamentos, Daily.co para vídeo, Supabase para dados)
   - "E se não gostar do mentor?" (reembolso integral se cancelar >24h)
   - "Preciso de webcam?" (sim, câmera e microfone)
   - Mentor: "Qual é o processo de onboarding?" "Quando é o pagamento?" "Posso
     escolher meus horários?"

6. /precos (Pricing page):
   - Headline: "Preços simples. Sem surpresas."
   - Price range: €20–50 per session, 11% platform fee (shown in calculation).
   - Mentors set their own prices based on experience/specialization.
   - Example breakdown: "Sessão de €40 → você paga €35.60 (11% fee)"
   - No subscription, pay per session.

TESTING CHECKLIST:
- All pages load without errors.
- Earnings calculator works: input hours/price, output updates in real-time.
- No auth required on any page (check middleware doesn't redirect).
- Links work: /para-mentores → "Tornar-me mentor" CTA goes to /onboarding/mentor
  (requires auth, so redirects to /signup).
- All content is in Portuguese.
- Meta tags (title, description) set for SEO.

After all complete, commit (tasks #104–109) and push.
Do NOT remove DRAFT banners from legal pages yet (that's Session 5C).
```

---

## Session 5C: Final systems + launch checks

```
Read CLAUDE.md, DECISIONS.md, BOOKING_FLOW.md before starting.

CURRENT STATE:
- Sessions 5A, 5B complete: GDPR, account deletion, data export, marketing
  pages all live.
- All cron jobs written but NOT deployed to production yet.
- vercel.json exists with 3 crons (complete-sessions, release-payouts, reminders).
- Stripe webhook endpoint live at /api/webhooks/stripe.
- Do not modify user flows, admin panel, or marketing pages.

Tasks #110–111: Graduation flywheel (final cron), end-to-end Stripe test,
pre-launch verification checklist.

BUILD IN THIS ORDER:

1. Graduation flywheel cron /api/cron/graduation-flywheel (monthly, 1st at 09:00 UTC):
   Create app/api/cron/graduation-flywheel/route.ts.
   Guard: verify CRON_SECRET.
   Query: SELECT DISTINCT mentee_id FROM bookings
   WHERE status = 'session_completed' AND
   DATE_TRUNC('month', scheduled_at) = DATE_TRUNC('month', NOW()) - INTERVAL '6 months'
   AND mentee_id NOT IN (SELECT user_id FROM mentor_profiles WHERE deleted_at IS NULL).
   (Mentees who completed sessions 6–12 months ago and are not mentors.)
   For each: send "Torne-se mentor agora" email (React Email template:
   components/email/GraduationInvite.tsx).
   Include: how to apply, link to /onboarding/mentor.
   Update vercel.json: add /api/cron/graduation-flywheel to crons list.

2. vercel.json final config:
   ```json
   {
     "crons": [
       {"path": "/api/cron/complete-sessions", "schedule": "*/15 * * * *"},
       {"path": "/api/cron/release-payouts", "schedule": "0 2 * * *"},
       {"path": "/api/cron/reminders", "schedule": "*/30 * * * *"},
       {"path": "/api/cron/graduation-flywheel", "schedule": "0 9 1 * *"}
     ]
   }
   ```

3. Stripe Connect end-to-end test (TEST MODE):
   Use test Stripe account (sk_test_..., pk_test_...).
   Steps:
   a) Create a new test mentor account via /onboarding/mentor.
   b) Complete all 4 steps. At Step 4: redirect to Stripe Connect Express.
   c) In Stripe test mode: use test bank account (11000000000000000 USA routing).
   d) Verify charges_enabled and payouts_enabled become true in Stripe dashboard.
   e) Create a test mentee account.
   f) Book a session with the test mentor (use test card 4242 4242 4242 4242).
   g) Verify payment succeeds, booking status = 'confirmed', Daily.co room created.
   h) Verify confirmation emails arrive (Resend).
   i) Manually call /api/cron/release-payouts (set payment to 24h old first).
   j) Verify Stripe transfer created to mentor's account.
   k) Test refund: cancel booking ≤24h before → verify refund processed.
   l) Verify cancellation emails arrive.
   Document any issues in DECISIONS.md.

4. Legal pages finalization:
   Remove "DRAFT — PENDING LEGAL REVIEW" banners from /terms and /privacidade.
   Assume legal review completed (in real scenario, lawyer signs off).

5. Pre-launch checklist:
   Before deploying to production:
   
   [ ] RLS policies tested: create test auth users with different roles, verify
       they can only see their own data (bookings, reviews, etc.).
   
   [ ] Stripe webhook secret set in production .env: STRIPE_WEBHOOK_SECRET from
       Stripe dashboard.
   
   [ ] CRON_SECRET set in production .env (strong random string, 32+ chars).
   
   [ ] Cookie consent working: verify no analytics script loads before user
       accepts cookies.
   
   [ ] Email delivery verified: all 6 email templates tested in production
       (NOT preview mode in Resend).
   
   [ ] GDPR deletion flow tested end-to-end: delete account → verify soft-delete,
       data exported, emails sent.
   
   [ ] Daily.co room failure fallback: test room creation failure (mock API error)
       → verify booking still proceeds with error logged, fallback (show error
       message to mentor/mentee).
   
   [ ] Supabase Auth redirect URLs updated for production domain (not localhost).
   
   [ ] Google OAuth credentials set in Supabase Auth (real Google Console OAuth app).
   
   [ ] Cal.com API key rotated (generate new key, update .env).
   
   [ ] Stripe platform application approved (status: verified in dashboard).
   
   [ ] Mentors onboarded: at least 5 test mentors with live profiles in production.
   
   [ ] Mentee onboarding tested: create account as mentee, book session, complete
       session, leave review.
   
   [ ] Admin suspend flow tested: suspend a mentor → verify bookings handled,
       profile hidden from discovery.

TESTING CHECKLIST:
- Graduation flywheel: manually call /api/cron/graduation-flywheel with test
  data → check Resend for emails to eligible mentees.
- Stripe end-to-end: follow all 11 steps above (a–l).
- Legal pages: no DRAFT banner visible.
- Pre-launch checklist: verify all 13 items are complete before production
  deployment.

After all complete, commit (tasks #110–111) and push.
Production deployment:
1. Merge to main (all sessions pushed).
2. Push production env vars to Vercel: vercel env add <var> production for each
   real key.
3. Deploy to Vercel: git push triggers automatic deploy (GitHub integration).
4. Verify cron jobs are live: Vercel dashboard → Settings → Cron Jobs.
5. Monitor for 24h: check /api/cron logs, Resend delivery, Stripe transfers.

LAUNCH COMPLETE.
```