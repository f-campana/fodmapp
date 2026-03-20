import { neon } from "@neondatabase/serverless";

import { sendWaitlistConfirmationEmail } from "./email";

export type WaitlistErrorCode =
  | "bad_request"
  | "invalid_email"
  | "server_error";

export type WaitlistApiResponse =
  | { ok: true }
  | { ok: false; code: WaitlistErrorCode };

export type WaitlistFallbackState =
  | "success"
  | "invalid_email"
  | "server_error";

export type WaitlistSubmissionResult =
  | { ok: true }
  | {
      ok: false;
      code: Exclude<WaitlistErrorCode, "bad_request">;
      status: number;
    };

function isBasicEmailFormat(email: string): boolean {
  const length = email.length;
  if (length < 6) {
    return false;
  }

  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) {
    return false;
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (!local || !domain) {
    return false;
  }

  if (
    domain.length < 3 ||
    !domain.includes(".") ||
    domain.startsWith(".") ||
    domain.endsWith(".")
  ) {
    return false;
  }

  for (const character of email) {
    if (character.trim() !== character) {
      return false;
    }
  }

  return local !== "." && !local.includes("..") && !domain.includes("..");
}

export function extractEmail(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const maybeEmail = (body as { email?: unknown }).email;
  return typeof maybeEmail === "string" ? maybeEmail : null;
}

export function extractEmailFromFormData(formData: FormData): string | null {
  const maybeEmail = formData.get("email");
  return typeof maybeEmail === "string" ? maybeEmail : null;
}

export function normalizeWaitlistEmail(rawEmail: string | null): string | null {
  if (typeof rawEmail !== "string") {
    return null;
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  return normalizedEmail.length > 0 ? normalizedEmail : null;
}

export function normalizeWaitlistFallbackState(
  rawState: string | string[] | undefined,
): WaitlistFallbackState | null {
  const candidate = Array.isArray(rawState) ? rawState[0] : rawState;

  if (
    candidate === "success" ||
    candidate === "invalid_email" ||
    candidate === "server_error"
  ) {
    return candidate;
  }

  return null;
}

/* eslint-disable no-console */

export async function submitWaitlistSignup(
  rawEmail: string | null,
): Promise<WaitlistSubmissionResult> {
  const email = normalizeWaitlistEmail(rawEmail);
  if (!email || !isBasicEmailFormat(email)) {
    return { ok: false, code: "invalid_email", status: 400 };
  }

  const marketingDbUrl = process.env.MARKETING_DB_URL;
  if (!marketingDbUrl) {
    console.error("MARKETING_DB_URL is not set");
    return { ok: false, code: "server_error", status: 503 };
  }

  try {
    const sql = neon(marketingDbUrl);
    const rows = await sql(
      `INSERT INTO waitlist_signups (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING
       RETURNING email`,
      [email],
    );

    const wasInserted = Array.isArray(rows) && rows.length > 0;

    if (wasInserted) {
      const emailResult = await sendWaitlistConfirmationEmail(email);
      if (!emailResult.ok) {
        console.error(
          "Failed to send confirmation email",
          emailResult.error ?? "unknown error",
        );
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("Failed to write waitlist signup", error);
    return { ok: false, code: "server_error", status: 500 };
  }
}
