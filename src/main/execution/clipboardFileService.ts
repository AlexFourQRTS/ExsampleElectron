import * as fs from 'fs/promises'
import * as path from 'path'

interface ClipboardState {
  paths: string[]
  operation: 'copy' | 'cut'
}

export class ClipboardFileService {
  private static clipboard: ClipboardState | null = null

  static copy(paths: string[]): void {
    this.clipboard = { paths, operation: 'copy' }
  }

  static cut(paths: string[]): void {
    this.clipboard = { paths, operation: 'cut' }
  }

  static getClipboard(): ClipboardState | null {
    return this.clipboard
  }

  static async paste(targetDir: string): Promise<void> {
    if (!this.clipboard) return

    const { paths, operation } = this.clipboard

    for (const sourcePath of paths) {
      const name = path.basename(sourcePath)
      const targetPath = path.join(targetDir, name)

      if (operation === 'copy') {
        await this.copyRecursive(sourcePath, targetPath)
      } else {
        await fs.rename(sourcePath, targetPath)
      }
    }

    if (operation === 'cut') {
      this.clipboard = null
    }
  }

  private static async copyRecursive(source: string, target: string): Promise<void> {
    const stats = await fs.stat(source)

    if (stats.isDirectory()) {
      await fs.mkdir(target, { recursive: true })
      const entries = await fs.readdir(source, { withFileTypes: true })

      for (const entry of entries) {
        await this.copyRecursive(
          path.join(source, entry.name),
          path.join(target, entry.name)
        )
      }
    } else {
      await fs.copyFile(source, target)
    }
  }
}
