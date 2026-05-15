import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "G&R Consulting <noreply@grmentoria.pt>";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  template?: string;
  payload?: Record<string, any>;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    react,
  });

  if (error) {
    console.error("[Resend] failed to send:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function sendEmailWithFallback({
  to,
  subject,
  react,
  template,
  payload,
}: SendEmailOptions) {
  try {
    const result = await sendEmail({ to, subject, react });
    return result;
  } catch (error) {
    console.error("[Resend] email send failed, queuing for retry:", error);

    try {
      const supabase = await createServiceClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("email_queue") as any).insert({
        to,
        subject,
        template: template || "generic",
        payload: payload || { subject },
        status: "failed",
        attempts: 0,
      });

      return { id: "queued" };
    } catch (queueError) {
      console.error("[Email Queue] failed to insert into queue:", queueError);
      // Log but don't throw - email delivery failures shouldn't block business logic
    }
  }
}
