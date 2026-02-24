import { initializeSentryBootstrap } from "./lib/sentry";

export async function register(): Promise<void> {
  initializeSentryBootstrap();
}
