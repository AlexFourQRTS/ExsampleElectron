export interface AppSettings {
  selectedPath: string | null;
  useAsDefault: boolean;
}

export class SettingsService {
  private readonly LAST_PATH_KEY = "explorer_last_path";
  private readonly USE_AS_DEFAULT_KEY = "explorer_use_as_default";

  getLastPath(): string | null {
    try {
      return localStorage.getItem(this.LAST_PATH_KEY);
    } catch (error) {
      console.error("Ошибка при загрузке последней папки:", error);
      return null;
    }
  }

  setLastPath(path: string): void {
    try {
      localStorage.setItem(this.LAST_PATH_KEY, path);
    } catch (error) {
      console.error("Ошибка при сохранении пути:", error);
    }
  }

  isUseAsDefault(): boolean {
    try {
      const stored = localStorage.getItem(this.USE_AS_DEFAULT_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch (error) {
      console.error("Ошибка при загрузке настроек:", error);
      return false;
    }
  }

  setUseAsDefault(value: boolean): void {
    try {
      localStorage.setItem(this.USE_AS_DEFAULT_KEY, JSON.stringify(value));
    } catch (error) {
      console.error("Ошибка при сохранении настроек:", error);
    }
  }

  async registerAsDefault(): Promise<void> {
    try {
      await window.api.registerAsDefaultFileManager();
    } catch (error) {
      throw new Error(`Не удалось зарегистрировать приложение: ${error}`);
    }
  }

  openFolderDialog(): Promise<string | null> {
    return window.api.openFolderDialog();
  }

  getSettings(): AppSettings {
    return {
      selectedPath: this.getLastPath(),
      useAsDefault: this.isUseAsDefault(),
    };
  }
}
