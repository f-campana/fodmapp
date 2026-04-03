# Mobile prototype (Expo)

This Expo app is still a prototype lane, but the catalog slice now uses the
real shared `@fodmapp/api-client` + `@fodmapp/domain` boundary for public food
search, food detail, and swaps.

## Setup

From repo root:

```bash
pnpm install
cp apps/mobile-prototype/.env.local.example apps/mobile-prototype/.env.local
```

Set the public API base in the mobile app env file before starting Expo:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

Use a device-reachable host when running on a physical phone.

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
- Connected foods search using the shared public API client
- Connected food detail + active swaps using domain-backed read models
- Settings/preferences with local persistence (AsyncStorage)
- Refined visual style (safe-area layout, better spacing/typography, cleaner tab bar)
- Loading/empty/error states in key flows

## Data seams and tweak points

- Connected catalog data access: `src/data/catalogRepository.ts`
- Mock preferences + prototype dashboard snapshot: `src/data/repository.ts`
- Initial preferences: `src/data/mockData.ts`
- Expo API config seam: `src/config/api.ts`
- Persisted settings + onboarding completion flag: `src/storage/preferencesStore.ts`

## Prototype tests

```bash
pnpm --filter @fodmapp/mobile-prototype test
```

Current tests validate the connected catalog repository and onboarding storage
serialization.
