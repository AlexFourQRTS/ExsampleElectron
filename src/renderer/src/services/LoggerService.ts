declare global {
  interface Window {
    electron?: {
      ipcRenderer?: {
        send: (channel: string, data: any) => void;
      };
    };
  }
}

export type LogLevel = "log" | "error" | "warn" | "info";

export class LoggerService {
  private originalLog: typeof console.log;
  private originalError: typeof console.error;
  private originalWarn: typeof console.warn;
  private originalInfo: typeof console.info;

  constructor() {
    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalWarn = console.warn;
    this.originalInfo = console.info;
  }

  private sendToMain(level: LogLevel, args: any[]): void {
    try {
      (window as any).electron?.ipcRenderer?.send("renderer-log", { level, args });
    } catch (e) {
      // Игнорируем ошибки отправки
    }
  }

  setup(): void {
    console.log = (...args: any[]) => {
      this.originalLog(...args);
      this.sendToMain("log", args);
    };

    console.error = (...args: any[]) => {
      this.originalError(...args);
      this.sendToMain("error", args);
    };

    console.warn = (...args: any[]) => {
      this.originalWarn(...args);
      this.sendToMain("warn", args);
    };

    console.info = (...args: any[]) => {
      this.originalInfo(...args);
      this.sendToMain("info", args);
    };

    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    window.addEventListener("error", (event) => {
      console.error(
        `Uncaught Error: ${event.message}`,
        `at ${event.filename}:${event.lineno}:${event.colno}`
      );
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error(`Unhandled Promise Rejection:`, event.reason);
    });
  }
}
