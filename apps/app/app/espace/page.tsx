import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fodmap/ui";
import { AnalyticsPageView } from "../../components/analytics-page-view";
import { getAnalyticsBootstrapStatus } from "../../lib/analytics";
import {
  canTrackWithConsent,
  getConsentBootstrapStatus,
} from "../../lib/consent";
import { getAuthContext } from "../../lib/auth";
import { getMessages } from "../../lib/i18n";
import { captureArchitectureEvent } from "../../lib/monitoring";

export default async function EspacePage() {
  const messages = getMessages();
  const auth = await getAuthContext();
  const analytics = getAnalyticsBootstrapStatus();
  const consent = getConsentBootstrapStatus();
  const analyticsAllowed = canTrackWithConsent(consent) && analytics.configured;

  captureArchitectureEvent("gated_placeholder_rendered", {
    route: "/espace",
    auth_state: auth.state,
    auth_configured: String(auth.configured),
    analytics_allowed: String(analyticsAllowed),
  });

  return (
    <main className="app-shell">
      <AnalyticsPageView
        enabled={analyticsAllowed}
        event="gated_placeholder_viewed"
        route="/espace"
      />
      <Badge variant="outline">
        {messages.gated.authStateLabel}: {auth.state}
      </Badge>
      <Card>
        <CardHeader>
          <CardTitle>{messages.gated.title}</CardTitle>
          <CardDescription>{messages.gated.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            Provider placeholder: <code>{auth.provider}</code>
          </p>
          <p className="app-shell__eyebrow">
            {messages.gated.authModeLabel}: <code>{auth.mode}</code>
          </p>
          <p className="app-shell__eyebrow">
            {messages.gated.authConfiguredLabel}:{" "}
            <code>{String(auth.configured)}</code>
          </p>
          <p className="app-shell__eyebrow">
            {messages.gated.consentLabel}:{" "}
            <code>{String(analyticsAllowed)}</code>
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="secondary">
            <Link href="/">{messages.gated.backHome}</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
