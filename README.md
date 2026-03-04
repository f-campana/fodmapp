# FODMAPP

Open FODMAP tracking and planning toolkit with API, web app, and design-system packages.

This repository is a public monorepo used to build and operate a practical FODMAP project for household meal planning, experimentation, and long-term product hardening.

## Repository Scope

- `api/`: FastAPI backend and OpenAPI contract (`/v0/*`).
- `apps/app/`: Next.js app scaffold and runtime integrations.
- `apps/storybook/`: component preview and verification stories.
- `packages/ui/`: shared UI component library.
- `packages/design-tokens/`: token source and generated style artifacts.
- `docs/`: architecture decisions, operations runbooks, and plans.

## Getting Started

```bash
pnpm install
./.github/scripts/quality-gate.sh --full
```

## Contribution Model

- Issues are open for public feedback and requests.
- Pull request creation is restricted to approved collaborators.
- If you want to contribute code, open an issue first and we can align on scope.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch, commit, CI, and release expectations.

## Security

Please do not report vulnerabilities in public issues.

See [SECURITY.md](./SECURITY.md) for private reporting and response expectations.

## Documentation

- Docs index: [docs/README.md](./docs/README.md)
- CI/workflow hardening: [docs/ops/ci-workflow-hardening.md](./docs/ops/ci-workflow-hardening.md)
- Environment contract: [infra/ci/ENVIRONMENT.md](./infra/ci/ENVIRONMENT.md)

## License

[MIT](./LICENSE)
