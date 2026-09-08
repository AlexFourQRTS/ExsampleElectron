import { ipcRenderer } from 'electron';

export const archiveApi = {
  compressItems: (itemPaths: string[], outputPath: string) => ipcRenderer.invoke('compressItems', itemPaths, outputPath),
  extractArchive: (archivePath: string, outputDir: string) => ipcRenderer.invoke('extractArchive', archivePath, outputDir),
  isArchive: (filePath: string) => ipcRenderer.invoke('isArchive', filePath),
};
