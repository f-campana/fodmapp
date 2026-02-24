import Link from "next/link";
import type { components } from "@fodmap/types";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@fodmap/ui";
import { getMessages } from "../lib/i18n";
import { captureArchitectureEvent } from "../lib/monitoring";

type HealthResponse = components["schemas"]["HealthResponse"];

const HEALTH_CONTRACT_SAMPLE: HealthResponse = {
  status: "ok",
  service: "fodmap-api",
  version: "v0",
};

export default function HomePage() {
  const messages = getMessages();
  captureArchitectureEvent("app_shell_rendered", { route: "/" });

  return (
    <main className="app-shell">
      <div className="app-shell__meta">
        <Badge variant="secondary">{messages.meta.phaseBadge}</Badge>
        <p className="app-shell__status">{messages.meta.localeLabel}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{messages.home.title}</CardTitle>
          <CardDescription>{messages.home.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {messages.home.contractLabel}:{" "}
            <code>
              {HEALTH_CONTRACT_SAMPLE.service}@{HEALTH_CONTRACT_SAMPLE.version}
            </code>
          </p>
          <p className="app-shell__eyebrow">{messages.home.routeNote}</p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/espace">{messages.home.gatedCta}</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
