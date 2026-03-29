# Cluttr

A React Native application for managing home inventory built with Expo.

## Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- EAS CLI (install with `make install-eas`)
- For iOS builds: Xcode and iOS development tools
- For Android builds: Android Studio and Android SDK

## Firebase Configuration

Authentication (email/password, Google, Apple), Crashlytics, Analytics, and push notifications are all powered by Firebase. The project's Firebase configuration is tracked as code in [`firebase.json`](firebase.json) and [`.firebaserc`](.firebaserc).

### Prerequisites

Install the Firebase CLI and log in:

```bash
npm install -g firebase-tools
firebase login
```

Verify the active project matches `.firebaserc`:

```bash
firebase projects:list
firebase use default   # selects the project alias defined in .firebaserc
```

### Applying Firebase Configuration

The `firebase.json` file declares which services are active and where their rules/indexes live. Use the commands below to push configuration changes to Firebase.

#### Deploy everything at once

```bash
firebase deploy
```

#### Deploy individual services

```bash
# Authentication configuration only
firebase deploy --only auth

# Firestore security rules + indexes
firebase deploy --only firestore

# Cloud Storage security rules
firebase deploy --only storage

# Firebase Hosting (if used)
firebase deploy --only hosting
```

#### Preview changes before deploying

```bash
# Dry-run for Firestore rules
firebase firestore:rules --validate

# Emulate locally before pushing
firebase emulators:start
```

### Enabling Auth Providers (one-time setup)

The providers listed in `firebase.json` must also be **manually enabled** in the Firebase Console the first time you set up the project — the CLI does not enable providers from config alone.

1. Open [Firebase Console](https://console.firebase.google.com/) → your project → **Authentication** → **Sign-in method**
2. Enable the following providers:

| Provider | Notes |
|----------|-------|
| **Email/Password** | Enable; password-reset emails are sent by Firebase automatically |
| **Google** | Enable; copy the **Web client ID** (shown after enabling) — needed for `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| **Apple** | Enable; requires an Apple Developer account with Sign in with Apple configured |

> Any future provider additions must also be reflected in `firebase.json`. See [`agents.md`](agents.md) for the full IaC convention.

### Native Firebase Config Files

Firebase SDKs require platform-specific config files that are **not** committed to the repository:

| Platform | File | Where to get it |
|----------|------|-----------------|
| iOS | `GoogleService-Info.plist` | Firebase Console → Project settings → iOS app → Download config |
| Android | `google-services.json` | Firebase Console → Project settings → Android app → Download config |

Place both files in the project root. They are referenced by `app.json` and are already listed in `.gitignore`.

---

## Environment Variables

The following environment variables are required. Create a `.env` file in the project root (it is git-ignored).

```env
# Backend API
EXPO_PUBLIC_API_BASE_URL=https://your-api-url.example.com

# Google Sign-In (Firebase)
# Web/Server client ID — found in Firebase Console → Authentication →
# Sign-in method → Google → Web client ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-web-client-id>.apps.googleusercontent.com

# Logging (optional)
EXPO_PUBLIC_LOG_LEVEL=info
EXPO_PUBLIC_LOG_CATEGORIES=*
EXPO_PUBLIC_LOG_TIMESTAMPS=true
EXPO_PUBLIC_LOG_EMOJIS=true
```

> **Note:** The old `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` variables are no longer used. Google Sign-In is now handled by `@react-native-google-signin/google-signin` via Firebase, which reads platform credentials directly from `GoogleService-Info.plist` / `google-services.json`.

### Google Sign-In Setup

The app uses **Firebase Google Sign-In** via `@react-native-google-signin/google-signin`. The SDK reads iOS/Android credentials directly from the native Firebase config files — no separate OAuth client IDs are needed in `.env`. The only required variable is the **Web client ID**, which Firebase uses for server-side token verification.

**Steps:**

1. Enable Google as a sign-in provider in [Firebase Console](https://console.firebase.google.com/) → Authentication → Sign-in method → Google
2. After enabling, Firebase shows a **Web client ID** — copy it into `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`
3. Ensure `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) are present in the project root

**Android additional step — SHA-1 fingerprint:**

The Android OAuth client in Firebase must be linked to your app's signing certificate. Add your SHA-1 fingerprint in Firebase Console → Project settings → Android app → Add fingerprint.

```bash
# Debug keystore (development)
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
```

For production, use your release keystore's SHA-1 or the SHA-1 shown in EAS Build.

### Apple Sign-In Setup

