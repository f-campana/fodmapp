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
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_mobile_publishable_key
```

Use a device-reachable host when running on a physical phone.
Enable Clerk's Native API in the Clerk dashboard so Expo native sessions can
sign in and restore correctly.

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
- Clerk-backed mobile auth shell with secure session persistence via `expo-secure-store`
- Minimal signed-in/signed-out boundary plus sign-in/sign-up screens
- Protected API probe in settings using the shared tracking client with bearer auth
- Settings/preferences with local persistence (AsyncStorage)
- Refined visual style (safe-area layout, better spacing/typography, cleaner tab bar)
- Loading/empty/error states in key flows

## Data seams and tweak points

- Connected catalog data access: `src/data/catalogRepository.ts`
- Mobile auth provider + Clerk wiring: `src/auth/`
- Protected request probe: `src/data/protectedRepository.ts`
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
