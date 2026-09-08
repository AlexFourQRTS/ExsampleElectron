export interface CreateFileType {
  id: string;
  label: string;
  icon: string;
  extension: string;
  isFolder: boolean;
  defaultName: string;
}

export const CREATE_FILE_TYPES: CreateFileType[] = [
  { id: "folder", label: "Папку", icon: "folder", extension: "", isFolder: true, defaultName: "Новая папка" },
  { id: "text", label: "Текстовый документ", icon: "text", extension: ".txt", isFolder: false, defaultName: "Новый текстовый документ.txt" },
  { id: "markdown", label: "Markdown документ", icon: "markdown", extension: ".md", isFolder: false, defaultName: "Новый документ.md" },
  { id: "json", label: "JSON файл", icon: "json", extension: ".json", isFolder: false, defaultName: "новый.json" },
  { id: "html", label: "HTML документ", icon: "html", extension: ".html", isFolder: false, defaultName: "новый.html" },
  { id: "css", label: "CSS файл", icon: "css", extension: ".css", isFolder: false, defaultName: "новый.css" },
  { id: "javascript", label: "JavaScript файл", icon: "js", extension: ".js", isFolder: false, defaultName: "новый.js" },
  { id: "python", label: "Python скрипт", icon: "python", extension: ".py", isFolder: false, defaultName: "новый.py" },
  { id: "bash", label: "Bash скрипт", icon: "terminal", extension: ".sh", isFolder: false, defaultName: "новый_скрипт.sh" },
  { id: "csv", label: "Таблица CSV", icon: "table", extension: ".csv", isFolder: false, defaultName: "новая_таблица.csv" },
  { id: "shortcut", label: "Ярлык / ссылку", icon: "link", extension: ".desktop", isFolder: false, defaultName: "новый_ярлык.desktop" },
];

export class CreateFileTypesService {
  private readonly CONFIG_KEY = "create_file_types_enabled";

  getEnabledTypes(): CreateFileType[] {
    const enabledIds = this.getEnabledIds();
    return CREATE_FILE_TYPES.filter((type) => enabledIds.includes(type.id));
  }

  getAllTypes(): CreateFileType[] {
    return CREATE_FILE_TYPES;
  }

  getEnabledIds(): string[] {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Ошибка при загрузке типов создания файлов:", error);
    }
    return CREATE_FILE_TYPES.map((t) => t.id);
  }

  setEnabledIds(ids: string[]): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error("Ошибка при сохранении типов создания файлов:", error);
    }
  }

  toggleType(id: string, enabled: boolean): void {
    const current = this.getEnabledIds();
    const updated = enabled
      ? [...new Set([...current, id])]
      : current.filter((i) => i !== id);
    this.setEnabledIds(updated);
  }

  resetToDefault(): void {
    this.setEnabledIds(CREATE_FILE_TYPES.map((t) => t.id));
  }
}
