import { type NextFetchEvent, NextRequest } from "next/server";

import { afterEach, describe, expect, it, vi } from "vitest";

import { getAuthContext } from "../lib/auth";
import { proxy } from "../proxy";

afterEach(() => {
  vi.unstubAllEnvs();
});

const PREVIEW_USER_ID = "11111111-1111-4111-8111-111111111111";

function configureClerkRuntimeEnv(): void {
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_stub");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_stub");
}

describe("auth runtime hardening", () => {
  it("returns authenticated context when runtime loader succeeds", async () => {
    configureClerkRuntimeEnv();
    const reportFailure = vi.fn();

    const auth = await getAuthContext(
      async () => ({
        auth: async () => ({
          userId: "user_123",
        }),
      }),
      reportFailure,
    );

    expect(auth.state).toBe("authenticated");
    expect(auth.mode).toBe("runtime");
    expect(auth.configured).toBe(true);
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.userId).toBe("user_123");
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it("returns explicit error context when runtime loader fails", async () => {
    configureClerkRuntimeEnv();
    const reportFailure = vi.fn();

    const auth = await getAuthContext(async () => {
      throw new Error("clerk unavailable");
    }, reportFailure);

    expect(auth.state).toBe("error");
    expect(auth.mode).toBe("runtime");
    expect(auth.configured).toBe(true);
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.userId).toBeNull();
    expect(reportFailure).toHaveBeenCalledWith(
      "clerk_auth_context_unavailable",
      expect.any(Error),
    );
  });

  it("returns authenticated preview context when preview auth is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "");
    vi.stubEnv("APP_AUTH_PREVIEW_USER_ID", PREVIEW_USER_ID);
    vi.stubEnv("NODE_ENV", "development");

    const loadAuthModule = vi.fn(async () => ({
      auth: async () => ({
        userId: "user_should_not_load",
      }),
    }));
    const reportFailure = vi.fn();

    const auth = await getAuthContext(loadAuthModule, reportFailure);

    expect(auth.state).toBe("authenticated");
    expect(auth.mode).toBe("preview");
    expect(auth.configured).toBe(true);
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.userId).toBe(PREVIEW_USER_ID);
    expect(loadAuthModule).not.toHaveBeenCalled();
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it("fails closed when preview auth user id is invalid", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "");
    vi.stubEnv("APP_AUTH_PREVIEW_USER_ID", "invalid-preview-user");
    vi.stubEnv("NODE_ENV", "development");

    const loadAuthModule = vi.fn(async () => ({
      auth: async () => ({
        userId: "user_should_not_load",
      }),
    }));
    const reportFailure = vi.fn();

    const auth = await getAuthContext(loadAuthModule, reportFailure);

    expect(auth.state).toBe("placeholder");
    expect(auth.mode).toBe("disabled");
    expect(auth.configured).toBe(false);
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.userId).toBeNull();
    expect(loadAuthModule).not.toHaveBeenCalled();
    expect(reportFailure).toHaveBeenCalledWith(
      "auth_preview_user_invalid",
      expect.any(Error),
    );
  });
});

describe("proxy runtime hardening", () => {
  it("fails closed when protected runtime handler is unavailable", async () => {
    configureClerkRuntimeEnv();
    const reportFailure = vi.fn();
    const request = new NextRequest("https://example.com/espace");

    const response = await proxy(request, {} as NextFetchEvent, {
      loadClerkProxyHandler: async () => null,
      reportRuntimeFailure: reportFailure,
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "service_unavailable",
    });
    expect(reportFailure).toHaveBeenCalledWith(
      "clerk_proxy_handler_unavailable",
    );
  });

  it("fails closed when protected runtime handler throws", async () => {
    configureClerkRuntimeEnv();
    const reportFailure = vi.fn();
    const request = new NextRequest("https://example.com/espace");

    const response = await proxy(request, {} as NextFetchEvent, {
      loadClerkProxyHandler: async () => {
        return async () => {
          throw new Error("handler crashed");
        };
      },
      reportRuntimeFailure: reportFailure,
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "service_unavailable",
    });
    expect(reportFailure).toHaveBeenCalledTimes(1);
    expect(reportFailure.mock.calls[0]?.[0]).toBe(
      "clerk_proxy_execution_failed",
    );
  });

  it("keeps public routes as pass-through", async () => {
    configureClerkRuntimeEnv();
    const reportFailure = vi.fn();
    const request = new NextRequest("https://example.com/");

    const response = await proxy(request, {} as NextFetchEvent, {
      loadClerkProxyHandler: async () => null,
      reportRuntimeFailure: reportFailure,
    });

    expect(response.status).toBe(200);
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it("keeps sign-in route as pass-through", async () => {
    configureClerkRuntimeEnv();
    const reportFailure = vi.fn();
    const request = new NextRequest("https://example.com/sign-in");

    const response = await proxy(request, {} as NextFetchEvent, {
      loadClerkProxyHandler: async () => null,
      reportRuntimeFailure: reportFailure,
    });

    expect(response.status).toBe(200);
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it("keeps sign-up route as pass-through", async () => {
    configureClerkRuntimeEnv();
    const reportFailure = vi.fn();
    const request = new NextRequest("https://example.com/sign-up");

    const response = await proxy(request, {} as NextFetchEvent, {
      loadClerkProxyHandler: async () => null,
      reportRuntimeFailure: reportFailure,
    });

    expect(response.status).toBe(200);
    expect(reportFailure).not.toHaveBeenCalled();
  });
});
