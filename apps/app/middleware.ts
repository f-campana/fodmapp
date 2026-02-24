import { type NextRequest, NextResponse } from "next/server";
import { getAuthMiddlewareMode, getClerkBootstrapStatus } from "./lib/clerk";

export function middleware(request: NextRequest): NextResponse {
  const mode = getAuthMiddlewareMode(request.nextUrl.pathname);
  const auth = getClerkBootstrapStatus();
  const response = NextResponse.next();

  response.headers.set("x-fodmap-auth-provider", auth.provider);
  response.headers.set("x-fodmap-auth-mode", mode);
  response.headers.set(
    "x-fodmap-auth-configured",
    String(auth.fullyConfigured),
  );

  return response;
}

export const config = {
  matcher: ["/espace/:path*"],
};
