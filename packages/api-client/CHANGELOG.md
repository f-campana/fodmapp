# @fodmapp/api-client

## 0.1.1

### Patch Changes

- [#334](https://github.com/f-campana/fodmapp/pull/334) [`2d97234`](https://github.com/f-campana/fodmapp/commit/2d9723478b28fd3aadd18ac055c5ab31237227ef) Thanks [@f-campana](https://github.com/f-campana)! - feat(api-client): extract protected tracking write client

- [#349](https://github.com/f-campana/fodmapp/pull/349) [`d4ec016`](https://github.com/f-campana/fodmapp/commit/d4ec0163a3dcfad213ac88a3a135a08eb4d9ead0) Thanks [@f-campana](https://github.com/f-campana)! - Add protected mobile tracking consent gating and minimal consent client helpers.

- [#343](https://github.com/f-campana/fodmapp/pull/343) [`e69bfd7`](https://github.com/f-campana/fodmapp/commit/e69bfd74e4b53734d12bfbb24b4107d803b98023) Thanks [@f-campana](https://github.com/f-campana)! - Allow protected client calls to accept a direct bearer token or token getter, so mobile auth shells can attach Clerk session tokens without extra wrapper types.

- [#332](https://github.com/f-campana/fodmapp/pull/332) [`afa33d5`](https://github.com/f-campana/fodmapp/commit/afa33d5afab517c0f113710b38e0fe314d8d1fe1) Thanks [@f-campana](https://github.com/f-campana)! - Extract the first production-grade `@fodmapp/api-client` package for domain-backed public catalog reads and move the app's foods search/detail plus swaps flows onto that shared client boundary.

- [#333](https://github.com/f-campana/fodmapp/pull/333) [`b751423`](https://github.com/f-campana/fodmapp/commit/b75142370458be74d7376dbaf309ad891c9e0f3d) Thanks [@f-campana](https://github.com/f-campana)! - feat(api-client): extract protected tracking read client

- [#335](https://github.com/f-campana/fodmapp/pull/335) [`a638dec`](https://github.com/f-campana/fodmapp/commit/a638dec27a0a63a8abfa91135e5aa9c7c954c8dd) Thanks [@f-campana](https://github.com/f-campana)! - feat(api-client): complete tracking client cleanup

- [#336](https://github.com/f-campana/fodmapp/pull/336) [`9ceabce`](https://github.com/f-campana/fodmapp/commit/9ceabcee333dd3911e910b9a94246509cbef7037) Thanks [@f-campana](https://github.com/f-campana)! - Add default export conditions so Expo and related mobile tooling can resolve the shared packages consistently.

- Updated dependencies [[`0134c2c`](https://github.com/f-campana/fodmapp/commit/0134c2c8f6c996813a0d0b724c5129e1d786dd81), [`52f6f83`](https://github.com/f-campana/fodmapp/commit/52f6f8322b3cf09aeb8bc1224e651723431f77af), [`233b84a`](https://github.com/f-campana/fodmapp/commit/233b84a997bf59cf341d5d1da0d7093b95d72ade), [`7febef3`](https://github.com/f-campana/fodmapp/commit/7febef3ba6d9b42655e8ade50a7c9ecbf8e18288), [`c9ec4eb`](https://github.com/f-campana/fodmapp/commit/c9ec4ebe6b07d06818f949a27af2a577d4d27e14), [`7a636f6`](https://github.com/f-campana/fodmapp/commit/7a636f651c461ba7e644e253d169a2701fe7bd2c), [`636c493`](https://github.com/f-campana/fodmapp/commit/636c493da950b78e9d39c3cb48ac1b4dc922d572), [`1f99277`](https://github.com/f-campana/fodmapp/commit/1f99277823d5d2e2f15210fb8198ef9b7305627f), [`6006bfb`](https://github.com/f-campana/fodmapp/commit/6006bfbb2d6c74f1c9a381412fde3c36ae531d3a), [`56df81f`](https://github.com/f-campana/fodmapp/commit/56df81fd689fc54901da45d8d8dbc748ce3265f0), [`fca296a`](https://github.com/f-campana/fodmapp/commit/fca296a4b2c10edb7c77ed83e033ac0a4af727f0), [`9ceabce`](https://github.com/f-campana/fodmapp/commit/9ceabcee333dd3911e910b9a94246509cbef7037)]:
  - @fodmapp/types@0.1.2
  - @fodmapp/domain@0.1.1
