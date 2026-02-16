# Phase 2 Pod Wave Decision Ledgers

All pod waves are proposal-only. Do not apply SQL until human review signs off each ledger.

Decision values:
- `resolve_existing`
- `create_new_food`
- `blocked`

Required review gates before apply:
1. Every rank in the wave has one non-empty decision.
2. `resolve_existing` rows include candidate IDs/codes.
3. `create_new_food` rows include slug, FR name, EN name (when straightforward), preparation state.
4. `blocked` rows include explicit blocker notes and remediation path.
