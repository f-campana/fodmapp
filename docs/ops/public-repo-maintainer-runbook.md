# Public Repo Maintainer Runbook

Last updated: 2026-03-04

## Scope

Operational checklist for maintaining `f-campana/fodmapp` as a public repository with restricted PR intake.

## Repository Intake Policy

- Issues: enabled for public users.
- Discussions: disabled.
- Pull request creation policy: `collaborators_only`.
- Branch protection and CI gates on `main`: unchanged from ADR-018 hardening.

## Weekly Maintenance Checklist

1. Review new issues and label (`bug`, `enhancement`, `question`).
2. Triage security-sensitive reports out of public issues into private channels.
3. Confirm required branch checks remain stable:
   - `CI`
   - `API`
   - `Changeset PR Gate`
   - `Semantic PR Title`
4. Review Dependabot alerts and dependency update PRs.
5. Verify repository metadata remains accurate:
   - Description
   - Homepage
   - Topics

## Monthly Maintenance Checklist

1. Validate community profile health and missing standards files.
2. Re-verify repo-level access settings:
   - `pull_request_creation_policy=collaborators_only`
   - issues on, discussions off
3. Re-verify security settings:
   - secret scanning enabled
   - push protection enabled
   - dependabot security updates enabled
   - code scanning default setup configured
4. Audit secret scope:
   - no deprecated repo-level CI secrets
   - environment secrets remain least-privilege and rotated

## Security and Abuse Handling

- Vulnerabilities must be reported privately via GitHub Security Advisories.
- Public vulnerability disclosures in issues should be redirected and minimized.
- Code of conduct reports should be handled privately by maintainers.

## Contributor Intake Process

1. Non-collaborators open an issue first.
2. Maintainer validates scope and risk.
3. If approved for direct code contribution, grant collaborator access.
4. Enforce Conventional Commit + semantic PR title + full CI gates.

## Change Management

When CI workflow semantics or CI environment contracts change in future PRs, update in the same PR:

- `docs/ops/ci-workflow-hardening.md`
- `infra/ci/ENVIRONMENT.md`

## Fast Verification Commands

```bash
gh api repos/f-campana/fodmapp -q '{description: .description, homepage: .homepage, has_issues: .has_issues, has_discussions: .has_discussions, pull_request_creation_policy: .pull_request_creation_policy}'
gh api repos/f-campana/fodmapp/topics -H 'Accept: application/vnd.github+json'
gh api repos/f-campana/fodmapp/community/profile -H 'Accept: application/vnd.github+json'
gh api repos/f-campana/fodmapp/actions/permissions/workflow
gh api repos/f-campana/fodmapp/branches/main/protection
```
