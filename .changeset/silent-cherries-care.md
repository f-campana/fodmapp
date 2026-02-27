---
"@fodmap/design-tokens": patch
---

Normalize native token dimension output so `radius.full` is generated as a number (`9999`) instead of a string (`"9999px"`). This keeps the native token contract consistent for React Native consumers and aligns generated artifacts with lint/type expectations.
