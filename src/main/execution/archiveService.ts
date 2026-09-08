import { execSync } from 'child_process'
import * as path from 'path'

export class ArchiveService {
  static async compress(itemPaths: string[], outputPath: string): Promise<void> {
    const dir = path.dirname(itemPaths[0])
    const names = itemPaths.map((p) => `"${path.basename(p)}"`).join(' ')
    const ext = path.extname(outputPath).toLowerCase()

    try {
      if (ext === '.zip') {
        execSync(`cd "${dir}" && zip -r "${outputPath}" ${names}`, { stdio: 'pipe' })
      } else {
        execSync(`cd "${dir}" && tar -czf "${outputPath}" ${names}`, { stdio: 'pipe' })
      }
    } catch (error) {
      throw new Error(`Не удалось создать архив: ${error}`)
    }
  }

  static async extract(archivePath: string, outputDir: string): Promise<void> {
    const ext = path.extname(archivePath).toLowerCase()

    try {
      if (ext === '.zip') {
        execSync(`unzip -o "${archivePath}" -d "${outputDir}"`, { stdio: 'pipe' })
      } else if (archivePath.endsWith('.tar.gz') || ext === '.tgz') {
        execSync(`tar -xzf "${archivePath}" -C "${outputDir}"`, { stdio: 'pipe' })
      } else if (ext === '.tar') {
        execSync(`tar -xf "${archivePath}" -C "${outputDir}"`, { stdio: 'pipe' })
      } else {
        throw new Error('Неподдерживаемый формат архива')
      }
    } catch (error) {
      throw new Error(`Не удалось извлечь архив: ${error}`)
    }
  }

  static isArchive(filePath: string): boolean {
    const lower = filePath.toLowerCase()
    return (
      lower.endsWith('.zip') ||
      lower.endsWith('.tar.gz') ||
      lower.endsWith('.tgz') ||
      lower.endsWith('.tar')
    )
  }
}
