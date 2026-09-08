import { ipcMain, shell } from "electron";
import fs from "fs/promises";
import { FileService } from "../../services/file/fileService";
import { MoveService } from "../../services/file/moveService";

// Операции над отдельными файлами/элементами (не над содержимым папки целиком):
// чтение, создание, удаление, переименование, перемещение, открытие в системе
export function registerFileHandlers(): void {
  ipcMain.handle("readFileText", async (_, filePath: string) => {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      throw new Error("Не удалось прочитать файл");
    }
  });

  ipcMain.handle(
    "getItemStats",
    async (_, itemPath: string) => await FileService.getItemStats(itemPath),
  );

  ipcMain.handle(
    "createFile",
    async (_, parentPath: string, fileName: string) => await FileService.createFile(parentPath, fileName),
  );

  ipcMain.handle("deleteItem", async (_, itemPath: string) => await FileService.deleteItem(itemPath));

  ipcMain.handle(
    "renameItem",
    async (_, oldPath: string, newName: string) => await FileService.renameItem(oldPath, newName),
  );

  ipcMain.handle(
    "moveItem",
    async (_, sourcePath: string, targetDir: string) => await MoveService.moveItem(sourcePath, targetDir),
  );

  ipcMain.handle(
    "moveItems",
    async (_, sourcePaths: string[], targetDir: string) =>
      await MoveService.moveItems(sourcePaths, targetDir),
  );

  ipcMain.handle("openWithSystem", async (_, itemPath: string) => {
    await shell.openPath(itemPath);
  });

  ipcMain.handle("showItemInFolder", (_, itemPath: string) => {
    shell.showItemInFolder(itemPath);
  });
}
