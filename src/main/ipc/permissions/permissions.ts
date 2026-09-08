import { ipcMain } from "electron";
import { PermissionsService } from "../../services/permissions/permissionsService";

// Права доступа: chmod +x из меню, чтение/установка режима вручную
export function registerPermissionsHandlers(): void {
  ipcMain.handle("makeExecutable", async (_, filePath: string) => await PermissionsService.makeExecutable(filePath));

  ipcMain.handle(
    "setPermissions",
    async (_, filePath: string, mode: string) => await PermissionsService.setPermissions(filePath, mode),
  );

  ipcMain.handle("getPermissions", async (_, filePath: string) => await PermissionsService.getPermissions(filePath));
}
