export class AppService {
    static async doPing(): Promise<string> {
      // Тут может быть работа с базой данных, файлами и т.д.
      return 'pong от слоя выполнения!'
    }
  }