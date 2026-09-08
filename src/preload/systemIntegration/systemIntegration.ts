import { ipcRenderer } from 'electron';

export const systemIntegrationApi = {
  openTerminalAt: (dirPath: string) => ipcRenderer.invoke('openTerminalAt', dirPath),
  openNewWindow: (path: string) => ipcRenderer.invoke('openNewWindow', path),
  registerAsDefaultFileManager: () => ipcRenderer.invoke('registerAsDefaultFileManager'),
  generateSudoInstallCommand: () => ipcRenderer.invoke('generateSudoInstallCommand'),
};
