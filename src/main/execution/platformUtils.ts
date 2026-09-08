/**
 * Platform-specific utilities for Linux/macOS
 * For v1.0: Linux only (macOS deferred)
 */

import { homedir } from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type Platform = 'linux' | 'darwin';

/**
 * Get current platform
 * @throws Error if platform is not supported (Windows)
 */
export const getPlatform = (): Platform => {
  const p = process.platform;
  if (p === 'linux') return 'linux';
  if (p === 'darwin') return 'darwin';
  throw new Error(`Unsupported platform: ${p}`);
};

export const isLinux = (): boolean => {
  try {
    return getPlatform() === 'linux';
  } catch {
    return false;
  }
};

export const isMacOS = (): boolean => {
  try {
    return getPlatform() === 'darwin';
  } catch {
    return false;
  }
};

/**
 * Get config directory path
 * Linux: ~/.config/simple-explorer
 * macOS: ~/Library/Application Support/SimpleExplorer
 */
export const getConfigPath = (): string => {
  const home = homedir();
  if (isLinux()) {
    return path.join(home, '.config', 'simple-explorer');
  }
  // For v1.0, Linux only. Extend for macOS later
  throw new Error('Unsupported platform');
};

/**
 * Get system quick-access paths
 */
export const getSystemPaths = (): Array<{ name: string; path: string }> => {
  const home = homedir();

  if (isLinux()) {
    return [
      { name: 'Home', path: home },
      { name: 'Desktop', path: path.join(home, 'Desktop') },
      { name: 'Downloads', path: path.join(home, 'Downloads') },
      { name: 'Documents', path: path.join(home, 'Documents') },
      { name: 'Root (/)', path: '/' },
    ];
  }

  return [];
};

/**
 * Show file in system file manager
 * Linux: xdg-open folder
 * macOS: open -R file
 */
export const showInFileManager = async (filePath: string): Promise<void> => {
  try {
    if (isLinux()) {
      await execFileAsync('xdg-open', [path.dirname(filePath)]);
    } else if (isMacOS()) {
      await execFileAsync('open', ['-R', filePath]);
    }
  } catch (error) {
    console.error('Failed to show in file manager:', error);
    throw error;
  }
};

/**
 * Get file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
