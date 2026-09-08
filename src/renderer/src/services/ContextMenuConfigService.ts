export type ContextMenuContext = "item" | "empty" | "both";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  enabled: boolean;
  order: number;
  type: "action" | "divider" | "submenu";
  context: ContextMenuContext;
}

export interface ContextMenuConfig {
  items: ContextMenuItem[];
  lastUpdated: string;
}

export const DEFAULT_CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  // Открытие (только для выбранного элемента)
  { id: "open", label: "Открыть", icon: "open", enabled: true, order: 0, type: "action", context: "item" },
  { id: "open-with", label: "Открыть с помощью...", icon: "open-with", enabled: true, order: 1, type: "action", context: "item" },
  { id: "open-new-window", label: "Открыть в новом окне", icon: "open-new", enabled: true, order: 2, type: "action", context: "item" },
  { id: "open-terminal", label: "Открыть в терминале", icon: "terminal", enabled: true, order: 3, type: "action", context: "both" },
  { id: "divider-1", label: "", enabled: true, order: 4, type: "divider", context: "both" },

  // Архивация (нужен выбранный файл/архив)
  { id: "compress", label: "Сжать (архив)", icon: "archive", enabled: true, order: 5, type: "action", context: "item" },
  { id: "extract", label: "Извлечь архив", icon: "unarchive", enabled: true, order: 6, type: "action", context: "item" },
  { id: "divider-2", label: "", enabled: true, order: 7, type: "divider", context: "item" },

  // Поделиться / система (только для элемента)
  { id: "share", label: "Поделиться", icon: "share", enabled: false, order: 8, type: "action", context: "item" },
  { id: "pin-taskbar", label: "Закрепить на панели задач", icon: "pin", enabled: false, order: 9, type: "action", context: "item" },
  { id: "divider-3", label: "", enabled: true, order: 10, type: "divider", context: "item" },

  // Буфер обмена: Cut/Copy — для элемента, Paste — для пустой области
  { id: "cut", label: "Вырезать", icon: "cut", enabled: true, order: 11, type: "action", context: "item" },
  { id: "copy", label: "Копировать", icon: "copy", enabled: true, order: 12, type: "action", context: "item" },
  { id: "paste", label: "Вставить", icon: "paste", enabled: true, order: 13, type: "action", context: "empty" },
  { id: "divider-4", label: "", enabled: true, order: 14, type: "divider", context: "both" },

  // Управление (только для выбранного элемента)
  { id: "create-shortcut", label: "Создать ярлык/ссылку", icon: "link", enabled: false, order: 15, type: "action", context: "item" },
  { id: "delete-trash", label: "Переместить в корзину", icon: "delete", enabled: true, order: 16, type: "action", context: "item" },
  { id: "delete-permanent", label: "Удалить безвозвратно", icon: "delete-forever", enabled: true, order: 17, type: "action", context: "item" },
  { id: "rename", label: "Переименовать", icon: "edit", enabled: true, order: 18, type: "action", context: "item" },
  { id: "divider-5", label: "", enabled: true, order: 19, type: "divider", context: "both" },

  // Создание — подменю с типами (Папка, Текст, Markdown, JSON, скрипты и т.д.)
  { id: "create", label: "Создать", icon: "add", enabled: true, order: 20, type: "submenu", context: "both" },
  { id: "divider-6", label: "", enabled: true, order: 22, type: "divider", context: "both" },

  // Скрытые папки: скрыть — для выбранной папки, показать скрытые — для пустой области
  { id: "hide-folder", label: "Скрыть папку", icon: "visibility-off", enabled: true, order: 23, type: "action", context: "item" },
  { id: "show-hidden", label: "Показать скрытые", icon: "visibility", enabled: true, order: 24, type: "action", context: "empty" },
  { id: "divider-7", label: "", enabled: true, order: 25, type: "divider", context: "both" },

  // Права доступа и специфика Linux (только для элемента)
  { id: "make-executable", label: "Сделать исполняемым (chmod +x)", icon: "terminal", enabled: true, order: 26, type: "action", context: "item" },
  { id: "permissions", label: "Права доступа (chmod)", icon: "lock", enabled: false, order: 27, type: "action", context: "item" },
  { id: "mount-iso", label: "Монтировать образ диска (ISO)", icon: "disc", enabled: false, order: 28, type: "action", context: "item" },
  { id: "install-package", label: "Установить пакет (.deb/.rpm)", icon: "package", enabled: false, order: 29, type: "action", context: "item" },
  { id: "divider-8", label: "", enabled: true, order: 30, type: "divider", context: "item" },

  // Properties — только для выбранного элемента
  { id: "properties", label: "Свойства", icon: "info", enabled: true, order: 31, type: "action", context: "item" },
];

export class ContextMenuConfigService {
  private readonly CONFIG_KEY = "context_menu_config";

  getConfig(): ContextMenuConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Ошибка при загрузке конфига меню:", error);
    }

    return this.getDefaultConfig();
  }

  private getDefaultConfig(): ContextMenuConfig {
    return {
      items: DEFAULT_CONTEXT_MENU_ITEMS,
      lastUpdated: new Date().toISOString(),
    };
  }

  saveConfig(config: ContextMenuConfig): void {
    try {
      config.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error("Ошибка при сохранении конфига меню:", error);
    }
  }

  getEnabledItems(context: ContextMenuContext = "both"): ContextMenuItem[] {
    const config = this.getConfig();
    const filtered = config.items
      .filter((item) => item.enabled)
      .filter((item) => item.context === "both" || item.context === context)
      .sort((a, b) => a.order - b.order);

    return this.stripRedundantDividers(filtered);
  }

  private stripRedundantDividers(items: ContextMenuItem[]): ContextMenuItem[] {
    const result: ContextMenuItem[] = [];

    for (const item of items) {
      if (item.type === "divider") {
        const prev = result[result.length - 1];
        if (!prev || prev.type === "divider") continue;
      }
      result.push(item);
    }

    while (result.length > 0 && result[result.length - 1].type === "divider") {
      result.pop();
    }

    return result;
  }

  toggleItem(itemId: string, enabled: boolean): void {
    const config = this.getConfig();
    const item = config.items.find((i) => i.id === itemId);
    if (item) {
      item.enabled = enabled;
      this.saveConfig(config);
    }
  }

  reorderItems(items: ContextMenuItem[]): void {
    const config = this.getConfig();
    items.forEach((item, index) => {
      const configItem = config.items.find((i) => i.id === item.id);
      if (configItem) {
        configItem.order = index;
      }
    });
    this.saveConfig(config);
  }

  resetToDefault(): void {
    this.saveConfig(this.getDefaultConfig());
  }
}
