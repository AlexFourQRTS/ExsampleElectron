/**
 * Settings service
 * Saves/loads app settings from ~/.config/simple-explorer/settings.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { getConfigPath } from './platformUtils';
import { AppSettings } from '../../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  showHiddenFiles: false,
  showSystemHiddenFolders: true,
  hiddenFolderPaths: [],
  viewMode: 'list',
};

export class SettingsService {
  private static configDir: string | null = null;

  /**
   * Ensure config directory exists
   */
  private static async ensureConfigDir(): Promise<string> {
    if (!this.configDir) {
      this.configDir = getConfigPath();
      await fs.mkdir(this.configDir, { recursive: true });
    }
    return this.configDir;
  }

  /**
   * Get settings file path
   */
  private static async getSettingsPath(): Promise<string> {
    const configDir = await this.ensureConfigDir();
    return path.join(configDir, 'settings.json');
  }

  /**
   * Get current settings
   */
  static async getSettings(): Promise<AppSettings> {
    try {
      const filePath = await this.getSettingsPath();
      const data = await fs.readFile(filePath, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings
   */
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const filePath = await this.getSettingsPath();
      await fs.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Update specific settings
   */
  static async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await this.saveSettings(updated);
    return updated;
  }

  /**
   * Toggle show hidden files
   */
  static async toggleHiddenFiles(): Promise<AppSettings> {
    const current = await this.getSettings();
    return this.updateSettings({ showHiddenFiles: !current.showHiddenFiles });
  }

  /**
   * Toggle show user-hidden folders
   */
  static async toggleSystemHiddenFolders(): Promise<AppSettings> {
    const current = await this.getSettings();
    return this.updateSettings({
      showSystemHiddenFolders: !current.showSystemHiddenFolders,
    });
  }

  /**
   * Add folder to hidden list
   */
  static async hideFolder(folderPath: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.hiddenFolderPaths.includes(folderPath)) {
      settings.hiddenFolderPaths.push(folderPath);
      await this.saveSettings(settings);
    }
  }

  /**
   * Remove folder from hidden list
   */
  static async unhideFolder(folderPath: string): Promise<void> {
    const settings = await this.getSettings();
    settings.hiddenFolderPaths = settings.hiddenFolderPaths.filter((p) => p !== folderPath);
    await this.saveSettings(settings);
  }

  /**
   * Check if folder is hidden by user
   */
  static async isFolderHidden(folderPath: string): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.hiddenFolderPaths.includes(folderPath);
  }

  /**
   * Get count of hidden folders in path
   */
  static async getHiddenFoldersCount(dirPath: string): Promise<number> {
    const settings = await this.getSettings();
    return settings.hiddenFolderPaths.filter((p) => p.startsWith(dirPath) && p !== dirPath).length;
  }
}
