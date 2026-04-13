# @fodmapp/app

## 0.1.27

### Patch Changes

- [#289](https://github.com/f-campana/fodmapp/pull/289) [`d5a8df5`](https://github.com/f-campana/fodmapp/commit/d5a8df5d0f99ace149650d2be49c5af8b5a0d86b) Thanks [@f-campana](https://github.com/f-campana)! - Align the app frontend shell with the marketing baseline, including route-level layout styling, product-facing homepage framing, and polished account/auth fallback presentation.

- [#296](https://github.com/f-campana/fodmapp/pull/296) [`70f9bdc`](https://github.com/f-campana/fodmapp/commit/70f9bdc60c50a6847fcf01d833b3e9975e83c3ee) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore: bump mobile runtime dependencies and refresh css typings

- [#239](https://github.com/f-campana/fodmapp/pull/239) [`6efb34b`](https://github.com/f-campana/fodmapp/commit/6efb34b21aee2c2fffadd09027da12cd38ebbf7c) Thanks [@f-campana](https://github.com/f-campana)! - Add the first live app product slice for foods, swaps, and safe-harbor browsing, and split `@fodmapp/ui` into explicit server and client entrypoints for App Router-safe consumption.

- [#301](https://github.com/f-campana/fodmapp/pull/301) [`630e41f`](https://github.com/f-campana/fodmapp/commit/630e41f888a7780e2e09e53ca9b6b685761665ed) Thanks [@f-campana](https://github.com/f-campana)! - Fix README metadata headers to render as separate lines in GitHub.

- [#328](https://github.com/f-campana/fodmapp/pull/328) [`dc390da`](https://github.com/f-campana/fodmapp/commit/dc390dafcd6335461e84385746fdf78dd2639f17) Thanks [@f-campana](https://github.com/f-campana)! - Normalize tracking hub saved meal create and update submissions through
  `@fodmapp/domain` drafts while keeping the raw tracking transport layer in
  place.

- [#334](https://github.com/f-campana/fodmapp/pull/334) [`2d97234`](https://github.com/f-campana/fodmapp/commit/2d9723478b28fd3aadd18ac055c5ab31237227ef) Thanks [@f-campana](https://github.com/f-campana)! - feat(api-client): extract protected tracking write client

- [#321](https://github.com/f-campana/fodmapp/pull/321) [`233b84a`](https://github.com/f-campana/fodmapp/commit/233b84a997bf59cf341d5d1da0d7093b95d72ade) Thanks [@dependabot](https://github.com/apps/dependabot)! - Align the build-tooling workspace with TypeScript 6 by adding DTS compiler overrides for the affected packages and updating the workspace dependency set.

- [#283](https://github.com/f-campana/fodmapp/pull/283) [`7febef3`](https://github.com/f-campana/fodmapp/commit/7febef3ba6d9b42655e8ade50a7c9ecbf8e18288) Thanks [@f-campana](https://github.com/f-campana)! - Add the Symptoms Tracking V1 web flow, preview-auth local validation mode, and generated tracking API types.

- [#352](https://github.com/f-campana/fodmapp/pull/352) [`789358c`](https://github.com/f-campana/fodmapp/commit/789358c5d88008d5474b1ea8dd1fb41d9083c2d4) Thanks [@f-campana](https://github.com/f-campana)! - Stabilize the web app's public and account surfaces by fixing shared card/button rendering issues, clarifying runtime-auth deployment failures, and improving catalog fallback trust states.

- [#286](https://github.com/f-campana/fodmapp/pull/286) [`c9ec4eb`](https://github.com/f-campana/fodmapp/commit/c9ec4ebe6b07d06818f949a27af2a577d4d27e14) Thanks [@f-campana](https://github.com/f-campana)! - Add app-hosted Clerk sign-in and sign-up routes, bearer-authenticated account and tracking API access, and the generated contract types for the protected auth flow.

- [#246](https://github.com/f-campana/fodmapp/pull/246) [`b9a6a29`](https://github.com/f-campana/fodmapp/commit/b9a6a29b48b927e5298acdc7569c145088dc400a) Thanks [@f-campana](https://github.com/f-campana)! - Hide raw backend state from public food detail pages, extract shared food-level formatting, and document the absolute API-base requirement for server-rendered app routes.

- [#353](https://github.com/f-campana/fodmapp/pull/353) [`c967728`](https://github.com/f-campana/fodmapp/commit/c96772823b54e1aa76b06466b188128514fcfbbb) Thanks [@f-campana](https://github.com/f-campana)! - Force the `/espace/suivi` route to render dynamically so hosted Clerk runtime state is evaluated at request time, and track the Clerk web env contract in Turbo cache keys to avoid stale deployment builds after env-only changes.

- [#322](https://github.com/f-campana/fodmapp/pull/322) [`7a636f6`](https://github.com/f-campana/fodmapp/commit/7a636f651c461ba7e644e253d169a2701fe7bd2c) Thanks [@f-campana](https://github.com/f-campana)! - Add the shared domain package and move app catalog consumers onto domain-backed helpers.

- [#332](https://github.com/f-campana/fodmapp/pull/332) [`afa33d5`](https://github.com/f-campana/fodmapp/commit/afa33d5afab517c0f113710b38e0fe314d8d1fe1) Thanks [@f-campana](https://github.com/f-campana)! - Extract the first production-grade `@fodmapp/api-client` package for domain-backed public catalog reads and move the app's foods search/detail plus swaps flows onto that shared client boundary.

- [#259](https://github.com/f-campana/fodmapp/pull/259) [`ae1fb81`](https://github.com/f-campana/fodmapp/commit/ae1fb81a07570997a6db23c398a1b2a23cab3e62) Thanks [@f-campana](https://github.com/f-campana)! - Import `@fodmapp/tailwind-config/foundation.css` explicitly in both apps so Tailwind-based consumers own the shared styling foundation directly.

- [#330](https://github.com/f-campana/fodmapp/pull/330) [`43fcb26`](https://github.com/f-campana/fodmapp/commit/43fcb268992fd5430a1f8d3c63c3c722ac8a7d55) Thanks [@f-campana](https://github.com/f-campana)! - Normalize tracking hub custom food create and update submissions through
  `@fodmapp/domain` drafts while keeping the raw tracking transport layer in
  place.

- [#333](https://github.com/f-campana/fodmapp/pull/333) [`b751423`](https://github.com/f-campana/fodmapp/commit/b75142370458be74d7376dbaf309ad891c9e0f3d) Thanks [@f-campana](https://github.com/f-campana)! - feat(api-client): extract protected tracking read client

- [#324](https://github.com/f-campana/fodmapp/pull/324) [`636c493`](https://github.com/f-campana/fodmapp/commit/636c493da950b78e9d39c3cb48ac1b4dc922d572) Thanks [@f-campana](https://github.com/f-campana)! - Keep `@fodmapp/domain` rebuilding during `@fodmapp/app` development by replacing the one-shot app prebuild with a watch-backed dev wrapper.

- [#329](https://github.com/f-campana/fodmapp/pull/329) [`1f99277`](https://github.com/f-campana/fodmapp/commit/1f99277823d5d2e2f15210fb8198ef9b7305627f) Thanks [@f-campana](https://github.com/f-campana)! - Preserve explicit null clears in tracking update patches, forward dev CLI args to Next, and keep malformed tracking feed rows from breaking the hub read.

- [#326](https://github.com/f-campana/fodmapp/pull/326) [`b9405ba`](https://github.com/f-campana/fodmapp/commit/b9405ba1cfdcccaeb72146b8ba3e429368d3870d) Thanks [@f-campana](https://github.com/f-campana)! - Normalize the tracking hub symptom create and update submissions through
  `@fodmapp/domain` drafts while keeping the raw tracking transport layer in
  place.

- [#294](https://github.com/f-campana/fodmapp/pull/294) [`36fbe10`](https://github.com/f-campana/fodmapp/commit/36fbe1028a1af242269aa388bcca8c3db963c951) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore: bump next stack dependencies

- [#241](https://github.com/f-campana/fodmapp/pull/241) [`0d7a072`](https://github.com/f-campana/fodmapp/commit/0d7a07269c88f0c78563000dc607292167b4b147) Thanks [@f-campana](https://github.com/f-campana)! - Refactor the shared UI and reporting package surfaces for better tree shaking, move consumers to leaf imports, split UI CSS into app and full-library entry points, and add local bundle analysis tooling for the app, Storybook, and static sites.

- [#238](https://github.com/f-campana/fodmapp/pull/238) [`6006bfb`](https://github.com/f-campana/fodmapp/commit/6006bfbb2d6c74f1c9a381412fde3c36ae531d3a) Thanks [@f-campana](https://github.com/f-campana)! - Rename the internal workspace package scope from `@fodmap/*` to `@fodmapp/*` and align tooling, docs, and release metadata with the settled project name.

- [#335](https://github.com/f-campana/fodmapp/pull/335) [`a638dec`](https://github.com/f-campana/fodmapp/commit/a638dec27a0a63a8abfa91135e5aa9c7c954c8dd) Thanks [@f-campana](https://github.com/f-campana)! - feat(api-client): complete tracking client cleanup

- [#325](https://github.com/f-campana/fodmapp/pull/325) [`cf2e2f3`](https://github.com/f-campana/fodmapp/commit/cf2e2f33e4bad72e7b56ec3e3bb00a5783b1bb1d) Thanks [@f-campana](https://github.com/f-campana)! - Normalize the tracking hub feed and weekly summary read models through
  `@fodmapp/domain` while keeping tracking mutations unchanged.

- [#288](https://github.com/f-campana/fodmapp/pull/288) [`fca296a`](https://github.com/f-campana/fodmapp/commit/fca296a4b2c10edb7c77ed83e033ac0a4af727f0) Thanks [@f-campana](https://github.com/f-campana)! - Regenerate the published API types for the Phase 3 publish-boundary rollout, including additive health metadata for the current release, and align the app bootstrap sample with the regenerated health contract.

- [#245](https://github.com/f-campana/fodmapp/pull/245) [`f08d969`](https://github.com/f-campana/fodmapp/commit/f08d969c0e5909189660344f292c282469a3eb2e) Thanks [@f-campana](https://github.com/f-campana)! - Refresh the app package docs to reflect the live web slice, add a local validation runbook, and align local health checks to the canonical `/v0/health` endpoint.

- [#296](https://github.com/f-campana/fodmapp/pull/296) [`70f9bdc`](https://github.com/f-campana/fodmapp/commit/70f9bdc60c50a6847fcf01d833b3e9975e83c3ee) Thanks [@dependabot](https://github.com/apps/dependabot)! - fix: add app css declaration coverage

- [#327](https://github.com/f-campana/fodmapp/pull/327) [`aa688cd`](https://github.com/f-campana/fodmapp/commit/aa688cd164f610268c7c4c428b5d667780343b73) Thanks [@f-campana](https://github.com/f-campana)! - Normalize tracking hub meal create and update submissions through
  `@fodmapp/domain` drafts while keeping the raw tracking transport layer in
  place.
- Updated dependencies [[`13e0cb8`](https://github.com/f-campana/fodmapp/commit/13e0cb8bbcf31bcb53dda1edc73e2898831f6e4e), [`0134c2c`](https://github.com/f-campana/fodmapp/commit/0134c2c8f6c996813a0d0b724c5129e1d786dd81), [`6efb34b`](https://github.com/f-campana/fodmapp/commit/6efb34b21aee2c2fffadd09027da12cd38ebbf7c), [`0a7f8fa`](https://github.com/f-campana/fodmapp/commit/0a7f8faa21cdcd0e69f2ddd7b57c01fb7050845a), [`52f6f83`](https://github.com/f-campana/fodmapp/commit/52f6f8322b3cf09aeb8bc1224e651723431f77af), [`2d97234`](https://github.com/f-campana/fodmapp/commit/2d9723478b28fd3aadd18ac055c5ab31237227ef), [`1ae3b04`](https://github.com/f-campana/fodmapp/commit/1ae3b04658170422018cf490f4aa0e3cc6e60c08), [`6f0857e`](https://github.com/f-campana/fodmapp/commit/6f0857e89e7a713eebc8c0479272fc40b54e57f9), [`233b84a`](https://github.com/f-campana/fodmapp/commit/233b84a997bf59cf341d5d1da0d7093b95d72ade), [`d4ec016`](https://github.com/f-campana/fodmapp/commit/d4ec0163a3dcfad213ac88a3a135a08eb4d9ead0), [`7febef3`](https://github.com/f-campana/fodmapp/commit/7febef3ba6d9b42655e8ade50a7c9ecbf8e18288), [`789358c`](https://github.com/f-campana/fodmapp/commit/789358c5d88008d5474b1ea8dd1fb41d9083c2d4), [`c9ec4eb`](https://github.com/f-campana/fodmapp/commit/c9ec4ebe6b07d06818f949a27af2a577d4d27e14), [`e69bfd7`](https://github.com/f-campana/fodmapp/commit/e69bfd74e4b53734d12bfbb24b4107d803b98023), [`0ecfdc2`](https://github.com/f-campana/fodmapp/commit/0ecfdc2806da4445f7ef69b9119ab2ec60aef026), [`7a636f6`](https://github.com/f-campana/fodmapp/commit/7a636f651c461ba7e644e253d169a2701fe7bd2c), [`afa33d5`](https://github.com/f-campana/fodmapp/commit/afa33d5afab517c0f113710b38e0fe314d8d1fe1), [`b751423`](https://github.com/f-campana/fodmapp/commit/b75142370458be74d7376dbaf309ad891c9e0f3d), [`3b13957`](https://github.com/f-campana/fodmapp/commit/3b13957832be7d9637caa21f5d4e474bc9b2dc4d), [`636c493`](https://github.com/f-campana/fodmapp/commit/636c493da950b78e9d39c3cb48ac1b4dc922d572), [`1f99277`](https://github.com/f-campana/fodmapp/commit/1f99277823d5d2e2f15210fb8198ef9b7305627f), [`c8564dd`](https://github.com/f-campana/fodmapp/commit/c8564dd2c7e251274775102796b6ee158b1c4975), [`0d7a072`](https://github.com/f-campana/fodmapp/commit/0d7a07269c88f0c78563000dc607292167b4b147), [`6006bfb`](https://github.com/f-campana/fodmapp/commit/6006bfbb2d6c74f1c9a381412fde3c36ae531d3a), [`56df81f`](https://github.com/f-campana/fodmapp/commit/56df81fd689fc54901da45d8d8dbc748ce3265f0), [`a638dec`](https://github.com/f-campana/fodmapp/commit/a638dec27a0a63a8abfa91135e5aa9c7c954c8dd), [`fca296a`](https://github.com/f-campana/fodmapp/commit/fca296a4b2c10edb7c77ed83e033ac0a4af727f0), [`9ceabce`](https://github.com/f-campana/fodmapp/commit/9ceabcee333dd3911e910b9a94246509cbef7037), [`1e7289e`](https://github.com/f-campana/fodmapp/commit/1e7289eed1de289a0f4729ad88eacee24dd1f6f6), [`978dd90`](https://github.com/f-campana/fodmapp/commit/978dd9028e4c14a016fdbd4f70beccf6f63637d3), [`4ad9a9d`](https://github.com/f-campana/fodmapp/commit/4ad9a9db356322e8bd4bd8a080cbae9645d796ba), [`c23babd`](https://github.com/f-campana/fodmapp/commit/c23babdd8dab58d8dc07698eace0f575defb6230)]:
  - @fodmapp/ui@3.13.3
  - @fodmapp/types@0.1.2
  - @fodmapp/api-client@0.1.1
  - @fodmapp/tailwind-config@0.2.6
  - @fodmapp/domain@0.1.1

## 0.1.26

### Patch Changes

- [#194](https://github.com/f-campana/fodmapp/pull/194) [`be2d2a4`](https://github.com/f-campana/fodmapp/commit/be2d2a4762a51a01ac4841677d60eecfb9bbab32) Thanks [@f-campana](https://github.com/f-campana)! - Align the app README with the repository documentation metadata contract and canonical routing model.

## 0.1.25

### Patch Changes

- Updated dependencies [[`d1014e3`](https://github.com/f-campana/fodmapp/commit/d1014e384c3c5237332af28c9a72564fd36febfc)]:
  - @fodmap/ui@3.13.2

## 0.1.24

### Patch Changes

- Updated dependencies []:
  - @fodmap/ui@3.13.1

## 0.1.23

### Patch Changes

- Updated dependencies [[`570a2b8`](https://github.com/f-campana/Fodmap/commit/570a2b8456b2cf4593cfdab14efd8311edec6133)]:
  - @fodmap/ui@3.13.0

## 0.1.22

### Patch Changes

- [#165](https://github.com/f-campana/Fodmap/pull/165) [`3c3f276`](https://github.com/f-campana/Fodmap/commit/3c3f276ec3ba9f3bdbea50e7af46cd8e4ee1e0da) Thanks [@f-campana](https://github.com/f-campana)! - Add `cmdk` to `serverExternalPackages` for Next.js server runtime compatibility with the expanded `@fodmap/ui` external surface.

- Updated dependencies [[`4b6c99e`](https://github.com/f-campana/Fodmap/commit/4b6c99eff3cdc1fa3a01040f6f625873b4b7f036), [`97111e2`](https://github.com/f-campana/Fodmap/commit/97111e218b14ad5caf8285f08a2c7916ea44c538), [`d677f5f`](https://github.com/f-campana/Fodmap/commit/d677f5f24cb17d6c2129bc3ac68eee5214701357)]:
  - @fodmap/ui@3.12.0

## 0.1.21

### Patch Changes

- [#161](https://github.com/f-campana/Fodmap/pull/161) [`26f89e7`](https://github.com/f-campana/Fodmap/commit/26f89e713cabfb3a4a6715f75ed1b95860a8d4db) Thanks [@f-campana](https://github.com/f-campana)! - Add batch E forms primitives in `@fodmap/ui`: `Accordion`, `InputGroup`, and `InputOTP` with full compound exports and semantic style contracts.

  Add Storybook coverage and interaction assertions for the new form primitives in `@fodmap/storybook`.

- Updated dependencies [[`26f89e7`](https://github.com/f-campana/Fodmap/commit/26f89e713cabfb3a4a6715f75ed1b95860a8d4db)]:
  - @fodmap/ui@3.11.0

## 0.1.20

### Patch Changes

- Updated dependencies [[`3038044`](https://github.com/f-campana/Fodmap/commit/30380442388ac8f46cdd13ff97266a2bf6313507)]:
  - @fodmap/ui@3.10.0

## 0.1.19

### Patch Changes

- Updated dependencies [[`d90543c`](https://github.com/f-campana/Fodmap/commit/d90543c9ccbbfddc42fa60748c21746c2e5af474)]:
  - @fodmap/ui@3.9.0

## 0.1.18

### Patch Changes

- Updated dependencies [[`4452a07`](https://github.com/f-campana/Fodmap/commit/4452a07e881e5b89902e4a786a5c8162f5a97c7e)]:
  - @fodmap/ui@3.8.0

## 0.1.17

### Patch Changes

- Updated dependencies [[`45c9849`](https://github.com/f-campana/Fodmap/commit/45c98496d4cf902c6652760ed7933dc19303de6b)]:
  - @fodmap/ui@3.7.0

## 0.1.16

### Patch Changes

- Updated dependencies [[`3a21931`](https://github.com/f-campana/Fodmap/commit/3a21931680f8a9e0d7cdc71f8a7ccc9d9d7e17bb)]:
  - @fodmap/ui@3.6.0

## 0.1.15

### Patch Changes

- Updated dependencies [[`53d85d5`](https://github.com/f-campana/Fodmap/commit/53d85d527e8b34fbbe86266419ad1133dcf2c9c4)]:
  - @fodmap/ui@3.5.0

## 0.1.14

### Patch Changes

- Updated dependencies [[`c4ee358`](https://github.com/f-campana/Fodmap/commit/c4ee358e1f9658c75d5438da38466c129832d7d3)]:
  - @fodmap/ui@3.4.0

## 0.1.13

### Patch Changes

- Updated dependencies [[`2b7105a`](https://github.com/f-campana/Fodmap/commit/2b7105a767df8c673e62298a4d4f53834aa3b826), [`15a192b`](https://github.com/f-campana/Fodmap/commit/15a192be2d16a1cc90f38261259f64bf1f9c3b84)]:
  - @fodmap/ui@3.3.0

## 0.1.12

### Patch Changes

- Updated dependencies [[`ea84a38`](https://github.com/f-campana/Fodmap/commit/ea84a3894c8ab0dd2e623e2ee9cfffb4351317e6)]:
  - @fodmap/ui@3.2.0

## 0.1.11

### Patch Changes

- Updated dependencies [[`82583ee`](https://github.com/f-campana/Fodmap/commit/82583eeffc3f00491aa58697332542caa16dfe67)]:
  - @fodmap/ui@3.1.0

## 0.1.10

### Patch Changes

- [#134](https://github.com/f-campana/Fodmap/pull/134) [`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0) Thanks [@f-campana](https://github.com/f-campana)! - Expand the semantic color contract (validation, outline/ghost actions, status subtle, and data roles), migrate UI primitives to strict token-only classes, and adopt reporting/app/research updates to remove remaining hardcoded/alpha color patterns.

- Updated dependencies [[`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0)]:
  - @fodmap/ui@3.0.0

## 0.1.9

### Patch Changes

- Updated dependencies [[`77c73ce`](https://github.com/f-campana/Fodmap/commit/77c73cef2ecd1959dd71d0b2cdf39378e1231e6b)]:
  - @fodmap/ui@2.0.0

## 0.1.8

### Patch Changes

- [#89](https://github.com/f-campana/Fodmap/pull/89) [`707e6f0`](https://github.com/f-campana/Fodmap/commit/707e6f07e97217d981a27f4364fdd6e99cf178e5) Thanks [@f-campana](https://github.com/f-campana)! - Enforce authenticated-only rights access on `/espace`, keep analytics fail-closed, and tighten FR/EN copy runtime behavior for the iOS pilot phase.

## 0.1.7

### Patch Changes

- Updated dependencies [[`1779d31`](https://github.com/f-campana/Fodmap/commit/1779d31fe4a036dc325a89964400512ad1f7f388)]:
  - @fodmap/ui@1.0.4

## 0.1.6

### Patch Changes

- Updated dependencies [[`aa225ca`](https://github.com/f-campana/Fodmap/commit/aa225ca3e92b2f4ad23be0f93525d32a516c2852)]:
  - @fodmap/ui@1.0.3

## 0.1.5

### Patch Changes

- Updated dependencies []:
  - @fodmap/ui@1.0.2

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @fodmap/ui@1.0.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`aff8644`](https://github.com/f-campana/Fodmap/commit/aff8644c75859f2bdce1ae6a8726b724ded82fd4)]:
  - @fodmap/types@0.1.1

## 0.1.2

### Patch Changes

- [#80](https://github.com/f-campana/Fodmap/pull/80) [`2fa62cb`](https://github.com/f-campana/Fodmap/commit/2fa62cb0b8275ee86dd4ecfc41966eff854beb3d) Thanks [@f-campana](https://github.com/f-campana)! - Add local pre-push quality enforcement requiring `./.github/scripts/quality-gate.sh --full`, plus documentation updates for governance workflow.

## 0.1.1

### Patch Changes

- Updated dependencies [7528be8]
- Updated dependencies [7528be8]
- Updated dependencies [412419b]
  - @fodmap/ui@1.0.0
