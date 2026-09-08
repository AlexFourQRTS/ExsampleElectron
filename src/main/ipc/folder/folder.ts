import { ipcMain } from "electron";
import { FolderService } from "../../services/folder/folderService";
import { HiddenFoldersService } from "../../services/folder/hiddenFoldersService";

// Всё, что касается папок: построение дерева, статистика, создание,
// и управление списком скрытых пользователем папок
export function registerFolderHandlers(): void {
  ipcMain.handle(
    "getOnlyDirectoriesTree",
    async (_, dirPath: string) => await FolderService.getOnlyDirectoriesTree(dirPath),
  );

  ipcMain.handle(
    "getFolderFiles",
    async (_, dirPath: string) => await FolderService.getFolderFiles(dirPath),
  );

  ipcMain.handle(
    "getFolderFilesFiltered",
    async (_, dirPath: string) => await FolderService.getFolderFilesFiltered(dirPath),
  );

  ipcMain.handle(
    "getOnlyDirectoriesTreeFiltered",
    async (_, dirPath: string) => await FolderService.getOnlyDirectoriesTreeFiltered(dirPath),
  );

  ipcMain.handle(
    "calculateFolderSize",
    async (_, dirPath: string) => await FolderService.calculateFolderSize(dirPath),
  );

  ipcMain.handle(
    "countFolderFiles",
    async (_, dirPath: string) => await FolderService.countFolderFiles(dirPath),
  );

  ipcMain.handle(
    "createFolder",
    async (_, parentPath: string, folderName: string) =>
      await FolderService.createFolder(parentPath, folderName),
  );

  // Скрытые пользователем папки (не дотфайлы, а явно спрятанные через меню)
  ipcMain.handle(
    "countHiddenFolders",
    async (_, dirPath: string) => await HiddenFoldersService.countHiddenFolders(dirPath),
  );

  ipcMain.handle(
    "getHiddenFolders",
    async (_, dirPath: string) => await HiddenFoldersService.getHiddenFolders(dirPath),
  );

  ipcMain.handle("hideFolder", async (_, folderPath: string) => await HiddenFoldersService.hideFolder(folderPath));

  ipcMain.handle("showFolder", async (_, folderPath: string) => await HiddenFoldersService.showFolder(folderPath));

  ipcMain.handle("getHiddenFoldersList", async () => await HiddenFoldersService.getHiddenFoldersList());

  ipcMain.handle(
    "isFolderHidden",
    async (_, folderPath: string) => await HiddenFoldersService.isFolderHidden(folderPath),
  );
}
