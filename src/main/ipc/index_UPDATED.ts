/**
 * IPC Handlers - Communication between main and renderer processes
 * UPDATED with new services
 */

import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import { AppService } from '../execution/appService';
import { SettingsService } from '../execution/settingsService';
import { sanitizePath } from '../execution/pathValidator';

export function setupIpcHandlers(): void {
  // ==========================================
  // FILE OPERATIONS
  // ==========================================

  ipcMain.handle('readFileText', async (_, filePath: string) => {
    try {
      const safePath = sanitizePath(filePath);
      if (!safePath) {
        throw new Error('Invalid path');
      }
      return await fs.readFile(safePath, 'utf-8');
    } catch (error) {
      throw new Error('Failed to read file');
    }
  });

  ipcMain.handle('ping', async () => await AppService.doPing());

  ipcMain.handle('openFolderDialog', async () => await AppService.openFolderDialog());

  ipcMain.handle('getItemStats', async (_, itemPath: string) => {
    const safePath = sanitizePath(itemPath);
    if (!safePath) {
      throw new Error('Invalid path');
    }
    return await AppService.getItemStats(safePath);
  });

  ipcMain.handle('getOnlyDirectoriesTree', async (_, dirPath: string) => {
    const safePath = sanitizePath(dirPath);
    if (!safePath) {
      throw new Error('Invalid path');
    }
    return await AppService.getOnlyDirectoriesTree(safePath);
  });

  ipcMain.handle('getFolderFiles', async (_, dirPath: string) => {
    const safePath = sanitizePath(dirPath);
    if (!safePath) {
      throw new Error('Invalid path');
    }
    return await AppService.getFolderFiles(safePath);
  });

  // ==========================================
  // SETTINGS
  // ==========================================

  ipcMain.handle('settings:get', async () => {
    return await SettingsService.getSettings();
  });

  ipcMain.handle('settings:set', async (_, settings) => {
    await SettingsService.saveSettings(settings);
    return settings;
  });

  ipcMain.handle('settings:toggleHiddenFiles', async () => {
    return await SettingsService.toggleHiddenFiles();
  });

  ipcMain.handle('settings:toggleSystemHiddenFolders', async () => {
    return await SettingsService.toggleSystemHiddenFolders();
  });

  // ==========================================
  // HIDDEN FOLDERS
  // ==========================================

  ipcMain.handle('folder:hideFolder', async (_, folderPath: string) => {
    const safePath = sanitizePath(folderPath);
    if (!safePath) {
      throw new Error('Invalid path');
    }
    await SettingsService.hideFolder(safePath);
  });

  ipcMain.handle('folder:unhideFolder', async (_, folderPath: string) => {
    const safePath = sanitizePath(folderPath);
    if (!safePath) {
      throw new Error('Invalid path');
    }
    await SettingsService.unhideFolder(safePath);
  });

  ipcMain.handle('folder:isFolderHidden', async (_, folderPath: string) => {
    const safePath = sanitizePath(folderPath);
    if (!safePath) {
      throw new Error('Invalid path');
    }
    return await SettingsService.isFolderHidden(safePath);
  });
}
