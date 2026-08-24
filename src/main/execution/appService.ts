import { dialog } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

// Типы прямо в этом же файле
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

    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    // Исключаем системные файлы (например, .DS_Store на macOS или $RECYCLE.BIN)
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

  // 5. Поверхностное чтение папки без глубокой рекурсии (для быстрой подгрузки)
  static async readDirectoryContent(dirPath: string): Promise<FileTreeNode[]> {
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
  }
}