/**
 * Storage Service
 * Handles persisting app settings and configuration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../types';

const STORAGE_KEYS = {
  SERVER_URL: '@teslyrics:server_url',
  AUTO_SYNC: '@teslyrics:auto_sync',
  BACKGROUND_SYNC: '@teslyrics:background_sync',
  LAST_TRACK: '@teslyrics:last_track',
};

export class StorageService {
  /**
   * Save server URL
   */
  async saveServerUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
    } catch (error) {
      console.error('Error saving server URL:', error);
    }
  }

  /**
   * Get server URL
   */
  async getServerUrl(): Promise<string> {
    try {
      const url = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
      return url || 'http://192.168.4.1:3000';
    } catch (error) {
      console.error('Error getting server URL:', error);
      return 'http://192.168.4.1:3000';
    }
  }

  /**
   * Save auto sync setting
   */
  async saveAutoSync(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_SYNC, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving auto sync:', error);
    }
  }

  /**
   * Get auto sync setting
   */
  async getAutoSync(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
      return value ? JSON.parse(value) : true;
    } catch (error) {
      console.error('Error getting auto sync:', error);
      return true;
    }
  }

  /**
   * Save background sync setting
   */
  async saveBackgroundSync(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_SYNC, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving background sync:', error);
    }
  }

  /**
   * Get background sync setting
   */
  async getBackgroundSync(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_SYNC);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error('Error getting background sync:', error);
      return false;
    }
  }

  /**
   * Get full app configuration
   */
  async getConfig(): Promise<AppConfig> {
    const [serverUrl, autoSync, backgroundSync] = await Promise.all([
      this.getServerUrl(),
      this.getAutoSync(),
      this.getBackgroundSync(),
    ]);

    return {
      serverUrl,
      autoSync,
      backgroundSync,
    };
  }

  /**
   * Save full app configuration
   */
  async saveConfig(config: AppConfig): Promise<void> {
    await Promise.all([
      this.saveServerUrl(config.serverUrl),
      this.saveAutoSync(config.autoSync),
      this.saveBackgroundSync(config.backgroundSync),
    ]);
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storageService = new StorageService();
