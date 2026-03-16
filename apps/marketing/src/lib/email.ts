import { Resend } from "resend";

/* eslint-disable no-console */

type EmailResult = { ok: true } | { ok: false; error: unknown };

const from = process.env.RESEND_FROM_EMAIL ?? "noreply@fodmapp.fr";

export async function sendWaitlistConfirmationEmail(
  email: string,
): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not set — skipping confirmation email");
    return { ok: true };
  }

  const resend = new Resend(resendApiKey);
  const result = await resend.emails.send({
    from,
    to: email,
    subject: "Bienvenue sur la liste d'attente FODMAPP",
    text: "Merci de ton inscription. On te préviendra dès que FODMAPP sera disponible.",
    html: "<p>Merci de ton inscription. On te préviendra dès que FODMAPP sera disponible.</p>",
  });

  if (result.error) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}
