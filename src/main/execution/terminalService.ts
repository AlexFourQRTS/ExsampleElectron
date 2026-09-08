import { exec } from 'child_process'
import * as os from 'os'

export class TerminalService {
  static openTerminalAt(dirPath: string): void {
    const platform = os.platform()

    if (platform === 'linux') {
      const terminals = [
        `gnome-terminal --working-directory="${dirPath}"`,
        `konsole --workdir "${dirPath}"`,
        `xfce4-terminal --working-directory="${dirPath}"`,
        `xterm -e "cd '${dirPath}' && bash"`,
      ]

      this.tryCommands(terminals)
    } else if (platform === 'darwin') {
      exec(`open -a Terminal "${dirPath}"`)
    } else if (platform === 'win32') {
      exec(`start cmd.exe /K "cd /d ${dirPath}"`)
    }
  }

  private static tryCommands(commands: string[], index = 0): void {
    if (index >= commands.length) {
      console.error('Не удалось найти доступный терминал')
      return
    }

    exec(commands[index], (error) => {
      if (error) {
        this.tryCommands(commands, index + 1)
      }
    })
  }
}
