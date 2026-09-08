import * as fs from 'fs/promises'
import * as path from 'path'

export class MoveService {
  static async moveItem(sourcePath: string, targetDir: string): Promise<string> {
    const name = path.basename(sourcePath)
    const targetPath = path.join(targetDir, name)

    if (sourcePath === targetPath) {
      return targetPath
    }

    try {
      await fs.rename(sourcePath, targetPath)
      return targetPath
    } catch (error: any) {
      if (error.code === 'EXDEV') {
        await this.copyRecursive(sourcePath, targetPath)
        await fs.rm(sourcePath, { recursive: true, force: true })
        return targetPath
      }
      throw new Error(`Не удалось переместить: ${error}`)
    }
  }

  static async moveItems(sourcePaths: string[], targetDir: string): Promise<string[]> {
    const results: string[] = []
    for (const sourcePath of sourcePaths) {
      results.push(await this.moveItem(sourcePath, targetDir))
    }
    return results
  }

  private static async copyRecursive(source: string, target: string): Promise<void> {
    const stats = await fs.stat(source)

    if (stats.isDirectory()) {
      await fs.mkdir(target, { recursive: true })
      const entries = await fs.readdir(source, { withFileTypes: true })

      for (const entry of entries) {
        await this.copyRecursive(path.join(source, entry.name), path.join(target, entry.name))
      }
    } else {
      await fs.copyFile(source, target)
    }
  }
}
