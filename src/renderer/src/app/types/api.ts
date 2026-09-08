export interface FileItemStats {
  size: number;
  createdAt: Date;
  updatedAt: Date;
  isFile: boolean;
  isDirectory: boolean;
  extension: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

declare global {
  interface Window {
    api: {
      getHomeDirectory: () => Promise<string>;
      ping: () => Promise<string>;
      openFolderDialog: () => Promise<string | null>;
      getItemStats: (path: string) => Promise<FileItemStats>;
      getOnlyDirectoriesTree: (path: string) => Promise<FileTreeNode>;
      getFolderFiles: (path: string) => Promise<FileTreeNode[]>;
      readFileText: (path: string) => Promise<string>;
      calculateFolderSize: (path: string) => Promise<number>;
      countFolderFiles: (path: string) => Promise<number>;
      createFolder: (parentPath: string, folderName: string) => Promise<string>;
      createFile: (parentPath: string, fileName: string) => Promise<string>;
      deleteItem: (path: string) => Promise<void>;
      renameItem: (oldPath: string, newName: string) => Promise<string>;
      countHiddenFolders: (path: string) => Promise<number>;
      getHiddenFolders: (path: string) => Promise<string[]>;
      hideFolder: (path: string) => Promise<void>;
      showFolder: (path: string) => Promise<void>;
      getHiddenFoldersList: () => Promise<string[]>;
      isFolderHidden: (path: string) => Promise<boolean>;
      getFolderFilesFiltered: (path: string) => Promise<FileTreeNode[]>;
      getOnlyDirectoriesTreeFiltered: (path: string) => Promise<FileTreeNode>;
      registerAsDefaultFileManager: () => Promise<void>;
      openTerminalAt: (dirPath: string) => Promise<void>;
      openWithSystem: (itemPath: string) => Promise<void>;
      showItemInFolder: (itemPath: string) => Promise<void>;
      compressItems: (itemPaths: string[], outputPath: string) => Promise<void>;
      extractArchive: (archivePath: string, outputDir: string) => Promise<void>;
      isArchive: (filePath: string) => Promise<boolean>;
      makeExecutable: (filePath: string) => Promise<void>;
      setPermissions: (filePath: string, mode: string) => Promise<void>;
      getPermissions: (filePath: string) => Promise<string>;
      clipboardCopy: (paths: string[]) => Promise<void>;
      clipboardCut: (paths: string[]) => Promise<void>;
      clipboardPaste: (targetDir: string) => Promise<void>;
      clipboardHasContent: () => Promise<boolean>;
      moveItem: (sourcePath: string, targetDir: string) => Promise<string>;
      moveItems: (sourcePaths: string[], targetDir: string) => Promise<string[]>;
      openNewWindow: (path: string) => Promise<void>;
    };
  }
}
