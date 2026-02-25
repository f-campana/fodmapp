import { type NextFetchEvent, NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuthContext } from "../lib/auth";
import { proxy } from "../proxy";

afterEach(() => {
  vi.unstubAllEnvs();
});

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

    const auth = await getAuthContext(
      async () => {
        throw new Error("clerk unavailable");
      },
      reportFailure,
    );

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
});
