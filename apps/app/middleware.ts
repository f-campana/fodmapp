import { type NextRequest, NextResponse } from "next/server";
import { getAuthMiddlewareMode } from "./lib/clerk";

export function middleware(request: NextRequest): NextResponse {
  const mode = getAuthMiddlewareMode(request.nextUrl.pathname);
  if (mode === "protected-placeholder") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/espace/:path*"],
};
