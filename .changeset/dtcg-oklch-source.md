---
"@fodmap/design-tokens": patch
---

Migrate base color source tokens to DTCG `oklch` objects and emit `oklch(...)` values in generated CSS, JSON, and JS artifacts.

Add preflight validation in token generation to enforce DTCG color shape, value ranges, canonical lowercase hex, and `oklch -> sRGB` roundtrip consistency.
