import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('ping'),
  openFolderDialog: () => ipcRenderer.invoke('openFolderDialog'),
  getItemStats: (path: string) => ipcRenderer.invoke('getItemStats', path),
  getDirectoryTree: (path: string) => ipcRenderer.invoke('getDirectoryTree', path),
  readDirectoryContent: (path: string) => ipcRenderer.invoke('readDirectoryContent', path),
})