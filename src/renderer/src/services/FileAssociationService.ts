export interface FileAssociation {
  id: string;
  extension: string;
  appName: string;
  isDefault: boolean;
  order: number;
}

export interface FileAssociationConfig {
  associations: FileAssociation[];
  lastUpdated: string;
}

export const COMMON_EXTENSIONS = [
  { ext: ".txt", name: "Text Files" },
  { ext: ".pdf", name: "PDF Files" },
  { ext: ".jpg", name: "Image Files" },
  { ext: ".png", name: "Image Files" },
  { ext: ".mp3", name: "Audio Files" },
  { ext: ".mp4", name: "Video Files" },
  { ext: ".zip", name: "Archive Files" },
  { ext: ".json", name: "JSON Files" },
  { ext: ".xml", name: "XML Files" },
  { ext: ".html", name: "HTML Files" },
  { ext: ".css", name: "CSS Files" },
  { ext: ".js", name: "JavaScript Files" },
  { ext: ".py", name: "Python Files" },
];

export class FileAssociationService {
  private readonly CONFIG_KEY = "file_associations";

  getConfig(): FileAssociationConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Ошибка при загрузке ассоциаций файлов:", error);
    }

    return this.getDefaultConfig();
  }

  private getDefaultConfig(): FileAssociationConfig {
    return {
      associations: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  saveConfig(config: FileAssociationConfig): void {
    try {
      config.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error("Ошибка при сохранении ассоциаций файлов:", error);
    }
  }

  addAssociation(extension: string, appName: string, isDefault: boolean = true): void {
    const config = this.getConfig();
    const existingIndex = config.associations.findIndex(
      (a) => a.extension === extension && a.appName === appName
    );

    if (existingIndex === -1) {
      const newAssociation: FileAssociation = {
        id: `${extension}-${appName}`,
        extension,
        appName,
        isDefault,
        order: config.associations.length,
      };
      config.associations.push(newAssociation);
      this.saveConfig(config);
    }
  }

  removeAssociation(id: string): void {
    const config = this.getConfig();
    config.associations = config.associations.filter((a) => a.id !== id);
    this.saveConfig(config);
  }

  setDefault(id: string, extension: string): void {
    const config = this.getConfig();
    config.associations.forEach((a) => {
      if (a.extension === extension) {
        a.isDefault = a.id === id;
      }
    });
    this.saveConfig(config);
  }

  getAssociationsForExtension(extension: string): FileAssociation[] {
    const config = this.getConfig();
    return config.associations.filter((a) => a.extension === extension);
  }

  getDefaultApp(extension: string): FileAssociation | undefined {
    const config = this.getConfig();
    return config.associations.find((a) => a.extension === extension && a.isDefault);
  }

  reorderAssociations(associations: FileAssociation[]): void {
    const config = this.getConfig();
    associations.forEach((assoc, index) => {
      const configAssoc = config.associations.find((a) => a.id === assoc.id);
      if (configAssoc) {
        configAssoc.order = index;
      }
    });
    this.saveConfig(config);
  }
}
