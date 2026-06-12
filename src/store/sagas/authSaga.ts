import { call, put, takeLatest, select, take } from 'redux-saga/effects';
import { EventChannel } from 'redux-saga';
import {
  setUser,
  setAuthenticated,
  setLoading,
  setError,
  setShowNicknameSetup,
  setActiveHomeId,
} from '../slices/authSlice';
import { authService } from '../../services/AuthService';
import { firebaseAuthService } from '../../services/FirebaseAuthService';
import { homeService } from '../../services/HomeService';
import { userService } from '../../services/UserService';
import {
  createSnapshotChannel,
  homesQueryForUser,
  homeFromDoc,
  SnapshotEvent,
} from '../../services/firebase/firestoreRefs';
import { User } from '../../types/user';
import { ErrorDetails } from '../../types/errors';
import type { RootState } from '../types';
import { getGlobalToast } from '../../utils/toastRegistry';
import i18n from '../../i18n/i18n';
import { authLogger } from '../../utils/Logger';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Global error handler - set by app/_layout.tsx
let globalErrorHandler: ((errorDetails: ErrorDetails) => void) | null = null;

export const setGlobalErrorHandler = (
  handler: (errorDetails: ErrorDetails) => void
) => {
  globalErrorHandler = handler;
};

export const getGlobalErrorHandler = () => globalErrorHandler;

// ─── Action Types ─────────────────────────────────────────────────────────────

