# @reading/mobile

The Expo (React Native) app. It uses native modules and widgets, so it runs as a **development build**, not in Expo Go.

Setup for the whole project (database, API) is in the [root README](../../README.md).

## Run

```bash
cp .env.example .env    # API URL + Google client IDs (public values, no secrets)
pnpm ios                # build and open in the iOS Simulator
pnpm android            # build and open in the Android emulator
pnpm android:api        # Android: forward the emulator's localhost:3001 to your machine
pnpm dev                # Metro only, once the build is installed
pnpm lint
```

Rebuild with `pnpm ios` / `pnpm android` after adding a package with native code or changing `app.json`. Otherwise `pnpm dev` is enough.

`EXPO_PUBLIC_API_URL`:

- iOS Simulator: `http://localhost:3001`
- Android emulator: `http://localhost:3001` after `pnpm android:api`, or `http://10.0.2.2:3001`
- A real phone: your computer's Wi-Fi IP

## Structure

```
src/
  app/            screens (expo-router): (tabs)/ = Feed, Library, Clubs, Profile
  api/            React Query hooks per resource + the fetch client (JWT refresh)
  auth/           Google sign-in, tokens in the secure store
  chat/           Socket.IO client, chat history, unread dots
  timer/          the timer state (MMKV), offline session queue, Live Activity / notification sync
  widgets/        iOS widget and Live Activity (expo-widgets)
  components/     UI kit (components/ui) and feature components
  i18n/           English + Ukrainian translations (typed keys)
  theme/          color tokens for light / dark, ThemeProvider
  settings/       reading settings (no-timer mode, reminders), saved in MMKV
  stats/, library/, clubs/, notifications/, navigation/, hooks/, lib/
modules/
  home-widget/          Android home screen widget (Kotlin)
  timer-notification/   Android ongoing timer notification (Kotlin)
```

## Notes

- **Lists** use FlashList, and **images** use `expo-image` with disk caching (`RemoteImage`).
- **Styling:** NativeWind with CSS variables, so one set of classes works for both themes.
- **No paid Apple account:** no Sign in with Apple and no push notifications. The iOS widget and Live Activity work in the Simulator only.
