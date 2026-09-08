import { ipcRenderer } from 'electron';

export const folderApi = {
  getOnlyDirectoriesTree: (path: string) => ipcRenderer.invoke('getOnlyDirectoriesTree', path),
  getFolderFiles: (path: string) => ipcRenderer.invoke('getFolderFiles', path),
  getFolderFilesFiltered: (path: string) => ipcRenderer.invoke('getFolderFilesFiltered', path),
  getOnlyDirectoriesTreeFiltered: (path: string) => ipcRenderer.invoke('getOnlyDirectoriesTreeFiltered', path),
  calculateFolderSize: (path: string) => ipcRenderer.invoke('calculateFolderSize', path),
  countFolderFiles: (path: string) => ipcRenderer.invoke('countFolderFiles', path),
  createFolder: (parentPath: string, folderName: string) => ipcRenderer.invoke('createFolder', parentPath, folderName),
  countHiddenFolders: (path: string) => ipcRenderer.invoke('countHiddenFolders', path),
  getHiddenFolders: (path: string) => ipcRenderer.invoke('getHiddenFolders', path),
  hideFolder: (path: string) => ipcRenderer.invoke('hideFolder', path),
  showFolder: (path: string) => ipcRenderer.invoke('showFolder', path),
  getHiddenFoldersList: () => ipcRenderer.invoke('getHiddenFoldersList'),
  isFolderHidden: (path: string) => ipcRenderer.invoke('isFolderHidden', path),
};
