import { redirect } from "next/navigation";

import {
  extractEmailFromFormData,
  submitWaitlistSignup,
} from "../../../src/lib/waitlist";

export const dynamic = "force-dynamic";

function waitlistRedirectTarget(
  state: "success" | "invalid_email" | "server_error",
): string {
  return `/?waitlist=${state}#waitlist`;
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const rawEmail = extractEmailFromFormData(formData);
  const result = await submitWaitlistSignup(rawEmail);

  if (result.ok) {
    redirect(waitlistRedirectTarget("success"));
  }

  redirect(waitlistRedirectTarget(result.code));
}
