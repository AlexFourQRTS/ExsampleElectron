/**
 * Shared types for SimpleExplorer
 * Used across main process and renderer
 */

export type FileItemStats = {
  size: number;
  createdAt: Date;
  updatedAt: Date;
  isFile: boolean;
  isDirectory: boolean;
  extension: string;
};

export type FileTreeNode = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
};

export type FileDetailItem = FileTreeNode & {
  stats?: FileItemStats;
};

export type Bookmark = {
  id: string;
  name: string;
  path: string;
  addedAt: Date;
  lastUsed?: Date;
};

export type HiddenStats = {
  dotfiles: number;
  userHidden: number;
};

export type FolderStats = {
  size: number;
  fileCount: number;
  dirCount: number;
  modifiedAt: Date;
  calculatedAt: Date;
};

export type AppSettings = {
  showHiddenFiles: boolean;
  showSystemHiddenFolders: boolean;
  hiddenFolderPaths: string[];
  viewMode: 'list' | 'grid';
  lastOpenedPath?: string;
};

export type ContextMenuAction =
  | 'open'
  | 'openWith'
  | 'showIn'
  | 'new-folder'
  | 'new-file'
  | 'new-script'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'copyPath'
  | 'rename'
  | 'compress'
  | 'delete'
  | 'properties'
  | 'hideFolder'
  | 'unhideFolder'
  | 'showHiddenFiles'
  | 'hideHiddenFiles';
