/**
 * Path validation and sanitization
 * Prevents directory traversal and other path attacks
 */

import * as path from 'path';
import { homedir } from 'os';

const ALLOWED_ROOTS = [
  homedir(),
  '/home',
  '/root',
  '/tmp',
  '/var',
  '/opt',
  '/usr/local',
  '/mnt',
  '/media',
  '/',
];

/**
 * Validate if path is safe to access
 * Prevents directory traversal attacks
 * @param inputPath Path to validate
 * @returns true if path is safe
 */
export const validatePath = (inputPath: string): boolean => {
  if (!inputPath || typeof inputPath !== 'string') {
    return false;
  }

  try {
    const normalized = path.normalize(inputPath);
    const resolved = path.resolve(normalized);

    // Prevent directory traversal
    if (resolved.includes('..') || resolved.includes('~')) {
      return false;
    }

    // Allow only specific root directories
    return ALLOWED_ROOTS.some((root) => {
      return resolved === root || resolved.startsWith(root + path.sep);
    });
  } catch {
    return false;
  }
};

/**
 * Sanitize path for safe usage
 * @param inputPath Path to sanitize
 * @returns Normalized path or null if invalid
 */
export const sanitizePath = (inputPath: string): string | null => {
  if (!validatePath(inputPath)) {
    return null;
  }

  try {
    return path.normalize(inputPath);
  } catch {
    return null;
  }
};

/**
 * Resolve home directory (~)
 */
export const expandHomePath = (inputPath: string): string => {
  if (inputPath.startsWith('~')) {
    return path.join(homedir(), inputPath.slice(1));
  }
  return inputPath;
};
