# Booking Flow — Integration Sequence

Read this before writing any booking or payment code.
The flow involves 4 external services that must coordinate in sequence.

---

## Happy path

```
1. SLOT SELECTION
   User selects session type on mentor profile
   → Embed Cal.com inline widget scoped to mentor's event_type_id
   → User picks a slot
   → Cal.com returns provisional booking: { uid: cal_booking_uid }
   → CREATE bookings row:
       status = 'pending_payment'
       cal_booking_uid = <returned uid>
       mentee_id = auth.uid()
       mentor_id = <from session type>
       session_type_id = <selected>
       scheduled_at = <selected slot>
       scheduled_duration_minutes = <from session type>

2. PRE-SESSION CONTEXT
   User fills form: mentee_context (required, 50–500 chars), current_situation (optional)
   → UPDATE bookings SET mentee_context = ..., current_situation = ... WHERE id = ...

3. PAYMENT
   Server creates Stripe PaymentIntent:
     amount: session_price_cents
     currency: 'eur'
     application_fee_amount: Math.round(session_price_cents * 0.11)
     transfer_data.destination: mentor_profiles.stripe_account_id
     capture_method: 'automatic'
     metadata: {
       booking_id: <uuid>,
       mentor_id: <uuid>,
       mentee_id: <uuid>,
       session_type: <string>
     }
   → UPDATE bookings SET stripe_payment_intent_id = ... WHERE id = ...
   → Redirect to Stripe Checkout

4. STRIPE WEBHOOK: payment_intent.succeeded
   Handler at /api/webhooks/stripe/route.ts
   Verify stripe-signature header FIRST — reject if invalid
   Extract booking_id from metadata
   → UPDATE bookings SET status = 'confirmed' WHERE id = booking_id
   → CREATE payments row:
       booking_id, stripe_payment_intent_id, amount_cents, fee_cents,
       mentor_payout_cents, status = 'held'
   → Confirm Cal.com provisional booking via Cal.com API (booking uid)
   → Create Daily.co room via Daily.co API
       store room_url on bookings row
   → Send confirmation email to mentee (with ICS attachment + room URL)
   → Send confirmation email to mentor (with mentee context + room URL)
   All steps after the DB update are async — do not fail the webhook response
   if email or Cal.com fails. Log errors to a separate errors table.

5. CRON: session_completed transition
   /api/cron/complete-sessions — runs every 15 minutes
   Protected by Authorization: Bearer $CRON_SECRET
   Query: bookings WHERE status = 'confirmed'
           AND scheduled_at + scheduled_duration_minutes * interval '1 minute' < NOW()
   → UPDATE status = 'session_completed'
   → Send review request email to mentee (1h after session end — queue with delay)
   → Send outcome report reminder to mentor

6. CRON: payout release
   /api/cron/release-payouts — runs daily at 02:00 UTC
   Query: payments WHERE status = 'held'
           AND bookings.status = 'session_completed'
           AND bookings.session_completed_at < NOW() - INTERVAL '24 hours'
   → Call Stripe Transfers API to move funds to mentor Connect account
   → UPDATE payments SET status = 'released', payment_released_at = NOW()
   → Send payout confirmation email to mentor
```

---

## Cancellation flows

```
MENTOR CANCELS (before session):
  → Call Stripe Refunds API with payment_intent_id, reason: 'requested_by_customer'
  → UPDATE bookings SET status = 'cancelled_by_mentor'
  → UPDATE payments SET status = 'refunded'
  → Cancel Cal.com booking via Cal.com API
  → Send email to mentee: full refund confirmed + rebook CTA

MENTEE CANCELS >24h BEFORE:
  → Call Stripe Refunds API — full refund
  → UPDATE bookings SET status = 'cancelled_by_mentee'
  → UPDATE payments SET status = 'refunded'
  → Cancel Cal.com booking
  → Send email to mentor: booking cancelled

MENTEE CANCELS ≤24h BEFORE:
  → NO Stripe refund
  → UPDATE bookings SET status = 'cancelled_late'
  → UPDATE payments SET status = 'held' (proceeds to payout as normal)
  → Cancel Cal.com booking
  → Send email to mentee: no refund per policy (policy shown at booking time)
  → Send email to mentor: mentee cancelled, you will still be paid
```

---

## Failure modes and recovery

```
Daily.co room creation fails:
  → Retry 3× with exponential backoff
  → If still failing: log to errors table, send admin alert
  → Set bookings.room_url = NULL, bookings.room_status = 'failed'
  → Admin can manually trigger room creation from admin panel
  → Fallback: admin sends Whereby/Zoom link directly to both parties

Cal.com confirmation fails:
  → Log to errors table, send admin alert
  → Booking is still confirmed in our DB — this is a calendar sync failure only
  → Admin can manually re-trigger Cal.com confirmation

Email delivery fails:
  → Resend SDK returns error — log to email_queue table with status = 'failed'
  → Retry cron: /api/cron/retry-emails — runs every 30 minutes
  → After 3 failures: mark as 'dead', admin alert
  → Never block a webhook response or booking confirmation for an email failure

Stripe webhook delivered twice (idempotency):
  → Check payments table: if stripe_payment_intent_id already exists, skip
  → Return 200 to Stripe either way (prevents retry storm)
```

---

## Key IDs to store on bookings table
```
bookings.cal_booking_uid          — Cal.com provisional/confirmed booking ID
bookings.stripe_payment_intent_id — Stripe PaymentIntent ID
bookings.room_url                 — Daily.co room URL (stored after creation)
bookings.room_status              — 'pending' | 'created' | 'failed'
```

---

## File locations
```
/app/api/webhooks/stripe/route.ts     — Stripe webhook handler
/app/api/cron/complete-sessions/route.ts
/app/api/cron/release-payouts/route.ts
/app/api/cron/retry-emails/route.ts
/lib/stripe/payment-intent.ts         — createPaymentIntent helper
/lib/stripe/webhook.ts                — constructEvent + signature verify
/lib/calcom/booking.ts                — confirm, cancel booking helpers
/lib/daily/room.ts                    — createRoom helper
/lib/resend/send.ts                   — sendEmail wrapper with error logging
```
