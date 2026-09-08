import { ipcRenderer } from 'electron';

export const permissionsApi = {
  makeExecutable: (filePath: string) => ipcRenderer.invoke('makeExecutable', filePath),
  setPermissions: (filePath: string, mode: string) => ipcRenderer.invoke('setPermissions', filePath, mode),
  getPermissions: (filePath: string) => ipcRenderer.invoke('getPermissions', filePath),
};
