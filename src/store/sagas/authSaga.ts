import { call, put, takeLatest, select, fork, take } from 'redux-saga/effects';
import { eventChannel, EventChannel } from 'redux-saga';
import {
    setUser,
    setAuthenticated,
    setLoading,
    setError,
    setApiClient,
    setShowNicknameSetup,
    setActiveHomeId,
} from '../slices/authSlice';
import { loadItems } from './inventorySaga';
import { loadTodos, loadTodoCategoriesAction } from './todoSaga';
import { loadCategories } from './inventoryCategorySaga';
import { apiClient, type ApiClient } from '../../services/ApiClient';
import { authService } from '../../services/AuthService';
import { firebaseAuthService } from '../../services/FirebaseAuthService';
import { homeService } from '../../services/HomeService';
import { User, ErrorDetails } from '../../types/api';
import type { RootState } from '../types';
import { getGlobalToast } from '../../components/organisms/ToastProvider';
import i18n from '../../i18n/i18n';
import { authLogger } from '../../utils/Logger';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Global error handler - set by App.tsx
let globalErrorHandler: ((errorDetails: ErrorDetails) => void) | null = null;

export const setGlobalErrorHandler = (handler: (errorDetails: ErrorDetails) => void) => {
    globalErrorHandler = handler;
};

// ─── Action Types ─────────────────────────────────────────────────────────────

const CHECK_AUTH = 'auth/CHECK_AUTH';
const LOGIN = 'auth/LOGIN';
const SIGNUP = 'auth/SIGNUP';
const GOOGLE_LOGIN = 'auth/GOOGLE_LOGIN';
const APPLE_LOGIN = 'auth/APPLE_LOGIN';
const LOGOUT = 'auth/LOGOUT';
const UPDATE_USER = 'auth/UPDATE_USER';
const INITIALIZE_API_CLIENT = 'auth/INITIALIZE_API_CLIENT';
const AUTH_ERROR = 'auth/AUTH_ERROR';
const ACCESS_DENIED = 'auth/ACCESS_DENIED';
const PASSWORD_RESET_REQUEST = 'auth/PASSWORD_RESET_REQUEST';

// ─── Action Creators ──────────────────────────────────────────────────────────

export const checkAuth = () => ({ type: CHECK_AUTH });
export const login = (email: string, password: string) => ({
    type: LOGIN,
    payload: { email, password },
});
export const signup = (email: string, password: string) => ({
    type: SIGNUP,
    payload: { email, password },
});
/** Dispatched with no payload – Firebase sign-in is handled inside the saga. */
export const googleLogin = () => ({ type: GOOGLE_LOGIN });
/** Dispatched with no payload – Firebase sign-in is handled inside the saga. */
export const appleLogin = () => ({ type: APPLE_LOGIN });
export const logout = () => ({ type: LOGOUT });
export const updateUser = (userData: User) => ({ type: UPDATE_USER, payload: userData });
export const initializeApiClient = (apiBaseUrl: string) => ({
    type: INITIALIZE_API_CLIENT,
    payload: apiBaseUrl,
});
export const authError = (endpoint?: string) => ({ type: AUTH_ERROR, payload: endpoint });
export const accessDenied = (resourceId?: string) => ({
    type: ACCESS_DENIED,
    payload: resourceId,
});
export const passwordResetRequestAction = (email: string) => ({
    type: PASSWORD_RESET_REQUEST,
    payload: email,
});

// ─── API-Client Event Channel ─────────────────────────────────────────────────

type AuthChannelEvent = { type: string; payload?: string };

