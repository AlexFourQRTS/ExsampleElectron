import { ipcMain } from "electron";
import { ThumbnailService } from "../../services/thumbnail/thumbnailService";

// Кэш миниатюр фото/видео (freedesktop.org Thumbnail Managing Standard)
export function registerThumbnailHandlers(): void {
  ipcMain.handle(
    "getCachedThumbnail",
    async (_, filePath: string) => await ThumbnailService.getCachedThumbnailPath(filePath),
  );

  ipcMain.handle(
    "saveThumbnail",
    async (_, filePath: string, base64Data: string) => await ThumbnailService.saveThumbnail(filePath, base64Data),
  );

  ipcMain.handle(
    "markThumbnailFailed",
    async (_, filePath: string) => await ThumbnailService.markAsFailed(filePath),
  );

  ipcMain.handle(
    "isThumbnailFailed",
    async (_, filePath: string) => await ThumbnailService.isMarkedAsFailed(filePath),
  );
}
