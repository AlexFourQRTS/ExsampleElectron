import * as fs from 'fs/promises'
import * as os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface MountedDevice {
  id: string
  label: string
  mountPoint: string
  filesystem: string
  // Блочное устройство (например /dev/sdb1) — нужно для отмонтирования через
  // udisksctl, который работает по устройству, а не по точке монтирования
  devicePath: string
}

// Файловые системы, которые считаем "реальными" устройствами/дисками
const REAL_FILESYSTEMS = new Set([
  'ext4', 'ext3', 'ext2', 'btrfs', 'xfs', 'ntfs', 'ntfs3', 'vfat', 'exfat', 'fuseblk', 'f2fs',
])

// Точки монтирования, которые не показываем как отдельные "устройства"
// (сама корневая система показывается один раз через getRootDevice отдельно)
const IGNORED_MOUNT_PREFIXES = ['/boot', '/snap', '/var/lib/docker']

export class DeviceService {
  // Список примонтированных дисков/разделов (кроме корневой ФС) для боковой
  // панели — то, что Nautilus/Nemo показывают в разделе "Устройства"
  static async getMountedDevices(): Promise<MountedDevice[]> {
    if (os.platform() !== 'linux') {
      return []
    }

    try {
      const content = await fs.readFile('/proc/mounts', 'utf-8')
      const lines = content.split('\n').filter(Boolean)
      const devices: MountedDevice[] = []
      const seenMountPoints = new Set<string>()

      for (const line of lines) {
        const parts = line.split(' ')
        if (parts.length < 3) continue

        const [source, mountPointRaw, filesystem] = parts
        const mountPoint = this.unescapeMountPoint(mountPointRaw)

        if (!REAL_FILESYSTEMS.has(filesystem)) continue
        if (mountPoint === '/') continue // корень показываем отдельно, не дублируем
        if (IGNORED_MOUNT_PREFIXES.some((prefix) => mountPoint.startsWith(prefix))) continue
        if (seenMountPoints.has(mountPoint)) continue

        seenMountPoints.add(mountPoint)
        devices.push({
          id: mountPoint,
          label: this.labelFromMountPoint(mountPoint, source),
          mountPoint,
          filesystem,
          devicePath: source,
        })
      }

      return devices
    } catch {
      return []
    }
  }

  // Отдельно даём доступ к корню файловой системы ("Компьютер" / "/")
  static getRootDevice(): MountedDevice {
    return { id: 'root', label: 'Файловая система', mountPoint: '/', filesystem: 'root', devicePath: '' }
  }

  // Отмонтирует диск через udisksctl (не требует sudo для дисков, смонтированных
  // самим пользователем/автомонтированием DE — стандартный случай для USB) —
  // с fallback на обычный umount, если udisksctl недоступен
  static async unmountDevice(devicePath: string): Promise<void> {
    if (!devicePath) {
      throw new Error('Не указано устройство для отмонтирования')
    }

    try {
      await execFileAsync('udisksctl', ['unmount', '-b', devicePath])
      return
    } catch (udisksError: any) {
      try {
        await execFileAsync('umount', [devicePath])
      } catch (umountError: any) {
        throw new Error(
          `Не удалось отмонтировать: ${udisksError.message || udisksError}. ` +
            `umount тоже не сработал: ${umountError.message || umountError}`
        )
      }
    }
  }

  private static unescapeMountPoint(raw: string): string {
    // /proc/mounts экранирует пробелы как \040 и т.д.
    return raw
      .replace(/\\040/g, ' ')
      .replace(/\\011/g, '\t')
      .replace(/\\012/g, '\n')
      .replace(/\\134/g, '\\')
  }

  private static labelFromMountPoint(mountPoint: string, source: string): string {
    const parts = mountPoint.split('/').filter(Boolean)
    if (parts.length === 0) return source
    return decodeURIComponent(parts[parts.length - 1])
  }
}
