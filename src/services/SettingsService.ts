import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, defaultSettings } from '../types/settings';
import { storageLogger } from '../utils/Logger';

const SETTINGS_KEY = 'app_settings';

class SettingsService {

  /**
   * Get current settings (global, not home-scoped)
   */
  async getSettings(): Promise<Settings> {
    const now = new Date().toISOString();
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsJson) {
        try {
          const parsed = JSON.parse(settingsJson) as Partial<Settings>;
          // Merge with defaults to ensure all fields exist
          return {
            ...defaultSettings,
            ...parsed,
            createdAt: parsed.createdAt || now,
            updatedAt: parsed.updatedAt || now
          } as Settings;
        } catch {
          // JSON parse error, fall through to defaults
          storageLogger.warn('Failed to parse settings JSON, using defaults');
        }
      }
    } catch (error) {
      storageLogger.error('Error reading settings from AsyncStorage:', error);
    }
    // Return defaults if nothing stored or on error
    return { ...defaultSettings, createdAt: now, updatedAt: now } as Settings;
  }

  /**
   * Update settings (supports partial updates, global, not home-scoped)
   */
  async updateSettings(updates: Partial<Settings>): Promise<Settings | null> {
    try {
      const currentSettings = await this.getSettings();
      const now = new Date().toISOString();
      const newSettings: Settings = {
        ...currentSettings,
        ...updates,
        updatedAt: now,
        createdAt: currentSettings.createdAt || now,
      };

      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    } catch (error) {
      storageLogger.error('Error updating settings:', error);
      return null;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<Settings | null> {
    try {
      const now = new Date().toISOString();
      const resetSettings: Settings = {
        ...defaultSettings,
        createdAt: now,
        updatedAt: now,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(resetSettings));
      return resetSettings;
    } catch (error) {
      storageLogger.error('Error resetting settings:', error);
      return null;
    }
  }
}

export const settingsService = new SettingsService();
export type { SettingsService };
