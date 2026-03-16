# Mobile prototype (Expo)

This is a speed-first mobile prototype to validate **real product feel** on iPhone with mock data only.

## Setup

From repo root:

```bash
pnpm install
```

## Run on iPhone (Expo Go)

```bash
pnpm --filter @fodmapp/mobile-prototype start -- --clear
```

1. Install **Expo Go** on iPhone.
2. Keep phone + laptop on the same Wi-Fi.
3. Scan the terminal QR code with Camera or Expo Go scanner.

If LAN connection is unstable:

```bash
pnpm --filter @fodmapp/mobile-prototype start -- --tunnel
```

## What is implemented

- First-run onboarding flow (3 steps + skip)
- Home dashboard with focus card + quick stats
- Foods browse/search with improved list hierarchy
- Food detail + swap suggestions
- Settings/preferences with local persistence (AsyncStorage)
- Refined visual style (safe-area layout, better spacing/typography, cleaner tab bar)
- Loading/empty/error states in key flows

## Mock data and tweak points

- Foods + initial preferences: `src/data/mockData.ts`
- Data access layer with simulated latency: `src/data/repository.ts`
- Persisted settings + onboarding completion flag: `src/storage/preferencesStore.ts`

## Prototype tests

```bash
pnpm --filter @fodmapp/mobile-prototype test
```

Current tests validate repository filtering and onboarding storage serialization.
