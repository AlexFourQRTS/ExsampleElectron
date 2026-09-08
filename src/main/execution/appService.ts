import { dialog, app } from 'electron'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import * as os from 'os'

// ==========================================
// ТИПИЗАЦИЯ
// ==========================================

export interface FileItemStats {
  size: number
  createdAt: Date
  updatedAt: Date
  isFile: boolean
  isDirectory: boolean
  extension: string
}

export interface FileTreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
}

// ==========================================
// СЛУЖЕБНЫЙ КЛАСС APP SERVICE
// ==========================================

export class AppService {
  // 0. Получить папку по умолчанию для первого запуска
  static getHomeDirectory(): string {
    return os.platform() === 'win32' ? process.env.USERPROFILE || 'C:\\' : '/home'
  }

  // 1. Пинг
  static async doPing(): Promise<string> {
    return 'pong от слоя выполнения!'
  }

  // 2. Открытие системного диалога выбора папки
  static async openFolderDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0] // Возвращает абсолютный путь к выбранной папке
  }

  // 3. Получение метаданных (размер, даты создания/изменения)
  static async getItemStats(itemPath: string): Promise<FileItemStats> {
    const stats = await fs.stat(itemPath)
    const ext = path.extname(itemPath)

    return {
      size: stats.size, // Размер в байтах
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      extension: ext,
    }
  }

  // 4. Построение полного дерева директории (с рекурсией)
  static async getDirectoryTree(dirPath: string): Promise<FileTreeNode> {
    const name = path.basename(dirPath) || dirPath
    const stats = await fs.stat(dirPath)

    if (!stats.isDirectory()) {
      return {
        id: dirPath,
        name,
        path: dirPath,
        type: 'file',
      }
    }

    let entries: import('fs').Dirent[] = []
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true })
    } catch {
      // Возвращаем пустую папку, если нет прав на чтение
      return { id: dirPath, name, path: dirPath, type: 'directory', children: [] }
    }

    // Исключаем системные скрытые файлы (.DS_Store и т.д.)
    const filteredEntries = entries.filter((e) => !e.name.startsWith('.'))

    const children = await Promise.all(
      filteredEntries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
          return await AppService.getDirectoryTree(fullPath)
        }
        return {
          id: fullPath,
          name: entry.name,
          path: fullPath,
          type: 'file' as const,
        }
      })
    )

    return {
      id: dirPath,
      name,
      path: dirPath,
      type: 'directory',
      children,
    }
  }

  // 5. Поверхностное чтение папки без глубокой рекурсии
  static async readDirectoryContent(dirPath: string): Promise<FileTreeNode[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      return entries
        .filter((e) => !e.name.startsWith('.'))
        .map((entry) => {
          const fullPath = path.join(dirPath, entry.name)
          return {
            id: fullPath,
            name: entry.name,
            path: fullPath,
            type: entry.isDirectory() ? 'directory' : 'file',
          }
        })
    } catch {
      return []
    }
  }

  // 6. Построение дерева ТОЛЬКО из папок (для компонента Tree.tsx)
  static async getOnlyDirectoriesTree(dirPath: string): Promise<FileTreeNode> {
    const name = path.basename(dirPath) || dirPath

    let entries: import('fs').Dirent[] = []
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true })
    } catch {
      return { id: dirPath, name, path: dirPath, type: 'directory', children: [] }
    }

    // Фильтруем только директории, отсекая системные папки на `.`
    const dirEntries = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'))

    const children = await Promise.all(
      dirEntries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name)
        return await AppService.getOnlyDirectoriesTree(fullPath)
      })
    )

    return {
      id: dirPath,
      name,
      path: dirPath,
      type: 'directory',
      children,
    }
  }

  // 7. Получение списка файлов/папок конкретной директории (для Content.tsx)
  static async getFolderFiles(dirPath: string): Promise<FileTreeNode[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries
        .filter((e) => !e.name.startsWith('.'))
        .map((e) => ({
          id: path.join(dirPath, e.name),
          name: e.name,
          path: path.join(dirPath, e.name),
          type: e.isDirectory() ? ('directory' as const) : ('file' as const),
        }))
    } catch {
      return []
    }
  }

  // 8. Вычисление размера папки рекурсивно
  static async calculateFolderSize(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      let totalSize = 0

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue

        const fullPath = path.join(dirPath, entry.name)
        try {
          if (entry.isDirectory()) {
            totalSize += await AppService.calculateFolderSize(fullPath)
          } else {
            const stats = await fs.stat(fullPath)
            totalSize += stats.size
          }
        } catch {
          // Пропускаем недоступные файлы
        }
      }

      return totalSize
    } catch {
      return 0
    }
  }

  // 9. Подсчет файлов в папке рекурсивно
  static async countFolderFiles(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      let totalFiles = 0

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue

        const fullPath = path.join(dirPath, entry.name)
        try {
          if (entry.isDirectory()) {
            totalFiles += await AppService.countFolderFiles(fullPath)
          } else {
            totalFiles += 1
          }
        } catch {
          // Пропускаем недоступные файлы
        }
      }

      return totalFiles
    } catch {
      return 0
    }
  }

  // 10. Создание новой папки
  static async createFolder(parentPath: string, folderName: string): Promise<string> {
    const newPath = path.join(parentPath, folderName)
    try {
      await fs.mkdir(newPath, { recursive: true })
      return newPath
    } catch (error) {
      throw new Error(`Не удалось создать папку: ${error}`)
    }
  }

  // 10b. Создание нового пустого файла
  static async createFile(parentPath: string, fileName: string): Promise<string> {
    const newPath = path.join(parentPath, fileName)
    try {
      await fs.writeFile(newPath, '', { flag: 'wx' })
      return newPath
    } catch (error) {
      throw new Error(`Не удалось создать файл: ${error}`)
    }
  }

  // 11. Удаление файла или папки
  static async deleteItem(itemPath: string): Promise<void> {
    try {
      const stats = await fs.stat(itemPath)
      if (stats.isDirectory()) {
        await fs.rm(itemPath, { recursive: true, force: true })
      } else {
        await fs.unlink(itemPath)
      }
    } catch (error) {
      throw new Error(`Не удалось удалить: ${error}`)
    }
  }

  // 12. Переименование файла или папки
  static async renameItem(oldPath: string, newName: string): Promise<string> {
    try {
      const parentDir = path.dirname(oldPath)
      const newPath = path.join(parentDir, newName)
      await fs.rename(oldPath, newPath)
      return newPath
    } catch (error) {
      throw new Error(`Не удалось переименовать: ${error}`)
    }
  }

  // 13. Подсчет скрытых папок в директории
  static async countHiddenFolders(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      let hiddenCount = 0

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('.')) {
          hiddenCount += 1
        }
      }

      return hiddenCount
    } catch {
      return 0
    }
  }

  // 14. Получение списка скрытых папок в директории
  static async getHiddenFolders(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries
        .filter((e) => e.isDirectory() && e.name.startsWith('.'))
        .map((e) => path.join(dirPath, e.name))
    } catch {
      return []
    }
  }

  // 15. Добавление папки в список игнорирования
  static async hideFolder(folderPath: string): Promise<void> {
    try {
      const hiddenList = await this.getHiddenFoldersList()
      if (!hiddenList.includes(folderPath)) {
        hiddenList.push(folderPath)
        await this.saveHiddenFoldersList(hiddenList)
      }
    } catch (error) {
      throw new Error(`Не удалось скрыть папку: ${error}`)
    }
  }

  // 16. Удаление папки из списка игнорирования
  static async showFolder(folderPath: string): Promise<void> {
    try {
      const hiddenList = await this.getHiddenFoldersList()
      const filtered = hiddenList.filter((p) => p !== folderPath)
      await this.saveHiddenFoldersList(filtered)
    } catch (error) {
      throw new Error(`Не удалось показать папку: ${error}`)
    }
  }

  // 17. Получение списка скрытых пользователем папок
  static async getHiddenFoldersList(): Promise<string[]> {
    try {
      const configPath = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.explorer-hidden')
      const data = await fs.readFile(configPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  // 18. Сохранение списка скрытых папок
  static async saveHiddenFoldersList(list: string[]): Promise<void> {
    try {
      const configPath = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.explorer-hidden')
      await fs.writeFile(configPath, JSON.stringify(list, null, 2), 'utf-8')
    } catch (error) {
      throw new Error(`Не удалось сохранить список скрытых: ${error}`)
    }
  }

  // 19. Проверка, скрыта ли папка
  static async isFolderHidden(folderPath: string): Promise<boolean> {
    try {
      const hiddenList = await this.getHiddenFoldersList()
      return hiddenList.includes(folderPath)
    } catch {
      return false
    }
  }

  // 20. Получение файлов/папок с фильтрацией скрытых
  static async getFolderFilesFiltered(dirPath: string): Promise<FileTreeNode[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const hiddenList = await this.getHiddenFoldersList()

      return entries
        .filter((e) => !e.name.startsWith('.'))
        .map((e) => ({
          id: path.join(dirPath, e.name),
          name: e.name,
          path: path.join(dirPath, e.name),
          type: e.isDirectory() ? ('directory' as const) : ('file' as const),
        }))
        .filter((item) => !hiddenList.includes(item.path))
    } catch {
      return []
    }
  }

  // 21. Получение дерева только папок с фильтрацией скрытых
  static async getOnlyDirectoriesTreeFiltered(dirPath: string): Promise<FileTreeNode> {
    const name = path.basename(dirPath) || dirPath
    const hiddenList = await this.getHiddenFoldersList()

    let entries: import('fs').Dirent[] = []
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true })
    } catch {
      return { id: dirPath, name, path: dirPath, type: 'directory', children: [] }
    }

    const dirEntries = entries.filter(
      (e) => e.isDirectory() && !e.name.startsWith('.') && !hiddenList.includes(path.join(dirPath, e.name))
    )

    const children = await Promise.all(
      dirEntries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name)
        return await AppService.getOnlyDirectoriesTreeFiltered(fullPath)
      })
    )

    return {
      id: dirPath,
      name,
      path: dirPath,
      type: 'directory',
      children,
    }
  }

  // 22. Регистрация приложения как обработчика папок (Linux)
  static async registerAsDefaultFileManager(): Promise<string> {
    const platform = os.platform()
    const log: string[] = []

    if (platform === 'linux') {
      // Проверяем наличие xdg-mime, без него регистрация невозможна
      try {
        execSync('which xdg-mime', { stdio: 'pipe' })
      } catch {
        throw new Error(
          'Утилита xdg-mime не найдена. Установите пакет xdg-utils (sudo apt install xdg-utils)'
        )
      }

      const homeDir = process.env.HOME
      if (!homeDir) {
        throw new Error('Не удалось определить домашнюю директорию (HOME)')
      }

      const applicationsDir = path.join(homeDir, '.local/share/applications')
      await fs.mkdir(applicationsDir, { recursive: true })

      const desktopFilePath = path.join(applicationsDir, 'electron-explorer.desktop')
      const desktopContent = this.buildDesktopEntryContent()

      await fs.writeFile(desktopFilePath, desktopContent, 'utf-8')
      await fs.chmod(desktopFilePath, 0o755)
      log.push(`Создан .desktop файл: ${desktopFilePath}`)

      try {
        execSync('xdg-mime default electron-explorer.desktop inode/directory', { stdio: 'pipe' })
        log.push('xdg-mime default inode/directory установлен')
      } catch (error: any) {
        throw new Error(`Не удалось выполнить xdg-mime: ${error.message || error}`)
      }

      // На GNOME/Nautilus и других gio-based окружениях xdg-mime зачастую игнорируется —
      // дублируем регистрацию через gio mime, если утилита доступна
      try {
        execSync('which gio', { stdio: 'pipe' })
        execSync('gio mime inode/directory electron-explorer.desktop', { stdio: 'pipe' })
        log.push('gio mime inode/directory установлен (для GNOME/Nautilus)')
      } catch {
        log.push('gio не найден или недоступен — пропущено (не критично)')
      }

      // Обновляем кэш desktop-файлов, иначе DE может не увидеть новый .desktop сразу
      try {
        execSync(`update-desktop-database "${applicationsDir}"`, { stdio: 'pipe' })
        log.push('Кэш desktop-файлов обновлён')
      } catch {
        log.push('update-desktop-database не найден — пропущено (не критично)')
      }

      // Диагностика: проверяем, что реально зарегистрировано в системе
      try {
        const current = execSync('xdg-mime query default inode/directory', { stdio: 'pipe' })
          .toString()
          .trim()
        log.push(`Текущий обработчик inode/directory: ${current}`)
        if (current !== 'electron-explorer.desktop') {
          log.push(
            'ВНИМАНИЕ: система не подтвердила смену обработчика. ' +
              'Некоторые окружения (GNOME/Nautilus) игнорируют xdg-mime для inode/directory ' +
              'и требуют смены через системные настройки "Приложения по умолчанию".'
          )
        }
      } catch {
        // query может быть недоступен — не критично
      }

      return log.join('\n')
    } else if (platform === 'darwin') {
      try {
        execSync('which duti', { stdio: 'pipe' })
      } catch {
        throw new Error('Утилита duti не найдена. Установите её: brew install duti')
      }

      try {
        execSync(`duti -s com.electron.explorer com.apple.bundle-identifier com.apple.Finder`, {
          stdio: 'pipe',
        })
        return 'Зарегистрировано через duti'
      } catch (error: any) {
        throw new Error(`Не удалось зарегистрировать на macOS: ${error.message || error}`)
      }
    }

    throw new Error(`Платформа ${platform} не поддерживается для регистрации по умолчанию`)
  }

  // 22b. Строит содержимое .desktop файла (общее для user-level и sudo-регистрации)
  private static buildDesktopEntryContent(): string {
    // В dev-режиме process.execPath указывает на бинарник Electron, а не на наше
    // приложение — ему обязательно нужно передать путь до app (app.getAppPath()).
    // В собранном (packaged) виде execPath уже указывает на итоговый бинарник.
    const execLine = app.isPackaged
      ? `${process.execPath} %f`
      : `${process.execPath} ${app.getAppPath()} %f`

    return `[Desktop Entry]
Type=Application
Name=Electron Explorer
Exec=${execLine}
Icon=folder
Categories=Utility;System;
MimeType=inode/directory;
Terminal=false
StartupNotify=true
`
  }

  // 22c. Генерирует готовую команду для терминала (с sudo), которую пользователь
  // может скопировать и выполнить сам — устанавливает .desktop в системную
  // директорию /usr/share/applications, что часто работает надёжнее user-level
  // регистрации и не зависит от прав на запись в ~/.local/share.
  // Используем "sudo tee ... <<'EOF'" — кавычки вокруг EOF отключают подстановку
  // переменных/спецсимволов внутри heredoc, поэтому содержимое передаётся буквально.
  static generateSudoInstallCommand(): string {
    const desktopContent = this.buildDesktopEntryContent()

    return [
      `sudo tee /usr/share/applications/electron-explorer.desktop > /dev/null << 'EOF'`,
      desktopContent.trimEnd(),
      `EOF`,
      `sudo xdg-mime default electron-explorer.desktop inode/directory`,
      `command -v gio >/dev/null 2>&1 && sudo gio mime inode/directory electron-explorer.desktop`,
      `sudo update-desktop-database /usr/share/applications`,
    ].join('\n')
  }

  // 23. Открытие папки из аргументов командной строки
  // Именно так система передаёт путь при двойном клике на папку,
  // назначенную этому приложению через registerAsDefaultFileManager()
  static getFolderFromArgs(argv: string[] = process.argv): string | null {
    for (const arg of argv) {
      if (arg.startsWith('--folder=')) {
        return arg.substring(9)
      }
    }

    // Ищем последний аргумент, реально указывающий на существующую директорию.
    // В dev-режиме argv = [electronBin, appPath, ...userArgs], в packaged-режиме
    // argv = [appBin, ...userArgs] — поэтому проверяем реальное существование,
    // а не полагаемся на позицию аргумента.
    for (let i = argv.length - 1; i >= 0; i--) {
      const arg = argv[i]
      if (arg.startsWith('-')) continue
      try {
        const stats = fsSync.statSync(arg)
        if (stats.isDirectory()) {
          return arg
        }
      } catch {
        // Не путь — пропускаем
      }
    }
    return null
  }
}