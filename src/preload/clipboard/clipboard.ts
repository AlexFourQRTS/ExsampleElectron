import { ipcRenderer } from 'electron';

export const clipboardApi = {
  clipboardCopy: (paths: string[]) => ipcRenderer.invoke('clipboardCopy', paths),
  clipboardCut: (paths: string[]) => ipcRenderer.invoke('clipboardCut', paths),
  clipboardPaste: (targetDir: string) => ipcRenderer.invoke('clipboardPaste', targetDir),
  clipboardHasContent: () => ipcRenderer.invoke('clipboardHasContent'),
};
