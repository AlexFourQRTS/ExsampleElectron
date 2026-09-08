import { ipcMain } from "electron";
import { AppService } from "../../services/core/appService";

// Базовые системные каналы: приложение целиком, диалог выбора папки,
// проброс логов из renderer в терминал main-процесса
export function registerCoreHandlers(): void {
  ipcMain.on("renderer-log", (_, { level, args }) => {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const message = args
      .map((arg: any) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(" ");

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

  ipcMain.handle("ping", async () => await AppService.doPing());
  ipcMain.handle("getHomeDirectory", () => AppService.getHomeDirectory());
  ipcMain.handle("openFolderDialog", async () => await AppService.openFolderDialog());
}
