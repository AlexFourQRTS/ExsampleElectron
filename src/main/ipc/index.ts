import { ipcMain } from 'electron'
import { AppService } from '../execution/appService'

export function setupIpcHandlers(): void {
  // Канал 'ping' перенаправляем в слой выполнения
  ipcMain.handle('ping', async () => {
    return await AppService.doPing()
  })
}