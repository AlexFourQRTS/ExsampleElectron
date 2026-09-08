import { ipcRenderer } from 'electron';

export const fileApi = {
  readFileText: (path: string) => ipcRenderer.invoke('readFileText', path),
  getItemStats: (path: string) => ipcRenderer.invoke('getItemStats', path),
  createFile: (parentPath: string, fileName: string) => ipcRenderer.invoke('createFile', parentPath, fileName),
  deleteItem: (path: string) => ipcRenderer.invoke('deleteItem', path),
  renameItem: (oldPath: string, newName: string) => ipcRenderer.invoke('renameItem', oldPath, newName),
  moveItem: (sourcePath: string, targetDir: string) => ipcRenderer.invoke('moveItem', sourcePath, targetDir),
  moveItems: (sourcePaths: string[], targetDir: string) => ipcRenderer.invoke('moveItems', sourcePaths, targetDir),
  openWithSystem: (itemPath: string) => ipcRenderer.invoke('openWithSystem', itemPath),
  showItemInFolder: (itemPath: string) => ipcRenderer.invoke('showItemInFolder', itemPath),
};
