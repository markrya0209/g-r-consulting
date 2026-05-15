-- Migration 0002: email_queue table
-- Used by lib/resend/send.ts sendEmailWithFallback() to queue failed sends for retry.

CREATE TABLE IF NOT EXISTS email_queue (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "to"             text        NOT NULL,
  subject          text        NOT NULL,
  template         text        NOT NULL,
  payload          jsonb       NOT NULL DEFAULT '{}',
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'sent', 'failed')),
  attempts         integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_attempted_at timestamptz
);

-- Index for the retry cron (status='failed' or 'pending', ordered by age)
CREATE INDEX email_queue_retry_idx ON email_queue (status, created_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS access — only service role key may touch this table.
-- All application code should use sendEmailWithFallback() in lib/resend/send.ts,
-- which runs server-side with the service-role client in cron handlers.
CREATE POLICY "no_public_access" ON email_queue USING (false);