const CHECK_AUTH = 'auth/CHECK_AUTH';
const LOGIN = 'auth/LOGIN';
const SIGNUP = 'auth/SIGNUP';
const GOOGLE_LOGIN = 'auth/GOOGLE_LOGIN';
const APPLE_LOGIN = 'auth/APPLE_LOGIN';
const LOGOUT = 'auth/LOGOUT';
const UPDATE_USER = 'auth/UPDATE_USER';
const INITIALIZE_AUTH = 'auth/INITIALIZE_AUTH';
const ACCESS_DENIED = 'auth/ACCESS_DENIED';
const PASSWORD_RESET_REQUEST = 'auth/PASSWORD_RESET_REQUEST';
const SUBSCRIBE_HOMES = 'auth/SUBSCRIBE_HOMES';

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
export const updateUser = (userData: Partial<User>) => ({
  type: UPDATE_USER,
  payload: userData,
});
export const initializeAuth = () => ({ type: INITIALIZE_AUTH });
export const accessDenied = (resourceId?: string) => ({
  type: ACCESS_DENIED,
  payload: resourceId,
});
export const passwordResetRequestAction = (email: string) => ({
  type: PASSWORD_RESET_REQUEST,
  payload: email,
});
/** Start (uid) or stop (null) the live homes subscription. */
const subscribeHomes = (uid: string | null) => ({
  type: SUBSCRIBE_HOMES,
  payload: uid,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function* clearAuthAndLogout() {
  authLogger.info('Clearing auth data');

  // Stop the homes listener before tearing down auth
  yield put(subscribeHomes(null));

  // Sign out from Firebase (also signs out from Google if applicable)
  try {
    yield call([firebaseAuthService, 'signOut']);
  } catch (error) {
    authLogger.warn('Firebase sign-out error during clearAuthAndLogout', error);
  }

  yield put(setUser(null));
  yield put(setAuthenticated(false));
  yield put(setActiveHomeId(null));
  homeService.reset();

  yield call([authService, 'clearAllUserData']);
}

function* restoreOrSelectActiveHome() {
  let activeHomeId: string | null = (yield call([
    authService,
    'getActiveHomeId',
  ])) as string | null;
  const allHomes = homeService.getHomes();

  if (activeHomeId && !allHomes.find((h) => h.id === activeHomeId)) {
    authLogger.warn(
      `Persisted activeHomeId ${activeHomeId} not found in homes list.`
    );
    activeHomeId = null;
  }

  if (!activeHomeId && allHomes.length > 0) {
    activeHomeId = allHomes[0].id;
    authLogger.info(
      `No valid active home persisted, defaulting to first home: ${activeHomeId}`
    );
  }

  if (activeHomeId) {
    authLogger.info('Setting active home ID', activeHomeId);
    yield put(setActiveHomeId(activeHomeId));
    return activeHomeId;
  }

  return null;
}

/**
 * Shared post-auth setup: ensure the Firestore user profile exists, then
 * start the live homes subscription (which selects the active home and
 * triggers the per-domain data listeners).
 */
function* postAuthSetup(firebaseUser: FirebaseAuthTypes.User): Generator {
  const userData: User = (yield call(
    [userService, 'ensureUserDoc'],
    firebaseUser
  )) as User;

  yield call([authService, 'saveUser'], userData);
  yield put(setUser(userData));
  yield put(
    setShowNicknameSetup(!userData.nickname || userData.nickname.trim() === '')
  );

  yield put(setAuthenticated(true));
  yield put(setError(null));

  yield put(subscribeHomes(firebaseUser.uid));
}

// ─── Homes Subscription ───────────────────────────────────────────────────────

/**
 * Live homes listener. Each snapshot updates HomeService (which feeds
 * useHome), reconciles the active home selection, and creates the default
 * home for brand-new accounts. takeLatest on SUBSCRIBE_HOMES cancels the
 * previous listener on re-auth or logout.
 */
function* homesChannelSaga(action: {
  type: string;
  payload: string | null;
}): Generator {
  const uid = action.payload;
  if (!uid) return;

  authLogger.info('Starting homes subscription', uid);
  const channel = (yield call(
    createSnapshotChannel,
    homesQueryForUser(uid)
  )) as EventChannel<SnapshotEvent>;
  let createdDefaultHome = false;

  try {
    while (true) {
      const event: SnapshotEvent = (yield take(channel)) as SnapshotEvent;

      if (event.error) {
        // onSnapshot errors are terminal — the listener has stopped.
        authLogger.error('Homes listener error', event.error);
        break;
      }

      const snapshot = event.snapshot!;
      const homes = snapshot.docs.map((doc) => homeFromDoc(doc, uid));
      authLogger.info(
        `Homes snapshot: ${homes.length} home(s), fromCache=${snapshot.metadata.fromCache}`
      );
      homeService.setHomesFromSnapshot(homes);

      // Brand-new account: create the default home once we know the
      // server (not just the local cache) says there are no homes.
      if (
        homes.length === 0 &&
        !snapshot.metadata.fromCache &&
        !createdDefaultHome
      ) {
        createdDefaultHome = true;
        authLogger.info('No homes found, creating default home');
        const newHome = homeService.createHome(uid, 'My Home');
        yield put(setActiveHomeId(newHome.id));
        continue;
      }

      // Reconcile the active home with the live list
      const activeHomeId: string | null = (yield select(
        (state: RootState) => state.auth.activeHomeId
      )) as string | null;

      if (homes.length > 0) {
        if (!activeHomeId || !homes.find((h) => h.id === activeHomeId)) {
          if (activeHomeId && !snapshot.metadata.fromCache) {
            // Active home disappeared from the server list — the
            // user was removed or the home was deleted elsewhere.
            const toast = getGlobalToast();
            if (toast)
              toast(
                i18n.t(
                  'share.accessRevoked',
                  'Access to this home has been revoked'
                ),
                'error'
              );
          }
          yield call(restoreOrSelectActiveHome);
        } else {
          homeService.switchHome(activeHomeId);
        }
      } else if (activeHomeId && !snapshot.metadata.fromCache) {
        yield put(setActiveHomeId(null));
      }
    }
  } finally {
    authLogger.info('Closing homes subscription');
    channel.close();
  }
}

// ─── Sagas ────────────────────────────────────────────────────────────────────

function* initializeAuthSaga() {
  yield put(checkAuth());
}

function* checkAuthSaga(): Generator {
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

    authLogger.info('Firebase user found, restoring session', {
      uid: firebaseUser.uid,
    });

    try {
      yield call(postAuthSetup, firebaseUser);
    } catch (error) {
      // Firestore unreachable and profile not cached — fall back to the
      // locally cached user so the app still opens offline.
      authLogger.warn(
        'Post-auth setup failed, attempting cached session',
        error
      );
      const savedUser: User | null = (yield call([
        authService,
        'getUser',
      ])) as User | null;

      if (savedUser) {
        yield put(setUser(savedUser));
        yield put(setAuthenticated(true));
        yield put(
          setShowNicknameSetup(
            !savedUser.nickname || savedUser.nickname.trim() === ''
          )
        );
        yield put(subscribeHomes(firebaseUser.uid));
      } else {
        authLogger.error(
          'No cached user and Firestore unreachable – signing out'
        );
        yield call(clearAuthAndLogout);
      }
    }
  } catch (error) {
    authLogger.error('Error checking auth', error);
    yield call(clearAuthAndLogout);
  } finally {
    const isLoading: boolean = (yield select(
      (state: RootState) => state.auth.isLoading
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

  yield put(setError(null));
  yield put(setLoading(true));

  try {
    const credential = (yield call(
      [firebaseAuthService, 'signInWithEmailAndPassword'],
      email,
      password
    )) as FirebaseAuthTypes.UserCredential;

    yield call(postAuthSetup, credential.user);
    yield put(setLoading(false));

    const toast = getGlobalToast();
    if (toast) toast(i18n.t('toast.loginSuccess'), 'success');

    authLogger.info('Login successful');
  } catch (error) {
    authLogger.error('Login error', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Login failed. Please try again.';
    yield put(setError(errorMessage));
    yield put(setLoading(false));
  }
}

function* signupSaga(action: {
  type: string;
  payload: { email: string; password: string };
}): Generator {
  const { email, password } = action.payload;

  try {
    const credential = (yield call(
      [firebaseAuthService, 'createUserWithEmailAndPassword'],
      email,
      password
    )) as FirebaseAuthTypes.UserCredential;

    yield call(postAuthSetup, credential.user);

    const toast = getGlobalToast();
    if (toast) toast(i18n.t('toast.signupSuccess'), 'success');

    authLogger.info('Signup successful');
  } catch (error) {
    authLogger.error('Signup error', error);
    throw error;
  }
}

function* googleLoginSaga(): Generator {
  yield put(setError(null));
  yield put(setLoading(true));

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

    yield call(postAuthSetup, result.user);
    yield put(setLoading(false));

    const toast = getGlobalToast();
    if (toast) toast(i18n.t('toast.loginSuccess'), 'success');

    authLogger.info('Google login successful');
  } catch (error) {
    authLogger.error('Google login error', error);
    yield put(
      setError(
        error instanceof Error
          ? error.message
          : 'Google login failed. Please try again.'
      )
    );
    yield put(setLoading(false));
  }
}

function* appleLoginSaga(): Generator {
  yield put(setError(null));
  yield put(setLoading(true));

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

    yield call(postAuthSetup, result.user);
    yield put(setLoading(false));

    const toast = getGlobalToast();
    if (toast) toast(i18n.t('toast.loginSuccess'), 'success');

    authLogger.info('Apple login successful');
  } catch (error) {
    authLogger.error('Apple login error', error);
    yield put(
      setError(
        error instanceof Error
          ? error.message
          : 'Apple login failed. Please try again.'
      )
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

/** Persist profile changes (nickname/avatar) to Firestore and Redux. */
function* updateUserSaga(action: { type: string; payload: Partial<User> }) {
  try {
    const firebaseUser = firebaseAuthService.getCurrentUser();
    if (!firebaseUser) {
      authLogger.error('Cannot update user: not signed in');
      return;
    }

    const updated: User = (yield call(
      [userService, 'updateProfile'],
      firebaseUser.uid,
      {
        nickname: action.payload.nickname,
        avatarUrl: action.payload.avatarUrl,
      }
    )) as User;

    yield call([authService, 'saveUser'], updated);
    yield put(setUser(updated));
  } catch (error) {
    authLogger.error('Error updating user', error);
    const toast = getGlobalToast();
    if (toast) {
      toast(
        error instanceof Error ? error.message : 'Failed to update profile',
        'error'
      );
    }
  }
}

/**
 * A home-scoped listener hit permission-denied: the user lost access to that
 * home (sharing toggle flipped or membership revoked). The homes snapshot is
 * the primary signal; this just switches away promptly.
 */
function* handleAccessDenied(action: { type: string; payload?: string }) {
  const deniedHomeId = action.payload;
  authLogger.info('Access denied for home', deniedHomeId);

  if (!deniedHomeId) return;

  const activeHomeId: string | null = (yield select(
    (state: RootState) => state.auth.activeHomeId
  )) as string | null;

  if (activeHomeId === deniedHomeId) {
    const stillMember = homeService
      .getHomes()
      .some((h) => h.id === deniedHomeId);
    if (stillMember) {
      // Just gated by a sharing toggle — the home snapshot delivers the
      // updated settings and the UI locks the affected tabs. Re-selecting
      // would re-subscribe the denied listener in a loop.
      authLogger.info(
        'Access denied but still a member (sharing toggle); not switching'
      );
      return;
    }
    authLogger.warn('Active home access denied, switching to default');
    yield call(restoreOrSelectActiveHome);
  }
}

function* handleActiveHomeIdChange(action: {
  type: string;
  payload: string | null;
}) {
  authLogger.info('Active home ID changed, persisting', action.payload);

  if (action.payload) {
    yield call([authService, 'saveActiveHomeId'], action.payload);
    homeService.switchHome(action.payload);
  } else {
    yield call([authService, 'removeActiveHomeId']);
  }
}

function* handlePasswordResetRequestSaga(action: {
  type: string;
  payload: string;
}) {
  const email = action.payload;

  try {
    yield put(setLoading(true));
    yield put(setError(null));

    yield call([firebaseAuthService, 'sendPasswordResetEmail'], email);

    yield put(setLoading(false));

    const toast = getGlobalToast();
    if (toast) {
      toast(
        i18n.t('login.passwordReset.errors.requestSuccess') ||
          'Reset email sent!',
        'success'
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
  yield takeLatest(INITIALIZE_AUTH, initializeAuthSaga);
  yield takeLatest(SUBSCRIBE_HOMES, homesChannelSaga);
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