function createAuthChannel(client: ApiClient): EventChannel<AuthChannelEvent> {
    return eventChannel((emit) => {
        const onAuthError = (endpoint: string) => emit(authError(endpoint));
        const onAccessDenied = (resourceId?: string) => emit(accessDenied(resourceId));

        client.setOnAuthError(onAuthError);
        client.setOnAccessDenied(onAccessDenied);

        return () => {
            client.setOnAuthError(() => {});
            client.setOnAccessDenied(() => {});
        };
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function* clearAuthAndLogout() {
    authLogger.info('Clearing auth data');

    // Sign out from Firebase (also signs out from Google if applicable)
    try {
        yield call([firebaseAuthService, 'signOut']);
    } catch (error) {
        authLogger.warn('Firebase sign-out error during clearAuthAndLogout', error);
    }

    yield put(setUser(null));
    yield put(setAuthenticated(false));
    yield put(setActiveHomeId(null));

    yield call([authService, 'clearAllUserData']);
}

function* restoreOrSelectActiveHome() {
    let activeHomeId: string | null = (yield call([
        authService,
        'getActiveHomeId',
    ])) as string | null;
    const allHomes = homeService.getHomes();

    if (activeHomeId && !allHomes.find((h) => h.id === activeHomeId)) {
        authLogger.warn(`Persisted activeHomeId ${activeHomeId} not found in homes list.`);
        activeHomeId = null;
    }

    if (!activeHomeId && allHomes.length > 0) {
        activeHomeId = allHomes[0].id;
        authLogger.info(`No valid active home persisted, defaulting to first home: ${activeHomeId}`);
    }

    if (activeHomeId) {
        authLogger.info('Setting active home ID', activeHomeId);
        yield put(setActiveHomeId(activeHomeId));
        return activeHomeId;
    }

    return null;
}

function* ensureDefaultHomeIfNeeded(client: ApiClient): Generator {
    try {
        yield call([homeService, homeService.ensureDefaultHome], client);
    } catch (error) {
        authLogger.error('Error ensuring default home', error);
    }
}

/** Shared post-auth setup: fetch user from /me, load homes and data. */
function* postAuthSetup(client: ApiClient): Generator {
    const userData: User = (yield call(client.getCurrentUser.bind(client))) as User;

    if (userData) {
        yield call([authService, 'saveUser'], userData);
        yield put(setUser(userData));
        yield put(
            setShowNicknameSetup(!userData.nickname || userData.nickname.trim() === ''),
        );
    }

    yield put(setAuthenticated(true));
    yield put(setError(null));

    yield call([homeService, homeService.fetchHomes], client);
    yield call(ensureDefaultHomeIfNeeded, client);
    yield call(restoreOrSelectActiveHome);

    yield put(loadItems());
    yield put(loadTodos());
    yield put(loadTodoCategoriesAction());
    yield put(loadCategories());
}

// ─── Sagas ────────────────────────────────────────────────────────────────────

function* initializeApiClientSaga(_action: { type: string; payload: string }) {
    try {
        const client = apiClient;

        client.setOnError((errorDetails: ErrorDetails) => {
            authLogger.info('API error callback triggered, showing error bottom sheet');
            if (globalErrorHandler) {
                globalErrorHandler(errorDetails);
            } else {
                authLogger.warn('Global error handler not set');
            }
        });

        const authChannel: EventChannel<AuthChannelEvent> = yield call(
            createAuthChannel,
            client,
        );
        yield fork(function* () {
            while (true) {
                const event: AuthChannelEvent = (yield take(authChannel)) as AuthChannelEvent;
                yield put(event);
            }
        });

        yield put(setApiClient(client));
        yield put(checkAuth());
    } catch (error) {
        authLogger.error('Error initializing API client', error);
        yield put(setLoading(false));
    }
}

function* checkAuthSaga(): Generator {
    const client: ApiClient = (yield select(
        (state: RootState) => state.auth.apiClient,
    )) as ApiClient;

    if (!client) {
        yield put(setLoading(false));
        return;
    }

    try {
        // Wait for Firebase to resolve its persisted auth state
        const firebaseUser: FirebaseAuthTypes.User | null = (yield call([
            firebaseAuthService,
            'waitForAuthState',
        ])) as FirebaseAuthTypes.User | null;

        if (!firebaseUser) {
            authLogger.info('No Firebase user found – user must log in');
            yield put(setLoading(false));
            return;
        }

        authLogger.info('Firebase user found, restoring session', { uid: firebaseUser.uid });

        // Optimistic UI: show cached user immediately
        const savedUser: User | null = (yield call([authService, 'getUser'])) as User | null;
        let hasBypassedLogin = false;

        if (savedUser) {
            authLogger.info('Found cached user, bypassing login screen immediately');
            yield put(setUser(savedUser));
            yield put(setAuthenticated(true));
            yield put(
                setShowNicknameSetup(!savedUser.nickname || savedUser.nickname.trim() === ''),
            );
            yield call(ensureDefaultHomeIfNeeded, client);
            yield call(restoreOrSelectActiveHome);
            yield put(loadItems());
            yield put(loadTodos());
            yield put(setLoading(false));
            hasBypassedLogin = true;
        }

        // Verify session against backend in background (or foreground if no cache)
        try {
            yield call(postAuthSetup, client);
        } catch (error) {
            const errorStatus = (error as Error & { status?: number })?.status;

            if (errorStatus === 401) {
                authLogger.error('Backend rejected Firebase token (401) – signing out', error);
                yield call(clearAuthAndLogout);
            } else if (!hasBypassedLogin) {
                authLogger.warn('Backend unreachable, attempting offline mode', error);
                if (savedUser) {
                    yield put(setUser(savedUser));
                    yield put(setAuthenticated(true));
                    yield put(
                        setShowNicknameSetup(
                            !savedUser.nickname || savedUser.nickname.trim() === '',
                        ),
                    );
                    yield call(ensureDefaultHomeIfNeeded, client);
                    yield call(restoreOrSelectActiveHome);
                    yield put(loadItems());
                    yield put(loadTodos());
                } else {
                    authLogger.error('No cached user and backend unreachable – signing out');
                    yield call(clearAuthAndLogout);
                }
            } else {
                authLogger.warn('Background auth verification failed – keeping cached session', error);
            }
        }
    } catch (error) {
        authLogger.error('Error checking auth', error);
        yield call(clearAuthAndLogout);
    } finally {
        const isLoading: boolean = (yield select(
            (state: RootState) => state.auth.isLoading,
        )) as boolean;
        if (isLoading) {
            yield put(setLoading(false));
        }
    }
}

function* loginSaga(action: {
    type: string;
    payload: { email: string; password: string };
}): Generator {
    const { email, password } = action.payload;
    const client: ApiClient = (yield select(
        (state: RootState) => state.auth.apiClient,
    )) as ApiClient;

    yield put(setError(null));
    yield put(setLoading(true));

    if (!client) {
        yield put(setError('API client not initialized'));
        yield put(setLoading(false));
        return;
    }

    try {
        yield call(
            [firebaseAuthService, 'signInWithEmailAndPassword'],
            email,
            password,
        );

        yield call(postAuthSetup, client);
        yield put(setLoading(false));

        const toast = getGlobalToast();
        if (toast) toast(i18n.t('toast.loginSuccess'), 'success');

        authLogger.info('Login successful');
    } catch (error) {
        authLogger.error('Login error', error);
        const errorMessage =
            error instanceof Error ? error.message : 'Login failed. Please try again.';
        yield put(setError(errorMessage));
        yield put(setLoading(false));
    }
}

function* signupSaga(action: {
    type: string;
    payload: { email: string; password: string };
}): Generator {
    const { email, password } = action.payload;
    const client: ApiClient = (yield select(
        (state: RootState) => state.auth.apiClient,
    )) as ApiClient;

    if (!client) throw new Error('API client not initialized');

    try {
        yield call(
            [firebaseAuthService, 'createUserWithEmailAndPassword'],
            email,
            password,
        );

        yield call(postAuthSetup, client);

        const toast = getGlobalToast();
        if (toast) toast(i18n.t('toast.signupSuccess'), 'success');

        authLogger.info('Signup successful');
    } catch (error) {
        authLogger.error('Signup error', error);
        throw error;
    }
}

function* googleLoginSaga(): Generator {
    const client: ApiClient = (yield select(
        (state: RootState) => state.auth.apiClient,
    )) as ApiClient;

    yield put(setError(null));
    yield put(setLoading(true));

    if (!client) {
        yield put(setError('API client not initialized'));
        yield put(setLoading(false));
        return;
    }

    try {
        const result: FirebaseAuthTypes.UserCredential | null = (yield call([
            firebaseAuthService,
            'signInWithGoogle',
        ])) as FirebaseAuthTypes.UserCredential | null;

        if (!result) {
            // User cancelled the Google sign-in picker
            yield put(setLoading(false));
            return;
        }

        yield call(postAuthSetup, client);
        yield put(setLoading(false));

        const toast = getGlobalToast();
        if (toast) toast(i18n.t('toast.loginSuccess'), 'success');

        authLogger.info('Google login successful');
    } catch (error) {
        authLogger.error('Google login error', error);
        yield put(
            setError(
                error instanceof Error ? error.message : 'Google login failed. Please try again.',
            ),
        );
        yield put(setLoading(false));
    }
}

function* appleLoginSaga(): Generator {
    const client: ApiClient = (yield select(
        (state: RootState) => state.auth.apiClient,
    )) as ApiClient;

    yield put(setError(null));
    yield put(setLoading(true));

    if (!client) {
        yield put(setError('API client not initialized'));
        yield put(setLoading(false));
        return;
    }

    try {
        const result: FirebaseAuthTypes.UserCredential | null = (yield call([
            firebaseAuthService,
            'signInWithApple',
        ])) as FirebaseAuthTypes.UserCredential | null;

        if (!result) {
            // User cancelled
            yield put(setLoading(false));
            return;
        }

        yield call(postAuthSetup, client);
        yield put(setLoading(false));

        const toast = getGlobalToast();
        if (toast) toast(i18n.t('toast.loginSuccess'), 'success');

        authLogger.info('Apple login successful');
    } catch (error) {
        authLogger.error('Apple login error', error);
        yield put(
            setError(
                error instanceof Error ? error.message : 'Apple login failed. Please try again.',
            ),
        );
        yield put(setLoading(false));
    }
}

function* logoutSaga() {
    authLogger.info('logout() called – signing out from Firebase');

    try {
        yield call(clearAuthAndLogout);

        const toast = getGlobalToast();
        if (toast) toast(i18n.t('toast.logoutSuccess'), 'success');

        authLogger.info('Logout successful');
    } catch (error) {
        authLogger.error('Error during logout', error);
        yield call(clearAuthAndLogout);
    }
}

function* updateUserSaga(action: { type: string; payload: User }) {
    try {
        yield call([authService, 'saveUser'], action.payload);
        yield put(setUser(action.payload));
    } catch (error) {
        authLogger.error('Error updating user', error);
        throw error;
    }
}

function* handleAuthError(action: { type: string; payload?: string }) {
    const endpoint = action.payload;

    // Only invalidate auth when /me endpoint returns 401
    if (endpoint !== '/api/auth/me') {
        authLogger.info(`401 on non-/me endpoint, ignoring: ${endpoint}`);
        return;
    }

    yield call(clearAuthAndLogout);
}

function* handleAccessDenied(action: { type: string; payload?: string }) {
    const deniedUserId = action.payload;
    authLogger.info('Access denied for user', deniedUserId);

    if (!deniedUserId) return;

    const activeHomeId: string | null = (yield select(
        (state: RootState) => state.auth.activeHomeId,
    )) as string | null;

    if (activeHomeId === deniedUserId) {
        authLogger.warn('Active home access denied, switching to default');
        yield call(restoreOrSelectActiveHome);

        const toast = getGlobalToast();
        if (toast) toast('Access to this home has been revoked', 'error');
    }
}

function* handleActiveHomeIdChange(action: { type: string; payload: string | null }) {
    authLogger.info('Active home ID changed, persisting', action.payload);

    if (action.payload) {
        yield call([authService, 'saveActiveHomeId'], action.payload);

        const isAuthenticated: boolean = (yield select(
            (state: RootState) => state.auth.isAuthenticated,
        )) as boolean;
        const authLoading: boolean = (yield select(
            (state: RootState) => state.auth.isLoading,
        )) as boolean;

        if (!authLoading && isAuthenticated) {
            homeService.switchHome(action.payload);
            authLogger.info('Reloading data for new home', action.payload);
            yield put(loadItems());
            yield put(loadTodos());
            yield put(loadTodoCategoriesAction());
            yield put(loadCategories());
        } else {
            authLogger.info('Skipping data reload during auth initialization');
        }
    } else {
        yield call([authService, 'removeActiveHomeId']);
    }
}

function* handlePasswordResetRequestSaga(action: { type: string; payload: string }) {
    const email = action.payload;

    try {
        yield put(setLoading(true));
        yield put(setError(null));

        yield call([firebaseAuthService, 'sendPasswordResetEmail'], email);

        yield put(setLoading(false));

        const toast = getGlobalToast();
        if (toast) {
            toast(
                i18n.t('login.passwordReset.errors.requestSuccess') || 'Reset email sent!',
                'success',
            );
        }
    } catch (error) {
        authLogger.error('Password reset request error', error);
        const errorMessage =
            error instanceof Error ? error.message : 'Failed to send reset email';
        yield put(setError(errorMessage));
        yield put(setLoading(false));
    }
}

// ─── Root Watcher ─────────────────────────────────────────────────────────────

export function* authSaga() {
    yield takeLatest(INITIALIZE_API_CLIENT, initializeApiClientSaga);
    yield takeLatest(AUTH_ERROR, handleAuthError);
    yield takeLatest(ACCESS_DENIED, handleAccessDenied);
    yield takeLatest(CHECK_AUTH, checkAuthSaga);
    yield takeLatest(LOGIN, loginSaga);
    yield takeLatest(SIGNUP, signupSaga);
    yield takeLatest(GOOGLE_LOGIN, googleLoginSaga);
    yield takeLatest(APPLE_LOGIN, appleLoginSaga);
    yield takeLatest(LOGOUT, logoutSaga);
    yield takeLatest(UPDATE_USER, updateUserSaga);
    yield takeLatest(setActiveHomeId.type, handleActiveHomeIdChange);
    yield takeLatest(PASSWORD_RESET_REQUEST, handlePasswordResetRequestSaga);
}
