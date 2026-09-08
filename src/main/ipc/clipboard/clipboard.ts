import { ipcMain } from "electron";
import { ClipboardFileService } from "../../services/clipboard/clipboardFileService";

// Буфер обмена файлов: вырезать/копировать/вставить между папками и окнами
export function registerClipboardHandlers(): void {
  ipcMain.handle("clipboardCopy", (_, paths: string[]) => {
    ClipboardFileService.copy(paths);
  });

  ipcMain.handle("clipboardCut", (_, paths: string[]) => {
    ClipboardFileService.cut(paths);
  });

  ipcMain.handle("clipboardPaste", async (_, targetDir: string) => {
    await ClipboardFileService.paste(targetDir);
  });

  ipcMain.handle("clipboardHasContent", () => ClipboardFileService.getClipboard() !== null);
}
