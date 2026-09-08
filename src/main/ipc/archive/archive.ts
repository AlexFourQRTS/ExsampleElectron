import { ipcMain } from "electron";
import { ArchiveService } from "../../services/archive/archiveService";

// Сжатие/извлечение архивов из контекстного меню
export function registerArchiveHandlers(): void {
  ipcMain.handle(
    "compressItems",
    async (_, itemPaths: string[], outputPath: string) => await ArchiveService.compress(itemPaths, outputPath),
  );

  ipcMain.handle(
    "extractArchive",
    async (_, archivePath: string, outputDir: string) => await ArchiveService.extract(archivePath, outputDir),
  );

  ipcMain.handle("isArchive", (_, filePath: string) => ArchiveService.isArchive(filePath));
}
