import { ipcRenderer } from 'electron';

export const sidebarApi = {
  getStandardPlaces: () => ipcRenderer.invoke('getStandardPlaces'),
  getMountedDevices: () => ipcRenderer.invoke('getMountedDevices'),
  getRootDevice: () => ipcRenderer.invoke('getRootDevice'),
  unmountDevice: (devicePath: string) => ipcRenderer.invoke('unmountDevice', devicePath),
};
