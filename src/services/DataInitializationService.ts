import { InventoryItem, TodoItem } from '../types/inventory';
import { Settings, defaultSettings } from '../types/settings';
import { fileSystemService } from './FileSystemService';
import { storageLogger } from '../utils/Logger';

const ITEMS_FILE = 'items.json';
const SETTINGS_FILE = 'settings.json';
const TODOS_FILE = 'todos.json';
const _HOMES_FILE = 'homes.json';

interface ItemsData {
  items: InventoryItem[];
}

interface TodosData {
  todos: TodoItem[];
}

class DataInitializationService {

  /**
   * Initialize data files.
   * Global files (settings) are initialized here.
   * Home-specific files should be initialized via initializeHomeData().
   * For backward compatibility or first-run, this can still ensure global settings exist.
   */
  async initializeDataFiles(): Promise<void> {
    try {
      // Initialize settings (Global)
      if (!(await fileSystemService.fileExists(SETTINGS_FILE))) {
        await fileSystemService.writeFile<Settings>(SETTINGS_FILE, defaultSettings);
        storageLogger.info('Settings file initialized');
      }

      // Note: Items, Categories, and Todos are now home-scoped.
      // They are initialized when a home is created or switched to via initializeHomeData.
    } catch (error) {
      storageLogger.error('Error initializing data files:', error);
      throw error;
    }
  }

  /**
   * Initialize data files for a specific home
   */
  async initializeHomeData(homeId: string): Promise<void> {
    try {
      // Note: Inventory categories and locations are now managed via CRUD API, not file storage
      // They are NOT initialized here and do not have default values

      // Initialize items for this home
      const itemsFile = ITEMS_FILE;
      if (!(await fileSystemService.fileExists(itemsFile, homeId))) {
        await fileSystemService.writeFile<ItemsData>(itemsFile, {
          items: [],
        }, homeId);
        storageLogger.info(`Items file initialized for home ${homeId}`);
      }

      // Initialize todos for this home
      const todosFile = TODOS_FILE;
      if (!(await fileSystemService.fileExists(todosFile, homeId))) {
        await fileSystemService.writeFile<TodosData>(todosFile, {
          todos: [],
        }, homeId);
        storageLogger.info(`Todos file initialized for home ${homeId}`);
      }

      // Note: Todo categories and locations are managed via CRUD API, not file storage
      // They are NOT initialized here and do not have default values

    } catch (error) {
      storageLogger.error(`Error initializing home data for ${homeId}:`, error);
      throw error;
    }
  }

  /**
   * Check if data files are initialized
   */
  async isDataInitialized(): Promise<boolean> {
    const settingsExist = await fileSystemService.fileExists(SETTINGS_FILE);
    return settingsExist;
  }

  /**
   * Clear all data files and re-initialize them with default data
   */
  async clearAllDataFiles(): Promise<boolean> {
    try {
      // Delete all JSON files in the data directory
      const files = await fileSystemService.listJsonFiles();

      for (const file of files) {
        const deleted = await fileSystemService.deleteFile(file);
        if (!deleted) {
          storageLogger.error(`Failed to delete file: ${file}`);
          // Continue deleting other files even if one fails
        }
      }

      storageLogger.info('All data files deleted successfully');

      // Re-initialize with default data
      await this.initializeDataFiles();

      storageLogger.info('Data files re-initialized with defaults');
      return true;
    } catch (error) {
      storageLogger.error('Error clearing data files:', error);
      return false;
    }
  }
}

export const dataInitializationService = new DataInitializationService();
export type { DataInitializationService };
