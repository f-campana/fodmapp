# FODMAPP

FODMAPP is a documentation-first, evidence-backed platform-in-construction for low-FODMAP
self-management support, combining scientific data workflows, a read-only API, frontend
foundations, and mobile prototypes in one monorepo.

This repository is public, worktree-driven, and conservative in what it claims today. Its current
strength is the evidence-to-product delivery system: Phase 2 and Phase 3 data workflows, a stable
serving contract, shared frontend foundations, and documented operational governance. Some product
surfaces are active scaffolds or prototypes rather than launched end-user experiences.

## Start Here

| If you want to...                             | Go to                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Understand the repo documentation map         | [docs/README.md](./docs/README.md)                                                                                                                                                               |
| Understand project identity and docs canon    | [docs/foundation/README.md](./docs/foundation/README.md)                                                                                                                                         |
| Install dependencies and run baseline checks  | [Quick start](#quick-start)                                                                                                                                                                      |
| Contribute changes                            | [CONTRIBUTING.md](./CONTRIBUTING.md)                                                                                                                                                             |
| Work on the API and generated contract        | [api/README.md](./api/README.md) and [packages/types/README.md](./packages/types/README.md)                                                                                                      |
| Work on the app and UI foundations            | [apps/app/README.md](./apps/app/README.md) and [packages/ui/README.md](./packages/ui/README.md)                                                                                                  |
| Operate ETL and product-layer flows           | [etl/phase2/POD_WAVES_RUNBOOK.md](./etl/phase2/POD_WAVES_RUNBOOK.md) and [etl/phase3/PRODUCT_LAYER_RUNBOOK.md](./etl/phase3/PRODUCT_LAYER_RUNBOOK.md)                                            |
| Review CI, env, and worktree contracts        | [docs/ops/ci-workflow-hardening.md](./docs/ops/ci-workflow-hardening.md), [infra/ci/ENVIRONMENT.md](./infra/ci/ENVIRONMENT.md), and [docs/ops/worktree-status.md](./docs/ops/worktree-status.md) |
| Track architecture decisions and system rules | [docs/architecture/decision-register.md](./docs/architecture/decision-register.md) and [docs/architecture/boundaries-and-contracts.md](./docs/architecture/boundaries-and-contracts.md)          |

## Quick Start

Runtime baseline:

- Node.js `>=22`
- `pnpm`
- `python3` and `uv` when working on the API or reporting or ETL surfaces
- local Postgres when running API integration or ETL flows

Install workspace dependencies:

```bash
pnpm install
```

Run the repository governance baseline:

```bash
./.github/scripts/quality-gate.sh
```

Before requesting merge or pushing substantial changes, run the full local gate:

```bash
./.github/scripts/quality-gate.sh --full
```

Common workspace commands:

```bash
pnpm app:dev
pnpm storybook
pnpm test
pnpm typecheck
pnpm build
```

Subsystem-specific setup and runtime instructions live in the linked README and runbook files
above.

## Repository Map

- `api/`: FastAPI v0 service and OpenAPI contract.
- `apps/app/`: Next.js app scaffold and runtime integration seams.
- `apps/marketing/`: marketing site content scaffold.
- `apps/research/`: research content scaffold.
- `apps/mobile-prototype/`: mobile prototype track.
- `apps/storybook/`: component preview and verification workspace.
- `packages/ui/`: shared React component library.
- `packages/design-tokens/`: source tokens and generated style artifacts.
- `packages/tailwind-config/`: shared Tailwind contract.
- `packages/types/`: generated TypeScript types from `api/openapi/v0.yaml`.
- `etl/`: Phase 2 reporting and Phase 3 product-layer workflows.
- `docs/`: architecture decisions, plans, transition guidance, operations runbooks, and
  foundation canon.

## Contribution Model

- Issues are open for public feedback and requests.
- Pull request creation is restricted to approved collaborators.
- Non-collaborators should open an issue first so scope and risk can be aligned before code work.

Branching, commit, CI, changeset, and merge expectations are defined in
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Please do not report vulnerabilities in public issues.

Private reporting and response expectations are defined in [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
