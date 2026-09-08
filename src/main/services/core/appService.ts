import { dialog } from 'electron'
import * as fsSync from 'fs'
import * as os from 'os'

// Общеприкладные операции, не относящиеся ни к домену "папки", ни к
// домену "файлы": стартовая папка, диалог выбора папки, разбор аргументов
// запуска. Файловые и папочные операции — в FileService/FolderService,
// системная интеграция (проводник по умолчанию) — в DefaultFileManagerService.
export class AppService {
  static getHomeDirectory(): string {
    return os.platform() === 'win32' ? process.env.USERPROFILE || 'C:\\' : '/home'
  }

  static async doPing(): Promise<string> {
    return 'pong от слоя выполнения!'
  }

  static async openFolderDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  }

  // Открытие папки из аргументов командной строки — так система передаёт
  // путь при двойном клике на папку, назначенную этому приложению через
  // DefaultFileManagerService.registerAsDefaultFileManager()
  static getFolderFromArgs(argv: string[] = process.argv): string | null {
    for (const arg of argv) {
      if (arg.startsWith('--folder=')) {
        return this.resolveDirectoryArg(arg.substring(9))
      }
    }

    // Ищем последний аргумент, реально указывающий на существующую директорию.
    // В dev-режиме argv = [electronBin, appPath, ...userArgs], в packaged-режиме
    // argv = [appBin, ...userArgs] — поэтому проверяем реальное существование,
    // а не полагаемся на позицию аргумента. DE часто передаёт file:// URL.
    for (let i = argv.length - 1; i >= 0; i--) {
      const arg = argv[i]
      if (arg.startsWith('-')) continue
      const directory = this.resolveDirectoryArg(arg)
      if (directory) {
        return directory
      }
    }
    return null
  }

  private static resolveDirectoryArg(arg: string): string | null {
    let candidate = arg
    if (candidate.startsWith('file://')) {
      try {
        candidate = decodeURIComponent(new URL(candidate).pathname)
      } catch {
        return null
      }
    }

    try {
      if (fsSync.statSync(candidate).isDirectory()) {
        return candidate
      }
    } catch {
      return null
    }
    return null
  }
}
