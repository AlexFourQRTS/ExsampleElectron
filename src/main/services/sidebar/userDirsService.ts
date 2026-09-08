import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface StandardPlace {
  id: string
  label: string
  path: string
  icon: string
}

// Соответствие переменных из ~/.config/user-dirs.dirs нашим иконкам/подписям
const XDG_KEYS: { key: string; id: string; label: string; icon: string }[] = [
  { key: 'XDG_DESKTOP_DIR', id: 'desktop', label: 'Рабочий стол', icon: 'desktop' },
  { key: 'XDG_DOCUMENTS_DIR', id: 'documents', label: 'Документы', icon: 'documents' },
  { key: 'XDG_DOWNLOAD_DIR', id: 'downloads', label: 'Загрузки', icon: 'downloads' },
  { key: 'XDG_MUSIC_DIR', id: 'music', label: 'Музыка', icon: 'music' },
  { key: 'XDG_PICTURES_DIR', id: 'pictures', label: 'Изображения', icon: 'pictures' },
  { key: 'XDG_VIDEOS_DIR', id: 'videos', label: 'Видео', icon: 'videos' },
]

export class UserDirsService {
  // Стандартные "Места" — Home + папки из ~/.config/user-dirs.dirs (GNOME/KDE
  // создают этот файл автоматически; если его нет — используем англ. имена по умолчанию)
  static async getStandardPlaces(): Promise<StandardPlace[]> {
    const home = os.homedir()
    const places: StandardPlace[] = [
      { id: 'home', label: 'Домашняя папка', path: home, icon: 'home' },
    ]

    const userDirsMap = await this.parseUserDirsFile(home)

    for (const { key, id, label, icon } of XDG_KEYS) {
      const dirPath = userDirsMap.get(key) || path.join(home, this.defaultDirName(id))
      if (this.dirExists(dirPath) && dirPath !== home) {
        places.push({ id, label, path: dirPath, icon })
      }
    }

    return places
  }

  private static defaultDirName(id: string): string {
    const map: Record<string, string> = {
      desktop: 'Desktop',
      documents: 'Documents',
      downloads: 'Downloads',
      music: 'Music',
      pictures: 'Pictures',
      videos: 'Videos',
    }
    return map[id] || id
  }

  private static dirExists(dirPath: string): boolean {
    try {
      return fsSync.statSync(dirPath).isDirectory()
    } catch {
      return false
    }
  }

  private static async parseUserDirsFile(home: string): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    const filePath = path.join(home, '.config/user-dirs.dirs')

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')

      for (const line of lines) {
        const match = line.match(/^(XDG_\w+_DIR)="(.+)"$/)
        if (match) {
          const [, key, rawValue] = match
          const resolved = rawValue.replace('$HOME', home)
          map.set(key, resolved)
        }
      }
    } catch {
      // Файла нет — используем дефолтные англ. имена
    }

    return map
  }
}
