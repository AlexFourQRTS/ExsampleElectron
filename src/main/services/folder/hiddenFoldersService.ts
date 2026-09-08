import * as fs from 'fs/promises'
import * as path from 'path'

// Папки, которые пользователь явно спрятал через контекстное меню — не путать
// с дотфайлами (те скрываются отдельным правилом фильтрации в FolderService)
export class HiddenFoldersService {
  private static getConfigPath(): string {
    return path.join(process.env.HOME || process.env.USERPROFILE || '.', '.explorer-hidden')
  }

  static async countHiddenFolders(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory() && e.name.startsWith('.')).length
    } catch {
      return 0
    }
  }

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

  static async showFolder(folderPath: string): Promise<void> {
    try {
      const hiddenList = await this.getHiddenFoldersList()
      const filtered = hiddenList.filter((p) => p !== folderPath)
      await this.saveHiddenFoldersList(filtered)
    } catch (error) {
      throw new Error(`Не удалось показать папку: ${error}`)
    }
  }

  static async getHiddenFoldersList(): Promise<string[]> {
    try {
      const data = await fs.readFile(this.getConfigPath(), 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  static async saveHiddenFoldersList(list: string[]): Promise<void> {
    try {
      await fs.writeFile(this.getConfigPath(), JSON.stringify(list, null, 2), 'utf-8')
    } catch (error) {
      throw new Error(`Не удалось сохранить список скрытых: ${error}`)
    }
  }

  static async isFolderHidden(folderPath: string): Promise<boolean> {
    try {
      const hiddenList = await this.getHiddenFoldersList()
      return hiddenList.includes(folderPath)
    } catch {
      return false
    }
  }
}
