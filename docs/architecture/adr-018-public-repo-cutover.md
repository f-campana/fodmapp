# ADR-018: Public Repository Cutover Strategy (`Fodmap` -> `fodmapp`)

## Status

- **Implemented** (2026-03-04)
- Documentation-first sequence completed through:
  - PR-1 decision record merge: #177 (`2026-03-04T14:01:42Z`)
  - PR-2 hardening merge: #178 (`2026-03-04T14:13:31Z`)
- Remote cutover operations executed between `2026-03-04T14:13Z` and `2026-03-04T14:16Z`.
- Residual follow-up: rotate/migrate `VERCEL_*` secret values to `vercel-production` environment, then delete repository-level `VERCEL_*` secrets.

## Context and Current Measured State

As of 2026-03-04, repository `f-campana/Fodmap` is:

- private (`visibility=private`)
- unprotected on `main` (no branch protection/rulesets configured)
- using Actions default workflow permissions set to `write`
- storing repository-level Actions secrets:
  - `TURBO_TEAM`
  - `TURBO_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - `VERCEL_TOKEN`

Observed cost and delivery context:

- project is personal/family-oriented (non-business critical monetization model)
- GitHub Actions minute pressure exists on private-repo quota
- workflows rely primarily on standard GitHub-hosted Ubuntu runners

## Decision Drivers

1. Reduce recurring Actions minute cost pressure.
2. Reduce credential-exposure surface before repository becomes public.
3. Preserve maintainable operations for a single primary maintainer.
4. Keep CI/release behavior deterministic while changing security defaults.
5. Keep rollout reversible with explicit evidence and checkpoints.

## Options Considered

### Option A: Stay private and pay overage

- Pros:
  - no visibility change risk
  - no cutover effort
- Cons:
  - recurring Actions overage spend
  - no simplification of public-collaboration posture

### Option B: Move to Enterprise plan

- Pros:
  - larger included minutes pool
  - enterprise controls
- Cons:
  - over-scoped for current personal project profile
  - materially higher cost and operational overhead for current needs

### Option C: Go public with explicit hardening (selected)

- Pros:
  - aligns with personal project posture
  - removes private-minute quota pressure for standard public-runner usage
  - enforces stronger security/branch governance before exposure
- Cons:
  - requires non-trivial rollout coordination
  - public visibility increases disclosure and abuse surface

## Decision Matrix

| Criterion                                | Option A: Private + Overage | Option B: Enterprise | Option C: Public + Hardening  |
| ---------------------------------------- | --------------------------- | -------------------- | ----------------------------- |
| Actions cost sustainability              | Medium/Low                  | High                 | High                          |
| Security posture fit for public exposure | Medium                      | High                 | High (if hardening completed) |
| Operational simplicity                   | High                        | Low/Medium           | Medium                        |
| Fit for current project scale            | Medium                      | Low                  | High                          |
| Reversibility                            | High                        | Medium               | Medium                        |

Selected: **Option C**.

## Final Locked Decisions

1. Rename repository from `Fodmap` to `fodmapp`.
2. Apply strict `main` branch gate with admin bypass retained.
3. Disable Storybook pull-request preview deploy lane.
4. Move Vercel deployment secrets to environment-gated production lane.
5. Remove `TURBO_TEAM` / `TURBO_TOKEN` repository secrets.

## Rollout Sequence Rationale

Execution order is intentionally documentation-first:

1. **PR-1 (this decision record + runbook contract updates):**
   - lock intent and acceptance criteria before mutations
2. **PR-2 (workflow and contract hardening):**
   - make CI/release behavior compatible with safer defaults
3. **Remote cutover operations:**
   - configure environment, branch protection, security toggles, rename, and public visibility
4. **PR-3 (evidence and closure):**
   - capture timestamps, command evidence, and final status transitions

This sequence minimizes accidental drift between declared policy and implementation.

## Execution Evidence (PR-3)

### Remote state evidence (post-cutover)

- Repository state (`gh api repos/f-campana/fodmapp`):
  - `full_name=f-campana/fodmapp`
  - `visibility=public` / `private=false`
  - `default_branch=main`
- Actions workflow defaults (`gh api repos/f-campana/fodmapp/actions/permissions/workflow`):
  - `default_workflow_permissions=read`
  - `can_approve_pull_request_reviews=true`
- Branch protection (`gh api repos/f-campana/fodmapp/branches/main/protection`):
  - strict status checks: `CI`, `API`, `Changeset PR Gate`, `Semantic PR Title`
  - required approvals: `1`
  - conversation resolution: enabled
  - force push/deletion: disabled
  - admin enforcement: disabled (admin bypass retained)
- Environment protection (`gh api repos/f-campana/fodmapp/environments/vercel-production`):
  - `required_reviewers` includes `f-campana`
  - deployment policy: protected branches only
- Security toggles:
  - `secret_scanning=enabled`
  - `secret_scanning_push_protection=enabled`
  - `dependabot_security_updates=enabled`
  - code scanning default setup `state=configured`
- Repository secrets (`gh secret list -R f-campana/fodmapp`):
  - `TURBO_TEAM` and `TURBO_TOKEN`: removed
  - `VERCEL_*`: still present pending value migration to environment secrets
- URL/remote verification:
  - old URL redirects: `https://github.com/f-campana/Fodmap` -> `https://github.com/f-campana/fodmapp`
  - local `origin`: `https://github.com/f-campana/fodmapp.git`

## Rollback Criteria and Contingencies

### Abort criteria during rollout

- quality gate fails and cannot be remediated within cutover window
- required checks become non-deterministic or block merge unexpectedly
- production Storybook deploy cannot run with environment gating

### Rollback actions

1. Keep repository private (do not execute visibility change).
2. Revert workflow hardening PR if release/deploy path is disrupted.
3. Reintroduce repository-level Vercel secrets temporarily if environment wiring fails.
4. If rename already executed and causes operational blockers:
   - keep renamed slug `fodmapp`
   - immediately update all local/remotes/integrations to new path
   - do not reuse old slug

## Residual Risks

1. Single-maintainer model with strict review requirement relies on admin bypass.
2. Public visibility increases unsolicited contribution/abuse handling load.
3. External references to old repository slug may lag after rename.
4. If security toggles are partially applied, risk posture may be inconsistent.

## Verification Evidence Checklist (to complete in PR-3)

- [x] repository visibility is `public`
- [x] repository slug is `f-campana/fodmapp`
- [x] default Actions workflow permission is `read`
- [x] `main` branch protection is active with intended gates
- [x] repo-level `TURBO_*` secrets removed
- [ ] repo-level `VERCEL_*` secrets removed (pending value migration)
- [ ] `vercel-production` environment has required `VERCEL_*` secrets (pending value migration); approval gate is configured
- [x] Storybook PR preview lane removed
- [x] Storybook production lane uses `vercel-production` environment approval
- [x] Changesets preflight supports read-default token policy (implemented in PR-2)
