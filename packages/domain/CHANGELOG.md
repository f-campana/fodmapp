# @fodmapp/domain

## 0.1.1

### Patch Changes

- [#321](https://github.com/f-campana/fodmapp/pull/321) [`233b84a`](https://github.com/f-campana/fodmapp/commit/233b84a997bf59cf341d5d1da0d7093b95d72ade) Thanks [@dependabot](https://github.com/apps/dependabot)! - Align the build-tooling workspace with TypeScript 6 by adding DTS compiler overrides for the affected packages and updating the workspace dependency set.

- [#322](https://github.com/f-campana/fodmapp/pull/322) [`7a636f6`](https://github.com/f-campana/fodmapp/commit/7a636f651c461ba7e644e253d169a2701fe7bd2c) Thanks [@f-campana](https://github.com/f-campana)! - Add the shared domain package and move app catalog consumers onto domain-backed helpers.

- [#324](https://github.com/f-campana/fodmapp/pull/324) [`636c493`](https://github.com/f-campana/fodmapp/commit/636c493da950b78e9d39c3cb48ac1b4dc922d572) Thanks [@f-campana](https://github.com/f-campana)! - Keep `@fodmapp/domain` rebuilding during `@fodmapp/app` development by replacing the one-shot app prebuild with a watch-backed dev wrapper.

- [#329](https://github.com/f-campana/fodmapp/pull/329) [`1f99277`](https://github.com/f-campana/fodmapp/commit/1f99277823d5d2e2f15210fb8198ef9b7305627f) Thanks [@f-campana](https://github.com/f-campana)! - Preserve explicit null clears in tracking update patches, forward dev CLI args to Next, and keep malformed tracking feed rows from breaking the hub read.

- [#336](https://github.com/f-campana/fodmapp/pull/336) [`9ceabce`](https://github.com/f-campana/fodmapp/commit/9ceabcee333dd3911e910b9a94246509cbef7037) Thanks [@f-campana](https://github.com/f-campana)! - Add default export conditions so Expo and related mobile tooling can resolve the shared packages consistently.

- Updated dependencies [[`0134c2c`](https://github.com/f-campana/fodmapp/commit/0134c2c8f6c996813a0d0b724c5129e1d786dd81), [`52f6f83`](https://github.com/f-campana/fodmapp/commit/52f6f8322b3cf09aeb8bc1224e651723431f77af), [`233b84a`](https://github.com/f-campana/fodmapp/commit/233b84a997bf59cf341d5d1da0d7093b95d72ade), [`7febef3`](https://github.com/f-campana/fodmapp/commit/7febef3ba6d9b42655e8ade50a7c9ecbf8e18288), [`c9ec4eb`](https://github.com/f-campana/fodmapp/commit/c9ec4ebe6b07d06818f949a27af2a577d4d27e14), [`6006bfb`](https://github.com/f-campana/fodmapp/commit/6006bfbb2d6c74f1c9a381412fde3c36ae531d3a), [`56df81f`](https://github.com/f-campana/fodmapp/commit/56df81fd689fc54901da45d8d8dbc748ce3265f0), [`fca296a`](https://github.com/f-campana/fodmapp/commit/fca296a4b2c10edb7c77ed83e033ac0a4af727f0)]:
  - @fodmapp/types@0.1.2
