import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { WindowStateService } from './windowStateService'

export function createMainWindow(initialPath?: string): BrowserWindow {
  const savedState = WindowStateService.load()

  const mainWindow = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
    }
  })

  if (savedState.isMaximized) {
    mainWindow.maximize()
  }

  WindowStateService.track(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  const query = initialPath ? { path: initialPath } : undefined

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = new URL(process.env['ELECTRON_RENDERER_URL'])
    if (initialPath) url.searchParams.set('path', initialPath)
    mainWindow.loadURL(url.toString())
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { query })
  }

  return mainWindow
}