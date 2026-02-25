import {
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from "next/server";
import { getAuthMiddlewareMode } from "./lib/clerk";

type ClerkProxyHandler = NextMiddleware;

let cachedClerkProxyHandler: Promise<ClerkProxyHandler | null> | null = null;

async function getClerkProxyHandler(): Promise<ClerkProxyHandler | null> {
  if (cachedClerkProxyHandler) {
    return cachedClerkProxyHandler;
  }

  cachedClerkProxyHandler = (async () => {
    try {
      const { clerkMiddleware, createRouteMatcher } = await import(
        "@clerk/nextjs/server"
      );
      const isProtectedRoute = createRouteMatcher(["/espace(.*)"]);

      return clerkMiddleware(async (auth, request) => {
        if (isProtectedRoute(request)) {
          await auth.protect();
        }
      });
    } catch {
      return null;
    }
  })();

  return cachedClerkProxyHandler;
}

export async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
): Promise<Response> {
  const mode = getAuthMiddlewareMode(request.nextUrl.pathname);
  if (mode === "protected-runtime") {
    const clerkProxy = await getClerkProxyHandler();
    if (clerkProxy) {
      const response = await clerkProxy(request, event);
      return response ?? NextResponse.next();
    }
  }

  if (mode === "protected-placeholder") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/espace/:path*"],
};
