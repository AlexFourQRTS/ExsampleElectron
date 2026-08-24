import { ipcMain } from 'electron'
import { AppService } from '../execution/appService'

export function setupIpcHandlers(): void {
  // 1. Пинг
  ipcMain.handle('ping', async () => {
    return await AppService.doPing()
  })

  // 2. Открытие системного диалога выбора папки
  ipcMain.handle('openFolderDialog', async () => {
    return await AppService.openFolderDialog()
  })

  // 3. Получение метаданных (размер, даты)
  ipcMain.handle('getItemStats', async (_, itemPath: string) => {
    return await AppService.getItemStats(itemPath)
  })

  // 4. Построение полного дерева папки
  ipcMain.handle('getDirectoryTree', async (_, dirPath: string) => {
    return await AppService.getDirectoryTree(dirPath)
  })

  // 5. Поверхностное чтение содержимого папки
  ipcMain.handle('readDirectoryContent', async (_, dirPath: string) => {
    return await AppService.readDirectoryContent(dirPath)
  })
}