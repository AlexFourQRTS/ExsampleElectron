import { BrowserWindow } from 'electron'
import { createMainWindow } from './mainWindow'

export class WindowManagerService {
  private static windows: Set<BrowserWindow> = new Set()

  static register(window: BrowserWindow): void {
    this.windows.add(window)
    window.on('closed', () => {
      this.windows.delete(window)
    })
  }

  static openNewWindow(path: string): BrowserWindow {
    const window = createMainWindow(path)
    this.register(window)
    return window
  }

  static getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows)
  }
}
