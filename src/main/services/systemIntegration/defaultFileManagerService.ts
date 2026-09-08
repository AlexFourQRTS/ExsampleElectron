import { app } from 'electron'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import * as os from 'os'

// Домен "интеграция с ОС": регистрация приложения как обработчика папок
// по умолчанию (Linux xdg-mime/gio, macOS duti) — не файловая и не папочная
// операция, а системная настройка окружения.
export class DefaultFileManagerService {
  static async registerAsDefaultFileManager(): Promise<string> {
    const platform = os.platform()
    const log: string[] = []

    if (platform === 'linux') {
      try {
        execSync('which xdg-mime', { stdio: 'pipe' })
      } catch {
        throw new Error(
          'Утилита xdg-mime не найдена. Установите пакет xdg-utils (sudo apt install xdg-utils)'
        )
      }

      const homeDir = process.env.HOME
      if (!homeDir) {
        throw new Error('Не удалось определить домашнюю директорию (HOME)')
      }

      const launch = await this.installLaunchBinary()
      log.push(`Исполняемый файл: ${launch.execPath}`)

      const applicationsDir = path.join(homeDir, '.local/share/applications')
      await fs.mkdir(applicationsDir, { recursive: true })

      const desktopFilePath = path.join(applicationsDir, 'simpleexplorer.desktop')
      const desktopContent = this.buildDesktopEntryContent(launch)

      await fs.writeFile(desktopFilePath, desktopContent, 'utf-8')
      await fs.chmod(desktopFilePath, 0o755)
      log.push(`Создан .desktop файл: ${desktopFilePath}`)

      // Обновляем кэш desktop-файлов ПЕРЕД xdg-mime/gio — иначе они не увидят
      // только что созданный .desktop файл (gio падает с "Failed to load info")
      try {
        execSync(`update-desktop-database "${applicationsDir}"`, { stdio: 'pipe' })
        log.push('Кэш desktop-файлов обновлён')
      } catch {
        log.push('update-desktop-database не найден — пропущено (не критично)')
      }

      const mimeTypes = ['inode/directory', 'inode/mount-point']
      try {
        for (const mimeType of mimeTypes) {
          execSync(`xdg-mime default simpleexplorer.desktop ${mimeType}`, { stdio: 'pipe' })
          log.push(`xdg-mime default ${mimeType} установлен`)
        }
      } catch (error: any) {
        throw new Error(`Не удалось выполнить xdg-mime: ${error.message || error}`)
      }

      // На GNOME/Nautilus/Cinnamon и других gio-based окружениях xdg-mime зачастую
      // игнорируется — дублируем регистрацию через gio mime, если утилита доступна
      try {
        execSync('which gio', { stdio: 'pipe' })
        for (const mimeType of mimeTypes) {
          execSync(`gio mime ${mimeType} simpleexplorer.desktop`, { stdio: 'pipe' })
          log.push(`gio mime ${mimeType} установлен`)
        }
      } catch (error: any) {
        log.push(`gio mime не удалось выполнить: ${error.message || error} (не критично)`)
      }

      this.tryBindCinnamonFileManagerShortcut(launch.execPath, log)

      // Диагностика: проверяем, что реально зарегистрировано в системе
      try {
        const current = execSync('xdg-mime query default inode/directory', { stdio: 'pipe' })
          .toString()
          .trim()
        log.push(`Текущий обработчик inode/directory: ${current}`)
        if (current !== 'simpleexplorer.desktop') {
          log.push(
            'ВНИМАНИЕ: система не подтвердила смену обработчика. ' +
              'Некоторые окружения (GNOME/Nautilus) игнорируют xdg-mime для inode/directory ' +
              'и требуют смены через системные настройки "Приложения по умолчанию".'
          )
        }
      } catch {
        // query может быть недоступен — не критично
      }

      return log.join('\n')
    } else if (platform === 'darwin') {
      try {
        execSync('which duti', { stdio: 'pipe' })
      } catch {
        throw new Error('Утилита duti не найдена. Установите её: brew install duti')
      }

      try {
        execSync(`duti -s com.brahma.simpleexplorer com.apple.bundle-identifier com.apple.Finder`, {
          stdio: 'pipe',
        })
        return 'Зарегистрировано через duti'
      } catch (error: any) {
        throw new Error(`Не удалось зарегистрировать на macOS: ${error.message || error}`)
      }
    }

    throw new Error(`Платформа ${platform} не поддерживается для регистрации по умолчанию`)
  }