Apple Sign-In is iOS 13+ only and is handled through Firebase.

**Steps:**

1. Enable Apple as a sign-in provider in [Firebase Console](https://console.firebase.google.com/) → Authentication → Sign-in method → Apple
2. In [Apple Developer Console](https://developer.apple.com/account/) → Identifiers → select `com.cluttrapp.cluttr` → enable **Sign in with Apple**
3. Add the **Sign in with Apple** capability to your Xcode project:
   - Run `npx expo prebuild` to generate native projects
   - In Xcode: select target → Signing & Capabilities → + Capability → Sign in with Apple

> No extra environment variables are needed for Apple Sign-In. Firebase handles token verification using the bundle identifier `com.cluttrapp.cluttr`.

**Backend note:** The backend must verify Firebase ID tokens (not Apple identity tokens directly). See [`agents.md`](agents.md) for the full backend integration requirements.

## Installation

### Install Dependencies

```bash
make install-deps
```

This will install all project dependencies using `npm install --legacy-peer-deps`.

### Install EAS CLI

```bash
make install-eas
```

After installation, authenticate with:
```bash
eas login
```

## Building Internal Distribution Variants Locally

Internal distribution builds are useful for testing and distributing to internal testers without going through app stores.

### Build iOS Internal Distribution

To build an iOS internal distribution variant locally:

```bash
make build-ios-internal-local
```

This will create an iOS build that can be installed on physical iOS devices or simulators.

**Installing on iOS:**

1. After the build completes, locate the generated `.ipa` file in the build output directory
2. For physical devices:
   - Transfer the `.ipa` file to your device
   - Install using Xcode's Devices and Simulators window, or
   - Use a tool like [Apple Configurator 2](https://apps.apple.com/us/app/apple-configurator-2/id1037126344)
3. For simulators:
   - The build will automatically install on the connected simulator, or
   - Drag and drop the `.app` bundle into the simulator

**Note:** For physical iOS devices, you may need to:
- Register your device's UDID in your Apple Developer account
- Configure code signing with your development certificate
- Trust the developer certificate on your device (Settings > General > VPN & Device Management)

### Build Android Internal Distribution

To build an Android internal distribution variant locally:

```bash
make build-android-internal-local
```

This will create an Android APK file that can be installed on Android devices or emulators.

**Installing on Android:**

1. After the build completes, locate the generated `.apk` file in the build output directory
2. For physical devices:
   - Enable "Install from unknown sources" in your device settings
   - Transfer the `.apk` file to your device via USB, email, or cloud storage
   - Open the `.apk` file on your device to install
   - Alternatively, use `adb install path/to/app.apk` from your computer
3. For emulators:
   - Use `adb install path/to/app.apk` to install on a running emulator
   - Or drag and drop the `.apk` file into the emulator window

### Build Both Platforms

To build internal distribution variants for both iOS and Android:

```bash
make build-all-internal-local
```

## Development

### Start Development Server

```bash
npm start
```

Or use platform-specific commands:
- `npm run ios` - Start iOS simulator
- `npm run android` - Start Android emulator
- `npm run web` - Start web version

### Code Quality

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Available Make Targets

Run `make help` to see all available targets:

- `make install-deps` - Install all dependencies
- `make install-eas` - Install EAS CLI globally
- `make build-ios` - Build iOS simulator development client (cloud build)
- `make build-android` - Build Android emulator development client (cloud build)
- `make build-all` - Build both iOS and Android simulator clients
- `make build-ios-local` - Build iOS simulator locally
- `make build-android-local` - Build Android emulator locally
- `make build-ios-internal-local` - Build iOS internal distribution variant locally
- `make build-android-internal-local` - Build Android internal distribution variant locally
- `make build-all-internal-local` - Build both iOS and Android internal distribution variants locally
- `make clean` - Clean build artifacts

## Troubleshooting

### Build Issues

If you encounter build errors:

1. Clean build artifacts: `make clean`
2. Reinstall dependencies: `make install-deps`
3. Ensure EAS CLI is up to date: `npm install -g eas-cli@latest`
4. Check that your local development environment is properly configured (Xcode for iOS, Android Studio for Android)

### Installation Issues

**iOS:**
- Ensure your device is registered in your Apple Developer account
- Check that code signing certificates are valid
- Verify the device trusts your developer certificate

**Android:**
- Ensure USB debugging is enabled for physical devices
- Check that "Install from unknown sources" is enabled
- Verify ADB is properly configured and can detect your device

## License

Private project.

