import { type NextRequest, NextResponse } from "next/server";

import { neon } from "@neondatabase/serverless";

import { sendWaitlistConfirmationEmail } from "../../../src/lib/email";

type SuccessResult = {
  ok: true;
};

type ErrorResult = {
  ok: false;
  code: "bad_request" | "invalid_email" | "server_error";
};

type WaitlistResponse = SuccessResult | ErrorResult;

/* eslint-disable no-console */

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<WaitlistResponse>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request" } as const, {
      status: 400,
    });
  }

  const rawEmail = extractEmail(body);
  if (!rawEmail) {
    return NextResponse.json({ ok: false, code: "invalid_email" } as const, {
      status: 400,
    });
  }

  const email = rawEmail.trim().toLowerCase();
  if (!isBasicEmailFormat(email)) {
    return NextResponse.json({ ok: false, code: "invalid_email" } as const, {
      status: 400,
    });
  }

  const marketingDbUrl = process.env.MARKETING_DB_URL;
  if (!marketingDbUrl) {
    console.error("MARKETING_DB_URL is not set");
    return NextResponse.json({ ok: false, code: "server_error" } as const, {
      status: 503,
    });
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
        return NextResponse.json({ ok: false, code: "server_error" } as const, {
          status: 500,
        });
      }
    }

    return NextResponse.json({ ok: true } as const);
  } catch (error) {
    console.error("Failed to write waitlist signup", error);
    return NextResponse.json({ ok: false, code: "server_error" } as const, {
      status: 500,
    });
  }
}

function extractEmail(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const maybeEmail = (body as { email?: unknown }).email;
  if (typeof maybeEmail !== "string") {
    return null;
  }
  return maybeEmail;
}

function isBasicEmailFormat(email: string): boolean {
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

  return local !== "." && !local.includes("..") && !domain.includes("..");
}
