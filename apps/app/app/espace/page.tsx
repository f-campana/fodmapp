import Link from "next/link";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@fodmap/ui";
import { getAuthContext } from "../../lib/auth";
import { getMessages } from "../../lib/i18n";
import { captureArchitectureEvent } from "../../lib/monitoring";

export default async function EspacePage() {
  const messages = getMessages();
  const auth = await getAuthContext();
  captureArchitectureEvent("gated_placeholder_rendered", {
    route: "/espace",
    auth_state: auth.state,
  });

  return (
    <main className="app-shell">
      <Badge variant="outline">{messages.gated.authStateLabel}: {auth.state}</Badge>
      <Card>
        <CardHeader>
          <CardTitle>{messages.gated.title}</CardTitle>
          <CardDescription>{messages.gated.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            Provider placeholder: <code>{auth.provider}</code>
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
