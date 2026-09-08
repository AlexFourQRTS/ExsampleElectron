import { ipcMain } from "electron";
import { DefaultFileManagerService } from "../../services/systemIntegration/defaultFileManagerService";
import { TerminalService } from "../../services/systemIntegration/terminalService";
import { WindowManagerService } from "../../windows/windowManagerService";

// Всё, что интегрирует приложение с системой и оконным менеджером:
// открыть терминал в папке, новое окно, регистрация как проводника по умолчанию
export function registerSystemIntegrationHandlers(): void {
  ipcMain.handle("openTerminalAt", (_, dirPath: string) => {
    TerminalService.openTerminalAt(dirPath);
  });

  ipcMain.handle("openNewWindow", (_, path: string) => {
    WindowManagerService.openNewWindow(path);
  });

  ipcMain.handle(
    "registerAsDefaultFileManager",
    async () => await DefaultFileManagerService.registerAsDefaultFileManager(),
  );

  ipcMain.handle("generateSudoInstallCommand", () => DefaultFileManagerService.generateSudoInstallCommand());
}