  // Путь, который должен попасть в Exec= ярлыка. Dev-бинарник Electron
  // для этого не подходит: без `npm run dev` папки из системы не откроются.
  private static resolveLaunchPath(): { execPath: string; isAppBundle: boolean } {
    if (process.env.APPIMAGE && fsSync.existsSync(process.env.APPIMAGE)) {
      return { execPath: process.env.APPIMAGE, isAppBundle: true }
    }

    if (app.isPackaged) {
      return { execPath: process.execPath, isAppBundle: true }
    }

    const distDir = path.join(app.getAppPath(), 'dist')
    try {
      const images = fsSync.readdirSync(distDir).filter((file) => file.endsWith('.AppImage'))
      if (images.length > 0) {
        return { execPath: path.join(distDir, images[0]), isAppBundle: true }
      }
    } catch {
      // dist ещё не собирали — ниже fallback на electron + app path
    }

    return { execPath: process.execPath, isAppBundle: false }
  }

  // Копирует AppImage в стабильное место и ставит обёртку: Electron воспринимает
  // первый аргумент-директорию как путь к приложению, поэтому папку нужно
  // передавать после `--`. Обёртка также сбрасывает ELECTRON_RUN_AS_NODE.
  private static async installLaunchBinary(): Promise<{ execPath: string; isAppBundle: boolean }> {
    const resolved = this.resolveLaunchPath()
    if (!resolved.execPath.endsWith('.AppImage')) {
      return resolved
    }

    const destDir = path.join(os.homedir(), '.local/share/simpleexplorer')
    const dest = path.join(destDir, 'simpleexplorer.AppImage')
    const wrapper = path.join(destDir, 'simpleexplorer')
    await fs.mkdir(destDir, { recursive: true })
    if (path.resolve(resolved.execPath) !== path.resolve(dest)) {
      await fs.copyFile(resolved.execPath, dest)
      await fs.chmod(dest, 0o755)
    }

    // Ярлык всегда берёт самый новый AppImage из dist/, иначе после
    // `npm run make` система продолжала бы открывать старую копию.
    const distDir = !app.isPackaged
      ? path.join(app.getAppPath(), 'dist')
      : process.env.APPIMAGE
        ? path.dirname(process.env.APPIMAGE)
        : path.join(path.dirname(process.execPath), '..')
    const script = [
      '#!/bin/bash',
      'unset ELECTRON_RUN_AS_NODE',
      'unset ELECTRON_NO_ASAR',
      `DIST_DIR=${this.quoteDesktopExecArg(distDir)}`,
      `INSTALLED=${this.quoteDesktopExecArg(dest)}`,
      'APPIMAGE=""',
      'if [ -d "$DIST_DIR" ]; then',
      '  APPIMAGE=$(ls -t "$DIST_DIR"/*.AppImage 2>/dev/null | head -1)',
      'fi',
      'if [ -z "$APPIMAGE" ] || [ ! -x "$APPIMAGE" ]; then',
      '  APPIMAGE="$INSTALLED"',
      'fi',
      'exec "$APPIMAGE" -- "$@"',
      '',
    ].join('\n')
    await fs.writeFile(wrapper, script, 'utf-8')
    await fs.chmod(wrapper, 0o755)
    return { execPath: wrapper, isAppBundle: true }
  }

