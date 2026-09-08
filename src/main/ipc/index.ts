import { ipcMain, shell } from "electron";
import { AppService } from "../execution/appService";
import { TerminalService } from "../execution/terminalService";
import { ArchiveService } from "../execution/archiveService";
import { PermissionsService } from "../execution/permissionsService";
import { ClipboardFileService } from "../execution/clipboardFileService";
import { MoveService } from "../execution/moveService";
import { WindowManagerService } from "../windows/windowManagerService";
import { UserDirsService } from "../execution/userDirsService";
import { DeviceService } from "../execution/deviceService";
import { ThumbnailService } from "../execution/thumbnailService";
import fs from "fs/promises";

export function setupIpcHandlers(): void {
  ipcMain.on("renderer-log", (_, { level, args }) => {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const message = args.map((arg: any) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(" ");

    const prefix = `[${timestamp}] [RENDERER]`;
    switch (level) {
      case "error":
        console.error(`${prefix} ❌`, message);
        break;
      case "warn":
        console.warn(`${prefix} ⚠️`, message);
        break;
      case "info":
        console.info(`${prefix} ℹ️`, message);
        break;
      default:
        console.log(`${prefix}`, message);
    }
  });

  ipcMain.handle("getHomeDirectory", () => AppService.getHomeDirectory());

  ipcMain.handle("readFileText", async (_, filePath: string) => {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      throw new Error("Не удалось прочитать файл");
    }
  });

  ipcMain.handle("ping", async () => await AppService.doPing());

  ipcMain.handle(
    "openFolderDialog",
    async () => await AppService.openFolderDialog(),
  );

  ipcMain.handle(
    "getItemStats",
    async (_, itemPath: string) => await AppService.getItemStats(itemPath),
  );

  ipcMain.handle(
    "getOnlyDirectoriesTree",
    async (_, dirPath: string) =>
      await AppService.getOnlyDirectoriesTree(dirPath),
  );

  ipcMain.handle(
    "getFolderFiles",
    async (_, dirPath: string) => await AppService.getFolderFiles(dirPath),
  );

  ipcMain.handle(
    "calculateFolderSize",
    async (_, dirPath: string) => await AppService.calculateFolderSize(dirPath),
  );

  ipcMain.handle(
    "countFolderFiles",
    async (_, dirPath: string) => await AppService.countFolderFiles(dirPath),
  );

  ipcMain.handle(
    "createFolder",
    async (_, parentPath: string, folderName: string) =>
      await AppService.createFolder(parentPath, folderName),
  );

  ipcMain.handle(
    "createFile",
    async (_, parentPath: string, fileName: string) =>
      await AppService.createFile(parentPath, fileName),
  );

  ipcMain.handle(
    "deleteItem",
    async (_, itemPath: string) => await AppService.deleteItem(itemPath),
  );

  ipcMain.handle(
    "renameItem",
    async (_, oldPath: string, newName: string) =>
      await AppService.renameItem(oldPath, newName),
  );

  ipcMain.handle(
    "countHiddenFolders",
    async (_, dirPath: string) =>
      await AppService.countHiddenFolders(dirPath),
  );

  ipcMain.handle(
    "getHiddenFolders",
    async (_, dirPath: string) =>
      await AppService.getHiddenFolders(dirPath),
  );

  ipcMain.handle(
    "hideFolder",
    async (_, folderPath: string) =>
      await AppService.hideFolder(folderPath),
  );

  ipcMain.handle(
    "showFolder",
    async (_, folderPath: string) =>
      await AppService.showFolder(folderPath),
  );

  ipcMain.handle(
    "getHiddenFoldersList",
    async () => await AppService.getHiddenFoldersList(),
  );

  ipcMain.handle(
    "isFolderHidden",
    async (_, folderPath: string) =>
      await AppService.isFolderHidden(folderPath),
  );

  ipcMain.handle(
    "getFolderFilesFiltered",
    async (_, dirPath: string) =>
      await AppService.getFolderFilesFiltered(dirPath),
  );

  ipcMain.handle(
    "getOnlyDirectoriesTreeFiltered",
    async (_, dirPath: string) =>
      await AppService.getOnlyDirectoriesTreeFiltered(dirPath),
  );

  ipcMain.handle(
    "registerAsDefaultFileManager",
    async () => await AppService.registerAsDefaultFileManager(),
  );

  ipcMain.handle("generateSudoInstallCommand", () =>
    AppService.generateSudoInstallCommand(),
  );

  // Терминал
  ipcMain.handle("openTerminalAt", (_, dirPath: string) => {
    TerminalService.openTerminalAt(dirPath);
  });

  // Открыть файл/папку в системном приложении по умолчанию
  ipcMain.handle("openWithSystem", async (_, itemPath: string) => {
    await shell.openPath(itemPath);
  });

  ipcMain.handle("showItemInFolder", (_, itemPath: string) => {
    shell.showItemInFolder(itemPath);
  });

  // Архивация
  ipcMain.handle(
    "compressItems",
    async (_, itemPaths: string[], outputPath: string) =>
      await ArchiveService.compress(itemPaths, outputPath),
  );

  ipcMain.handle(
    "extractArchive",
    async (_, archivePath: string, outputDir: string) =>
      await ArchiveService.extract(archivePath, outputDir),
  );

  ipcMain.handle("isArchive", (_, filePath: string) =>
    ArchiveService.isArchive(filePath),
  );

  // Права доступа
  ipcMain.handle(
    "makeExecutable",
    async (_, filePath: string) => await PermissionsService.makeExecutable(filePath),
  );

  ipcMain.handle(
    "setPermissions",
    async (_, filePath: string, mode: string) =>
      await PermissionsService.setPermissions(filePath, mode),
  );

  ipcMain.handle(
    "getPermissions",
    async (_, filePath: string) => await PermissionsService.getPermissions(filePath),
  );

  // Буфер обмена файлов
  ipcMain.handle("clipboardCopy", (_, paths: string[]) => {
    ClipboardFileService.copy(paths);
  });

  ipcMain.handle("clipboardCut", (_, paths: string[]) => {
    ClipboardFileService.cut(paths);
  });

  ipcMain.handle("clipboardPaste", async (_, targetDir: string) => {
    await ClipboardFileService.paste(targetDir);
  });

  ipcMain.handle("clipboardHasContent", () => {
    return ClipboardFileService.getClipboard() !== null;
  });

  // Перемещение файлов (drag-and-drop)
  ipcMain.handle(
    "moveItem",
    async (_, sourcePath: string, targetDir: string) =>
      await MoveService.moveItem(sourcePath, targetDir),
  );

  ipcMain.handle(
    "moveItems",
    async (_, sourcePaths: string[], targetDir: string) =>
      await MoveService.moveItems(sourcePaths, targetDir),
  );

  // Открытие нового окна с определённой папкой
  ipcMain.handle("openNewWindow", (_, path: string) => {
    WindowManagerService.openNewWindow(path);
  });

  // Боковая панель: стандартные "Места" и примонтированные устройства
  ipcMain.handle("getStandardPlaces", async () => await UserDirsService.getStandardPlaces());

  ipcMain.handle("getMountedDevices", async () => await DeviceService.getMountedDevices());

  ipcMain.handle("getRootDevice", () => DeviceService.getRootDevice());

  // Кэш миниатюр фото/видео
  ipcMain.handle(
    "getCachedThumbnail",
    async (_, filePath: string) => await ThumbnailService.getCachedThumbnailPath(filePath),
  );

  ipcMain.handle(
    "saveThumbnail",
    async (_, filePath: string, base64Data: string) =>
      await ThumbnailService.saveThumbnail(filePath, base64Data),
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
