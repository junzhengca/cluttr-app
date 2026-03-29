/**
 * @deprecated AppleAuthService has been replaced by FirebaseAuthService.
 * Apple Sign-In is now handled entirely within FirebaseAuthService.signInWithApple()
 * using expo-apple-authentication and Firebase credentials.
 *
 * This file is kept as a no-op shim to avoid breaking any lingering imports
 * while the migration is completed. Remove this file once all callers have
 * been updated to use firebaseAuthService directly.
 */

export {};