  private static quoteDesktopExecArg(value: string): string {
    if (!/[ \t\n"'\\><~|&;$*?#()`]/.test(value)) {
      return value
    }
    return `"${value.replace(/"/g, '\\"')}"`
  }

  // Строит содержимое .desktop файла (общее для user-level и sudo-регистрации)
  private static buildDesktopEntryContent(
    launch: { execPath: string; isAppBundle: boolean } = this.resolveLaunchPath()
  ): string {
    const quotedExec = this.quoteDesktopExecArg(launch.execPath)
    // %U принимает и обычные пути, и file:// URL. `--` нужен, чтобы Electron
    // не принял открываемую папку за каталог приложения.
    const execLine = launch.isAppBundle
      ? `${quotedExec} -- %U`
      : `${quotedExec} ${this.quoteDesktopExecArg(app.getAppPath())} -- %U`

    return `[Desktop Entry]
Type=Application
Name=SimpleExplorer
Exec=${execLine}
Icon=folder
Categories=System;FileManager;Utility;
MimeType=inode/directory;inode/mount-point;
Terminal=false
StartupNotify=true
StartupWMClass=simpleexplorer
`
  }

  // Super+E / «Open File Manager» в Cinnamon по умолчанию вызывает `nemo`
  // напрямую, минуя MIME. Переназначаем такую горячую клавишу на наш бинарник.
  private static tryBindCinnamonFileManagerShortcut(execPath: string, log: string[]): void {
    const desktop = process.env.XDG_CURRENT_DESKTOP || ''
    if (!desktop.toLowerCase().includes('cinnamon')) {
      return
    }

    try {
      const raw = execSync('gsettings get org.cinnamon.desktop.keybindings custom-list', {
        encoding: 'utf-8',
      }).trim()
      const ids = [...raw.matchAll(/custom\d+/g)].map((match) => match[0])

      for (const id of ids) {
        const prefix =
          `org.cinnamon.desktop.keybindings.custom-keybinding:` +
          `/org/cinnamon/desktop/keybindings/custom-keybindings/${id}/`
        const command = execSync(`gsettings get ${prefix} command`, { encoding: 'utf-8' })
          .trim()
          .replace(/^'|'$/g, '')
        const name = execSync(`gsettings get ${prefix} name`, { encoding: 'utf-8' })
          .trim()
          .replace(/^'|'$/g, '')

        if (command === 'nemo' || /file manager|файлов|проводник/i.test(name)) {
          execSync(`gsettings set ${prefix} command ${JSON.stringify(execPath)}`)
          log.push(`Cinnamon: горячая клавиша «${name}» теперь запускает SimpleExplorer`)
        }
      }
    } catch (error: any) {
      log.push(
        `Не удалось обновить горячую клавишу Cinnamon: ${error.message || error} (не критично)`
      )
    }
  }

  // Генерирует готовую команду для терминала (с sudo), которую пользователь
  // может скопировать и выполнить сам — устанавливает .desktop в системную
  // директорию /usr/share/applications, что часто работает надёжнее user-level
  // регистрации и не зависит от прав на запись в ~/.local/share.
  // Используем "sudo tee ... <<'EOF'" — кавычки вокруг EOF отключают подстановку
  // переменных/спецсимволов внутри heredoc, поэтому содержимое передаётся буквально.
  static generateSudoInstallCommand(): string {
    const desktopContent = this.buildDesktopEntryContent()

    return [
      `sudo tee /usr/share/applications/simpleexplorer.desktop > /dev/null << 'EOF'`,
      desktopContent.trimEnd(),
      `EOF`,
      // update-desktop-database ДО gio mime — иначе gio не видит свежесозданный
      // .desktop файл и падает с "Failed to load info for handler"
      `sudo update-desktop-database /usr/share/applications`,
      `sudo xdg-mime default simpleexplorer.desktop inode/directory`,
      `sudo xdg-mime default simpleexplorer.desktop inode/mount-point`,
      `command -v gio >/dev/null 2>&1 && gio mime inode/directory simpleexplorer.desktop`,
      `command -v gio >/dev/null 2>&1 && gio mime inode/mount-point simpleexplorer.desktop`,
    ].join('\n')
  }
}
