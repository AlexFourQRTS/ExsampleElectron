import { ipcMain } from "electron";
import { UserDirsService } from "../../services/sidebar/userDirsService";
import { DeviceService } from "../../services/sidebar/deviceService";

// Данные боковой панели: стандартные "Места" (Home/Desktop/...),
// примонтированные устройства и их отмонтирование
export function registerSidebarHandlers(): void {
  ipcMain.handle("getStandardPlaces", async () => await UserDirsService.getStandardPlaces());

  ipcMain.handle("getMountedDevices", async () => await DeviceService.getMountedDevices());

  ipcMain.handle("getRootDevice", () => DeviceService.getRootDevice());

  ipcMain.handle("unmountDevice", async (_, devicePath: string) => await DeviceService.unmountDevice(devicePath));
}
