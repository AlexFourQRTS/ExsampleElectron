import { dialog } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

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
}