import { dialog, app } from 'electron'
import * as fs from 'fs/promises'
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
  // 0. Получить домашнюю папку
  static getHomeDirectory(): string {
    return process.env.HOME || process.env.USERPROFILE || '/home'
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
  static async registerAsDefaultFileManager(): Promise<void> {
    const platform = os.platform()

    if (platform === 'linux') {
      try {
        const homeDir = process.env.HOME || '/home'
        const applicationsDir = path.join(homeDir, '.local/share/applications')
        await fs.mkdir(applicationsDir, { recursive: true })

        const desktopFilePath = path.join(applicationsDir, 'electron-explorer.desktop')
        const appPath = app.getAppPath()
        const execPath = process.execPath

        const desktopContent = `[Desktop Entry]
Type=Application
Name=Electron Explorer
Exec=${execPath} "%F"
Icon=folder
Categories=Utility;
MimeType=inode/directory;
Terminal=false
`

        await fs.writeFile(desktopFilePath, desktopContent, 'utf-8')

        // Устанавливаем как обработчик по умолчанию
        try {
          execSync('xdg-mime default electron-explorer.desktop inode/directory', { stdio: 'pipe' })
        } catch (error) {
          console.error('Ошибка при регистрации xdg-mime:', error)
        }
      } catch (error) {
        throw new Error(`Не удалось зарегистрировать приложение: ${error}`)
      }
    } else if (platform === 'darwin') {
      try {
        execSync(
          `duti -s com.electron.explorer com.apple.bundle-identifier com.apple.Finder`,
          { stdio: 'pipe' }
        )
      } catch (error) {
        throw new Error(`Не удалось зарегистрировать на macOS: ${error}`)
      }
    }
  }

  // 23. Открытие папки из аргументов командной строки
  static getFolderFromArgs(): string | null {
    const args = process.argv
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg.startsWith('--folder=')) {
        return arg.substring(9)
      }
      if (!arg.startsWith('-') && !arg.includes('electron') && !arg.includes('.js')) {
        return arg
      }
    }
    return null
  }
}