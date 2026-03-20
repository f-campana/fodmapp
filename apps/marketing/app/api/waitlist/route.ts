import { type NextRequest, NextResponse } from "next/server";

import {
  extractEmail,
  submitWaitlistSignup,
  type WaitlistApiResponse,
} from "../../../src/lib/waitlist";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<WaitlistApiResponse>> {
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

  const result = await submitWaitlistSignup(rawEmail);
  if (result.ok) {
    return NextResponse.json({ ok: true } as const);
  }

  return NextResponse.json({ ok: false, code: result.code } as const, {
    status: result.status,
  });
}
