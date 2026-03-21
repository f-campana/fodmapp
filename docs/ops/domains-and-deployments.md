# Domains and deployments

Last reviewed: 2026-03-21

## Production domain map

- `fodmapp.fr`: marketing front door (`apps/marketing`)
- `app.fodmapp.fr`: product app (`apps/app`)
- `ui.fodmapp.fr`: design system / Storybook (`apps/storybook`)
- `lab.fodmapp.fr`: research / reporting site (`apps/research`)
- `api.fodmapp.fr`: planned hosted API origin (Koyeb; not live yet)

## Staging domain map

- `staging.app.fodmapp.fr`: staging app (branch domain → `staging` on `fodmapp-app`)
- `staging.api.fodmapp.fr`: reserved future API origin (not active in this phase)

## Vercel projects

Recommended Vercel project split:

- `fodmapp-marketing` → `apps/marketing` (Next.js)
- `fodmapp-app` → `apps/app` (Next.js)
- `fodmapp-ui` → `apps/storybook` (Storybook)
- `fodmapp-research` → `apps/research` (Astro)

Notes:

- If `fodmapp.fr` is not attached to any Vercel project, it will resolve to a Vercel 404 (`DEPLOYMENT_NOT_FOUND`).
- Subdomains (like `ui.fodmapp.fr`) are independent; moving the apex `fodmapp.fr` does not affect them.

## Vercel project setup (manual)

This repo is a pnpm workspace (monorepo). Create one Vercel project per app, and set the project root directory to the app folder.

Marketing (`fodmapp.fr`):

1. Create/import a Vercel project with root directory `apps/marketing`.
2. Leave Node.js version as **Default** (do not pin).
3. Add domain `fodmapp.fr` and set it as the primary domain.
4. Add `www.fodmapp.fr` and redirect it to `fodmapp.fr` (use `308` once you are confident it is permanent).

App (`app.fodmapp.fr`):

1. Create/import a Vercel project with root directory `apps/app`.
2. Leave Node.js version as **Default** (do not pin).
3. Add domain `app.fodmapp.fr`.

UI / Storybook (`ui.fodmapp.fr`):

- `ui.fodmapp.fr` is owned by the `fodmapp-ui` project.
- Redirect legacy project domains (for example `fodmap-storybook-internal.vercel.app`) to `ui.fodmapp.fr`.

Research (`lab.fodmapp.fr`):

1. Create/import a Vercel project with root directory `apps/research`.
2. Leave Node.js version as **Default** (do not pin).
3. Add domain `lab.fodmapp.fr` and set it as the primary domain.
4. Add `research.fodmapp.fr` as a redirect alias to `lab.fodmapp.fr` (use `308` when you are confident it is permanent).

## DNS authority

`fodmapp.fr` uses Vercel DNS nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).
All DNS records and domain routing should be managed in Vercel.

## API Hosting Plan

The API is planned as a separate Koyeb runtime, not a Vercel app. Vercel remains the DNS authority
for the API subdomain as well as the frontend domains.

Current status:

- `api.fodmapp.fr`: planned canonical hosted API origin
- `staging.api.fodmapp.fr`: reserved future API origin
- neither origin is active in this branch

Current blocker:

- first hosted activation is deferred until the repo has a dedicated initial persistent data
  bootstrap path for Neon

Do not attach the API domains to a live Koyeb service in this phase.

## Redirect / canonicalization

- Keep `ui.fodmapp.fr` as the canonical Storybook URL.
- Redirect legacy Vercel project domains (for example `fodmap-storybook-internal.vercel.app`) to `ui.fodmapp.fr` (use `308` when you are confident it is permanent).
- Add `www.fodmapp.fr` and redirect it to `fodmapp.fr` once the marketing project owns the apex.

## Access policy notes

- Storybook is intentionally **public** (no auth) but is set to **noindex** (`robots.txt` + meta tags).
