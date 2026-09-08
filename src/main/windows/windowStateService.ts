import { BrowserWindow, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized: boolean
}

const DEFAULT_STATE: WindowState = {
  width: 900,
  height: 670,
  isMaximized: false,
}

// Сохраняем геометрию окна между запусками — отдельный файл в userData,
// а не localStorage, потому что размер самого окна задаётся ДО того,
// как renderer (и localStorage внутри него) вообще успевает загрузиться
export class WindowStateService {
  private static getFilePath(): string {
    return path.join(app.getPath('userData'), 'window-state.json')
  }

  static load(): WindowState {
    try {
      const raw = fs.readFileSync(this.getFilePath(), 'utf-8')
      return { ...DEFAULT_STATE, ...JSON.parse(raw) }
    } catch {
      return DEFAULT_STATE
    }
  }

  static save(state: WindowState): void {
    try {
      fs.writeFileSync(this.getFilePath(), JSON.stringify(state, null, 2), 'utf-8')
    } catch (error) {
      console.error('Не удалось сохранить состояние окна:', error)
    }
  }

  // Подписывается на изменения окна и сохраняет их с debounce, чтобы не
  // писать на диск при каждом пикселе resize
  static track(window: BrowserWindow): void {
    let saveTimeout: NodeJS.Timeout | null = null

    const scheduleSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        if (window.isDestroyed()) return

        const isMaximized = window.isMaximized()
        const bounds = window.getNormalBounds()

        this.save({
          width: bounds.width,
          height: bounds.height,
          x: bounds.x,
          y: bounds.y,
          isMaximized,
        })
      }, 400)
    }

    window.on('resize', scheduleSave)
    window.on('move', scheduleSave)
    window.on('maximize', scheduleSave)
    window.on('unmaximize', scheduleSave)
  }
}
