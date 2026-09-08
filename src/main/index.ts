import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows/mainWindow'
import { WindowManagerService } from './windows/windowManagerService'
import { setupIpcHandlers } from './ipc'
import { AppService } from './services/core/appService'

// Не даём запускать несколько экземпляров приложения: система при открытии
// папки через "проводник по умолчанию" запускает новый процесс — мы должны
// передать его аргументы уже работающему процессу и открыть там новое окно.
const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const folderPath = AppService.getFolderFromArgs(argv)
    if (folderPath) {
      const window = WindowManagerService.openNewWindow(folderPath)
      window.focus()
    } else {
      const windows = WindowManagerService.getAllWindows()
      windows[0]?.focus()
    }
  })

  app.whenReady().then(() => {
    // 1. Инициализируем IPC-каналы
    setupIpcHandlers()

    // 2. Создаем дефолтное окно — если приложение запущено системой с
    // указанием конкретной папки (двойной клик через "проводник по
    // умолчанию"), сразу открываем её
    const initialPath = AppService.getFolderFromArgs() || undefined
    const mainWindow = createMainWindow(initialPath)
    WindowManagerService.register(mainWindow)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        const window = createMainWindow()
        WindowManagerService.register(window)
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}