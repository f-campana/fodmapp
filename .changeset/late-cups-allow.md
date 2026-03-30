---
"@fodmapp/app": patch
"@fodmapp/domain": patch
---

Keep `@fodmapp/domain` rebuilding during `@fodmapp/app` development by replacing the one-shot app prebuild with a watch-backed dev wrapper.
