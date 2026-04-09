---
"@fodmapp/app": patch
---

Force the `/espace/suivi` route to render dynamically so hosted Clerk runtime state is evaluated at request time, and track the Clerk web env contract in Turbo cache keys to avoid stale deployment builds after env-only changes.
