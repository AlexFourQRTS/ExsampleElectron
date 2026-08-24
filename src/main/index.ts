import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows/mainWindow'
import { setupIpcHandlers } from './ipc'

app.whenReady().then(() => {
  // 1. Инициализируем IPC-каналы
  setupIpcHandlers()

  // 2. Создаем дефолтное окно
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})