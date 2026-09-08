import * as fs from 'fs/promises'
import * as path from 'path'
import { FileItemStats } from '../fileSystemTypes'

// Домен "файлы": метаданные, создание, удаление, переименование одного
// элемента файловой системы (deleteItem/renameItem работают и на папках —
// это обычные операции над путём, не завязанные на тип содержимого).
export class FileService {
  static async getItemStats(itemPath: string): Promise<FileItemStats> {
    const stats = await fs.stat(itemPath)
    const ext = path.extname(itemPath)

    return {
      size: stats.size,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      extension: ext,
    }
  }

  static async createFile(parentPath: string, fileName: string): Promise<string> {
    const newPath = path.join(parentPath, fileName)
    try {
      await fs.writeFile(newPath, '', { flag: 'wx' })
      return newPath
    } catch (error) {
      throw new Error(`Не удалось создать файл: ${error}`)
    }
  }

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
}
