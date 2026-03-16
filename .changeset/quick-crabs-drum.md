---
"@fodmapp/app": patch
"@fodmapp/research": patch
"@fodmapp/reporting": patch
"@fodmapp/storybook": patch
"@fodmapp/ui": patch
---

Refactor the shared UI and reporting package surfaces for better tree shaking, move consumers to leaf imports, split UI CSS into app and full-library entry points, and add local bundle analysis tooling for the app, Storybook, and static sites.
