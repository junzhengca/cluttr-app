import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import perf from '@react-native-firebase/perf';
import { Platform } from 'react-native';
import { logger } from '../utils/Logger';

const firebaseLogger = logger.scoped('general');

// ─── Analytics ───────────────────────────────────────────────────────────────

export const logEvent = async (
    name: string,
    params?: Record<string, string | number | boolean>,
): Promise<void> => {
    try {
        await analytics().logEvent(name, params);
    } catch (error) {
        firebaseLogger.error('Failed to log event', error);
    }
};

export const logScreenView = async (screenName: string, screenClass?: string): Promise<void> => {
    try {
        await analytics().logScreenView({
            screen_name: screenName,
            screen_class: screenClass ?? screenName,
        });
    } catch (error) {
        firebaseLogger.error('Failed to log screen view', error);
    }
};

export const setAnalyticsUserId = async (userId: string | null): Promise<void> => {
    try {
        await analytics().setUserId(userId);
    } catch (error) {
        firebaseLogger.error('Failed to set analytics user ID', error);
    }
};

export const setAnalyticsUserProperty = async (
    name: string,
    value: string | null,
): Promise<void> => {
    try {
        await analytics().setUserProperty(name, value);
    } catch (error) {
        firebaseLogger.error('Failed to set analytics user property', error);
    }
};

// ─── Crashlytics ─────────────────────────────────────────────────────────────

export const recordError = (error: Error, jsErrorName?: string): void => {
    try {
        crashlytics().recordError(error, jsErrorName);
    } catch (err) {
        firebaseLogger.error('Failed to record crashlytics error', err);
    }
};

export const setCrashlyticsUserId = async (userId: string): Promise<void> => {
    try {
        await crashlytics().setUserId(userId);
    } catch (error) {
        firebaseLogger.error('Failed to set crashlytics user ID', error);
    }
};

export const setCrashlyticsAttribute = async (name: string, value: string): Promise<void> => {
    try {
        await crashlytics().setAttribute(name, value);
    } catch (error) {
        firebaseLogger.error('Failed to set crashlytics attribute', error);
    }
};

export const logCrashlyticsMessage = (message: string): void => {
    try {
        crashlytics().log(message);
    } catch (error) {
        firebaseLogger.error('Failed to log crashlytics message', error);
    }
};

// ─── Push Notifications (FCM) ────────────────────────────────────────────────

export const requestNotificationPermission = async (): Promise<boolean> => {
    try {
        if (Platform.OS === 'ios') {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            firebaseLogger.info(`iOS notification permission: ${enabled ? 'granted' : 'denied'}`);
            return enabled;
        }
        // Android 13+ handles permissions automatically via FCM
        return true;
    } catch (error) {
        firebaseLogger.error('Failed to request notification permission', error);
        return false;
    }
};

export const getFCMToken = async (): Promise<string | null> => {
    try {
        const token = await messaging().getToken();
        firebaseLogger.info('FCM token obtained');
        return token;
    } catch (error) {
        firebaseLogger.error('Failed to get FCM token', error);
        return null;
    }
};

export const onForegroundMessage = (
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => void,
): (() => void) => {
    return messaging().onMessage(handler);
};

export const onNotificationOpenedApp = (
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => void,
): (() => void) => {
    return messaging().onNotificationOpenedApp(handler);
};

export const getInitialNotification =
    async (): Promise<FirebaseMessagingTypes.RemoteMessage | null> => {
        return messaging().getInitialNotification();
    };

export const onTokenRefresh = (handler: (token: string) => void): (() => void) => {
    return messaging().onTokenRefresh(handler);
};

/**
 * Register a background message handler. Must be called outside of any React
 * component (i.e. at module level) before the app renders.
 */
export const setBackgroundMessageHandler = (
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>,
): void => {
    messaging().setBackgroundMessageHandler(handler);
};

// ─── Performance Monitoring ──────────────────────────────────────────────────

export const startTrace = async (identifier: string) => {
    try {
        const trace = await perf().startTrace(identifier);
        return trace;
    } catch (error) {
        firebaseLogger.error('Failed to start performance trace', error);
        return null;
    }
};

export const newHttpMetric = (url: string, httpMethod: string) => {
    try {
        return perf().newHttpMetric(
            url,
            httpMethod as Parameters<ReturnType<typeof perf>['newHttpMetric']>[1],
        );
    } catch (error) {
        firebaseLogger.error('Failed to create HTTP metric', error);
        return null;
    }
};
