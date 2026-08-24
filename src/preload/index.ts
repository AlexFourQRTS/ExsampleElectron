import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('ping'),
  openFolderDialog: () => ipcRenderer.invoke('openFolderDialog'),
  getItemStats: (path: string) => ipcRenderer.invoke('getItemStats', path),
  getOnlyDirectoriesTree: (path: string) => ipcRenderer.invoke('getOnlyDirectoriesTree', path),
  getFolderFiles: (path: string) => ipcRenderer.invoke('getFolderFiles', path),
})