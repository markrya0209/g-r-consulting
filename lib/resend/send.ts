import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Handle error when setting cookies
              }
            },
          },
        }
      );

      await supabase.from("email_queue").insert({
        to,
        subject,
        template: template || "generic",
        payload: payload || { subject, react: react.toString() },
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
