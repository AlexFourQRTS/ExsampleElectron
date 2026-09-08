import { ipcRenderer } from 'electron';

export const coreApi = {
  ping: () => ipcRenderer.invoke('ping'),
  getHomeDirectory: () => ipcRenderer.invoke('getHomeDirectory'),
  openFolderDialog: () => ipcRenderer.invoke('openFolderDialog'),
};
