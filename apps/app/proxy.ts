import {
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from "next/server";
import { getAuthMiddlewareMode } from "./lib/clerk";
import { captureSentryEvent } from "./lib/sentry";

type ClerkProxyHandler = NextMiddleware;
const AUTH_UNAVAILABLE_ERROR = "service_unavailable";

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

export type ProxyRuntimeFailureReporter = (
  reason: string,
  error?: unknown,
) => void;

export interface ProxyDependencies {
  loadClerkProxyHandler?: () => Promise<ClerkProxyHandler | null>;
  reportRuntimeFailure?: ProxyRuntimeFailureReporter;
}

function getProxyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown";
}

function reportProxyRuntimeFailure(reason: string, error?: unknown): void {
  const errorMessage = getProxyErrorMessage(error);

  captureSentryEvent("auth_runtime_proxy_failed", {
    reason,
    error_message: errorMessage,
  });

  if (process.env.NODE_ENV !== "production") {
    console.error("[auth-runtime] proxy failed", { reason, error: errorMessage });
  }
}

function getAuthUnavailableResponse(): NextResponse {
  return NextResponse.json({ error: AUTH_UNAVAILABLE_ERROR }, { status: 503 });
}

export async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
  dependencies: ProxyDependencies = {},
): Promise<Response> {
  const mode = getAuthMiddlewareMode(request.nextUrl.pathname);
  if (mode === "protected-runtime") {
    const loadClerkProxyHandler =
      dependencies.loadClerkProxyHandler ?? getClerkProxyHandler;
    const reportRuntimeFailure =
      dependencies.reportRuntimeFailure ?? reportProxyRuntimeFailure;

    let clerkProxy: ClerkProxyHandler | null;
    try {
      clerkProxy = await loadClerkProxyHandler();
    } catch (error) {
      reportRuntimeFailure("clerk_proxy_handler_load_failed", error);
      return getAuthUnavailableResponse();
    }

    if (!clerkProxy) {
      reportRuntimeFailure("clerk_proxy_handler_unavailable");
      return getAuthUnavailableResponse();
    }

    try {
      const response = await clerkProxy(request, event);
      return response ?? NextResponse.next();
    } catch (error) {
      reportRuntimeFailure("clerk_proxy_execution_failed", error);
      return getAuthUnavailableResponse();
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
