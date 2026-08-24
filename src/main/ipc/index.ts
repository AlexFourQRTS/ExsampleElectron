import { ipcMain } from 'electron'
import { AppService } from '../execution/appService'

export function setupIpcHandlers(): void {
  ipcMain.handle('ping', async () => await AppService.doPing())
  
  ipcMain.handle('openFolderDialog', async () => await AppService.openFolderDialog())
  
  ipcMain.handle('getItemStats', async (_, itemPath: string) => 
    await AppService.getItemStats(itemPath)
  )
  
  ipcMain.handle('getOnlyDirectoriesTree', async (_, dirPath: string) => 
    await AppService.getOnlyDirectoriesTree(dirPath)
  )
  
  ipcMain.handle('getFolderFiles', async (_, dirPath: string) => 
    await AppService.getFolderFiles(dirPath)
  )
}