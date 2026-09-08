import { ipcRenderer } from 'electron';

export const thumbnailApi = {
  getCachedThumbnail: (filePath: string) => ipcRenderer.invoke('getCachedThumbnail', filePath),
  saveThumbnail: (filePath: string, base64Data: string) => ipcRenderer.invoke('saveThumbnail', filePath, base64Data),
  markThumbnailFailed: (filePath: string) => ipcRenderer.invoke('markThumbnailFailed', filePath),
  isThumbnailFailed: (filePath: string) => ipcRenderer.invoke('isThumbnailFailed', filePath),
};
