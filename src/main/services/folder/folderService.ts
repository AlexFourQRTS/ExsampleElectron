import * as fs from 'fs/promises'
import * as path from 'path'
import { FileTreeNode } from '../fileSystemTypes'
import { HiddenFoldersService } from './hiddenFoldersService'

// Домен "папки": построение дерева, содержимое директории, размер/кол-во
// файлов, создание. Скрытые пользователем папки — отдельный домен
// (HiddenFoldersService), сюда подключается только для фильтрации выдачи.
export class FolderService {
  // Построение дерева ТОЛЬКО из папок (для боковой панели)
  static async getOnlyDirectoriesTree(dirPath: string): Promise<FileTreeNode> {
    const name = path.basename(dirPath) || dirPath

    let entries: import('fs').Dirent[] = []
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true })
    } catch {
      return { id: dirPath, name, path: dirPath, type: 'directory', children: [] }
    }

    const dirEntries = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'))

    const children = await Promise.all(
      dirEntries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name)
        return await FolderService.getOnlyDirectoriesTree(fullPath)
      })
    )

    return { id: dirPath, name, path: dirPath, type: 'directory', children }
  }

  // Список файлов/папок конкретной директории (для таблицы контента)
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

  // То же самое, но с фильтрацией папок, которые пользователь скрыл вручную
  static async getFolderFilesFiltered(dirPath: string): Promise<FileTreeNode[]> {
    const hiddenList = await HiddenFoldersService.getHiddenFoldersList()
    const items = await this.getFolderFiles(dirPath)
    return items.filter((item) => !hiddenList.includes(item.path))
  }

  // Дерево только папок с той же фильтрацией скрытых
  static async getOnlyDirectoriesTreeFiltered(dirPath: string): Promise<FileTreeNode> {
    const name = path.basename(dirPath) || dirPath
    const hiddenList = await HiddenFoldersService.getHiddenFoldersList()

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
        return await FolderService.getOnlyDirectoriesTreeFiltered(fullPath)
      })
    )

    return { id: dirPath, name, path: dirPath, type: 'directory', children }
  }

  // Рекурсивный размер папки в байтах
  static async calculateFolderSize(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      let totalSize = 0

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue

        const fullPath = path.join(dirPath, entry.name)
        try {
          if (entry.isDirectory()) {
            totalSize += await FolderService.calculateFolderSize(fullPath)
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

  // Рекурсивный подсчёт файлов внутри папки
  static async countFolderFiles(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      let totalFiles = 0

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue

        const fullPath = path.join(dirPath, entry.name)
        try {
          if (entry.isDirectory()) {
            totalFiles += await FolderService.countFolderFiles(fullPath)
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

  static async createFolder(parentPath: string, folderName: string): Promise<string> {
    const newPath = path.join(parentPath, folderName)
    try {
      await fs.mkdir(newPath, { recursive: true })
      return newPath
    } catch (error) {
      throw new Error(`Не удалось создать папку: ${error}`)
    }
  }
}
