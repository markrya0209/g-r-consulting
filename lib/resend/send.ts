import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "G&R Consulting <noreply@grmentoria.pt>";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
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
