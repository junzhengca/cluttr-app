// eslint-disable-next-line no-duplicate-imports
import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { authLogger } from '../utils/Logger';

/**
 * FirebaseAuthService
 *
 * Centralises all Firebase Authentication operations:
 *   - Email / password sign-in and registration
 *   - Google Sign-In (via @react-native-google-signin)
 *   - Apple Sign-In (iOS only, via expo-apple-authentication)
 *   - Password reset emails
 *   - Sign-out
 *
 * BACKEND NOTE: The backend must verify Firebase ID tokens instead of its
 * own JWTs. Every authenticated API request sends a Firebase ID token as the
 * Bearer token. The backend should use the Firebase Admin SDK to verify the
 * token and identify users by their Firebase UID.
 */
class FirebaseAuthService {
    constructor() {
        // Configure Google Sign-In with the web/server client ID from Firebase.
        // This is the "Web client (auto created by Google Service)" client ID
        // found in Firebase Console → Authentication → Sign-in method → Google.
        // It is different from the iOS / Android OAuth client IDs.
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            offlineAccess: true,
            scopes: ['profile', 'email'],
        });
    }

    /**
     * Wait for Firebase to resolve its initial authentication state.
     * Call this once on app start instead of reading a stored token.
     */
    waitForAuthState(): Promise<FirebaseAuthTypes.User | null> {
        return new Promise((resolve) => {
            const unsubscribe = auth().onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    /**
     * Sign in with email and password.
     */
    async signInWithEmailAndPassword(
        email: string,
        password: string,
    ): Promise<FirebaseAuthTypes.UserCredential> {
        authLogger.info('Signing in with email/password');
        return auth().signInWithEmailAndPassword(email, password);
    }

    /**
     * Create a new account with email and password.
     */
    async createUserWithEmailAndPassword(
        email: string,
        password: string,
    ): Promise<FirebaseAuthTypes.UserCredential> {
        authLogger.info('Creating account with email/password');
        return auth().createUserWithEmailAndPassword(email, password);
    }

    /**
     * Sign in with Google.
     * Returns null when the user cancels the sign-in picker.
     */
    async signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential | null> {
        try {
            authLogger.info('Starting Google Sign-In');

            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (!idToken) {
                throw new Error('Google Sign-In did not return an ID token');
            }

            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            const result = await auth().signInWithCredential(googleCredential);
            authLogger.info('Google Sign-In successful');
            return result;
        } catch (error: unknown) {
            // User cancelled or sign-in is already in progress – not an error
            if (error && typeof error === 'object' && 'code' in error) {
                const code = (error as { code: string }).code;
                if (
                    code === statusCodes.SIGN_IN_CANCELLED ||
                    code === statusCodes.IN_PROGRESS
                ) {
                    authLogger.info('Google Sign-In cancelled by user');
                    return null;
                }
            }
            authLogger.error('Google Sign-In error', error);
            throw error;
        }
    }

    /**
     * Sign in with Apple (iOS 13+ only).
     * Returns null when the user cancels the sign-in sheet.
     */
    async signInWithApple(): Promise<FirebaseAuthTypes.UserCredential | null> {
        if (Platform.OS !== 'ios') {
            throw new Error('Apple Sign-In is only available on iOS');
        }

        const available = await AppleAuthentication.isAvailableAsync();
        if (!available) {
            throw new Error(
                'Apple Sign-In is not available on this device. Requires iOS 13+ with an Apple ID.',
            );
        }

        try {
            authLogger.info('Starting Apple Sign-In');

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            const { identityToken } = credential;
            if (!identityToken) {
                throw new Error('Apple Sign-In did not return an identity token');
            }

            const appleCredential = auth.AppleAuthProvider.credential(identityToken);
            const result = await auth().signInWithCredential(appleCredential);
            authLogger.info('Apple Sign-In successful');
            return result;
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                (error.message.includes('ERR_REQUEST_CANCELED') ||
                    error.message.includes('com.apple.AuthenticationServices'))
            ) {
                authLogger.info('Apple Sign-In cancelled by user');
                return null;
            }
            authLogger.error('Apple Sign-In error', error);
            throw error;
        }
    }

    /**
     * Send a password-reset email via Firebase.
     * The user clicks the link in the email to set a new password –
     * no OTP verification code is needed on the client.
     */
    async sendPasswordResetEmail(email: string): Promise<void> {
        authLogger.info('Sending password reset email');
        return auth().sendPasswordResetEmail(email);
    }

    /**
     * Sign out from Firebase (and Google if the current provider is Google).
     */
    async signOut(): Promise<void> {
        try {
            const currentGoogleUser = GoogleSignin.getCurrentUser();
            if (currentGoogleUser) {
                await GoogleSignin.signOut();
            }
        } catch (error) {
            // Non-fatal – proceed with Firebase sign-out regardless
            authLogger.warn('Google sign-out failed during global sign-out', error);
        }
        return auth().signOut();
    }

    /**
     * Return the currently authenticated Firebase user, or null.
     */
    getCurrentUser(): FirebaseAuthTypes.User | null {
        return auth().currentUser;
    }

    /**
     * Get a fresh Firebase ID token for the current user.
     * Returns null if no user is signed in.
     */
    async getIdToken(forceRefresh = false): Promise<string | null> {
        const user = auth().currentUser;
        if (!user) return null;
        return user.getIdToken(forceRefresh);
    }
}

export const firebaseAuthService = new FirebaseAuthService();
export type { FirebaseAuthService };
