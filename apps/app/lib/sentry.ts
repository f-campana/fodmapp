import { getServerFeatureFlags, getServerRuntimeEnv } from "./env.server";

export interface SentryBootstrapStatus {
  provider: "sentry";
  mode: "disabled" | "runtime";
  dsnConfigured: boolean;
  dsn: string | null;
  nodeEnv: string;
}

export function getSentryBootstrapStatus(): SentryBootstrapStatus {
  const env = getServerRuntimeEnv();
  const flags = getServerFeatureFlags(env);

  return {
    provider: "sentry",
    mode: flags.sentryConfigured ? "runtime" : "disabled",
    dsnConfigured: flags.sentryConfigured,
    dsn: env.sentryDsnApp,
    nodeEnv: env.nodeEnv,
  };
}

let sentryModulePromise: Promise<
  typeof import("@sentry/nextjs") | null
> | null = null;

async function loadSentryModule(): Promise<
  typeof import("@sentry/nextjs") | null
> {
  if (sentryModulePromise) {
    return sentryModulePromise;
  }

  sentryModulePromise = import("@sentry/nextjs").catch(() => null);
  return sentryModulePromise;
}

export async function initializeSentryBootstrap(): Promise<SentryBootstrapStatus> {
  const status = getSentryBootstrapStatus();
  if (!status.dsnConfigured || !status.dsn) {
    return status;
  }

  const sentry = await loadSentryModule();
  if (!sentry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[sentry-runtime] module load failed, falling back to no-op",
      );
    }
    return status;
  }

  sentry.init({
    dsn: status.dsn,
    environment: status.nodeEnv,
    tracesSampleRate: 0,
    enabled: true,
  });

  if (process.env.NODE_ENV !== "production") {
    console.info("[sentry-runtime] initialized", {
      provider: status.provider,
      mode: status.mode,
      dsnConfigured: status.dsnConfigured,
      nodeEnv: status.nodeEnv,
    });
  }

  return status;
}

async function captureSentryRuntimeEvent(
  event: string,
  attributes: Record<string, string>,
): Promise<void> {
  const status = getSentryBootstrapStatus();
  if (!status.dsnConfigured) {
    return;
  }

  const sentry = await loadSentryModule();
  if (!sentry) {
    return;
  }

  sentry.captureMessage(event, {
    level: "info",
    tags: {
      surface: "apps-app-architecture",
    },
    extra: attributes,
  });
}

export function captureSentryEvent(
  event: string,
  attributes: Record<string, string> = {},
): void {
  if (process.env.NODE_ENV !== "production") {
    console.info("[sentry-runtime] event", event, attributes);
  }

  void captureSentryRuntimeEvent(event, attributes);
}
