# fixtures/now-set

This folder stores fixture query outputs used by PR smoke mode only.

Scope:
- one fixture file per figure in now-set: P01, P02, P03, Q02, Q03, Q04, E03, E04
- each fixture includes `figure_id`, `contract_refs`, `source_file_hashes`, and `source_rows`
- fixture mode must not hit a live DB

Refresh policy:
- regenerate fixtures only when input contract files change
- update runbook references in this folder together with baseline refresh
