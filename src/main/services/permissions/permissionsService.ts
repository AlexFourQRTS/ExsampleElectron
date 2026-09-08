import * as fs from 'fs/promises'
import * as os from 'os'

export class PermissionsService {
  static async makeExecutable(filePath: string): Promise<void> {
    if (os.platform() === 'win32') {
      throw new Error('Установка прав выполнения не поддерживается на Windows')
    }

    try {
      const stats = await fs.stat(filePath)
      const currentMode = stats.mode
      const newMode = currentMode | 0o111
      await fs.chmod(filePath, newMode)
    } catch (error) {
      throw new Error(`Не удалось установить права выполнения: ${error}`)
    }
  }

  static async setPermissions(filePath: string, mode: string): Promise<void> {
    try {
      const octalMode = parseInt(mode, 8)
      await fs.chmod(filePath, octalMode)
    } catch (error) {
      throw new Error(`Не удалось установить права доступа: ${error}`)
    }
  }

  static async getPermissions(filePath: string): Promise<string> {
    try {
      const stats = await fs.stat(filePath)
      return (stats.mode & 0o777).toString(8)
    } catch (error) {
      throw new Error(`Не удалось получить права доступа: ${error}`)
    }
  }
}
