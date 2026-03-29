import { fileSystemService } from './FileSystemService';
import { User } from '../types/api';
import { authLogger } from '../utils/Logger';
import * as SecureStore from 'expo-secure-store';

const USER_FILE = 'user.json';
const ACTIVE_HOME_ID_KEY = 'active_home_id';

/**
 * AuthService
 *
 * Handles persistence of app-level user data and the active home ID.
 * Authentication tokens are no longer stored here – Firebase manages its own
 * token lifecycle via @react-native-firebase/auth.
 */
class AuthService {
    /**
     * Get stored user data
     */
    async getUser(): Promise<User | null> {
        return fileSystemService.readFile<User>(USER_FILE);
    }

    /**
     * Save user data
     */
    async saveUser(user: User): Promise<boolean> {
        return fileSystemService.writeFile(USER_FILE, user);
    }

    /**
     * Clear stored user data
     */
    async clearUser(): Promise<boolean> {
        return fileSystemService.deleteFile(USER_FILE);
    }

    /**
     * Get stored active home ID
     */
    async getActiveHomeId(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(ACTIVE_HOME_ID_KEY);
        } catch (error) {
            authLogger.error('Error getting active home ID:', error);
            return null;
        }
    }

    /**
     * Save active home ID
     */
    async saveActiveHomeId(homeId: string): Promise<boolean> {
        try {
            await SecureStore.setItemAsync(ACTIVE_HOME_ID_KEY, homeId);
            return true;
        } catch (error) {
            authLogger.error('Error saving active home ID:', error);
            return false;
        }
    }

    /**
     * Remove active home ID
     */
    async removeActiveHomeId(): Promise<boolean> {
        try {
            await SecureStore.deleteItemAsync(ACTIVE_HOME_ID_KEY);
            return true;
        } catch (error) {
            authLogger.error('Error removing active home ID:', error);
            return false;
        }
    }

    /**
     * Clear app-level auth data (user profile + active home).
     * Firebase sign-out is handled separately via firebaseAuthService.signOut().
     */
    async clearAllAuthData(): Promise<void> {
        await Promise.all([this.clearUser(), this.removeActiveHomeId()]);
    }

    /**
     * Clear all user data on logout (items, todos, categories, homes, etc.)
     * Preserves settings only.
     */
    async clearAllUserData(): Promise<void> {
        try {
            const files = await fileSystemService.listJsonFiles();
            const filesToPreserve = ['settings.json'];

            for (const file of files) {
                if (!filesToPreserve.includes(file)) {
                    await fileSystemService.deleteFile(file);
                    authLogger.info(`Deleted user data file: ${file}`);
                }
            }

            await this.removeActiveHomeId();
            authLogger.info('All user data cleared (settings preserved)');
        } catch (error) {
            authLogger.error('Error clearing user data:', error);
        }
    }
}

export const authService = new AuthService();
export type { AuthService };
