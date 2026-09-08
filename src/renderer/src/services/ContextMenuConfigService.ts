export type ContextMenuContext = "item" | "empty" | "both";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  enabled: boolean;
  // Порядок хранится отдельно для каждого контекста — пункт "Создать" (context:
  // both) может стоять первым в меню пустой области, но пятым в меню файла,
  // это два независимых списка в настройках, не один общий
  orderItem: number;
  orderEmpty: number;
  type: "action" | "divider" | "submenu";
  context: ContextMenuContext;
}

export interface ContextMenuConfig {
  items: ContextMenuItem[];
  lastUpdated: string;
}

export const DEFAULT_CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  // Обновить — только для пустой области, перезагружает содержимое текущей папки
  { id: "refresh", label: "Обновить", icon: "refresh", enabled: true, orderItem: 0, orderEmpty: 0, type: "action", context: "empty" },
  { id: "divider-0", label: "", enabled: true, orderItem: 0, orderEmpty: 1, type: "divider", context: "empty" },

  // Открытие (только для выбранного элемента)
  { id: "open", label: "Открыть", icon: "open", enabled: true, orderItem: 0, orderEmpty: 0, type: "action", context: "item" },
  { id: "open-with", label: "Открыть с помощью...", icon: "open-with", enabled: true, orderItem: 1, orderEmpty: 0, type: "action", context: "item" },
  { id: "open-new-window", label: "Открыть в новом окне", icon: "open-new", enabled: true, orderItem: 2, orderEmpty: 0, type: "action", context: "item" },
  { id: "open-terminal", label: "Открыть в терминале", icon: "terminal", enabled: true, orderItem: 3, orderEmpty: 2, type: "action", context: "both" },
  { id: "divider-1", label: "", enabled: true, orderItem: 4, orderEmpty: 3, type: "divider", context: "both" },

  // Архивация (нужен выбранный файл/архив)
  { id: "compress", label: "Сжать (архив)", icon: "archive", enabled: true, orderItem: 5, orderEmpty: 0, type: "action", context: "item" },
  { id: "extract", label: "Извлечь архив", icon: "unarchive", enabled: true, orderItem: 6, orderEmpty: 0, type: "action", context: "item" },
  { id: "divider-2", label: "", enabled: true, orderItem: 7, orderEmpty: 0, type: "divider", context: "item" },

  // Поделиться / система (только для элемента)
  { id: "share", label: "Поделиться", icon: "share", enabled: false, orderItem: 8, orderEmpty: 0, type: "action", context: "item" },
  { id: "pin-taskbar", label: "Закрепить на панели задач", icon: "pin", enabled: false, orderItem: 9, orderEmpty: 0, type: "action", context: "item" },
  { id: "divider-3", label: "", enabled: true, orderItem: 10, orderEmpty: 0, type: "divider", context: "item" },

  // Буфер обмена: Cut/Copy — для элемента, Paste — для пустой области
  { id: "cut", label: "Вырезать", icon: "cut", enabled: true, orderItem: 11, orderEmpty: 0, type: "action", context: "item" },
  { id: "copy", label: "Копировать", icon: "copy", enabled: true, orderItem: 12, orderEmpty: 0, type: "action", context: "item" },
  { id: "paste", label: "Вставить", icon: "paste", enabled: true, orderItem: 0, orderEmpty: 4, type: "action", context: "empty" },
  { id: "divider-4", label: "", enabled: true, orderItem: 13, orderEmpty: 5, type: "divider", context: "both" },

  // Управление (только для выбранного элемента)
  { id: "create-shortcut", label: "Создать ярлык/ссылку", icon: "link", enabled: false, orderItem: 14, orderEmpty: 0, type: "action", context: "item" },
  { id: "delete-trash", label: "Переместить в корзину", icon: "delete", enabled: true, orderItem: 15, orderEmpty: 0, type: "action", context: "item" },
  { id: "delete-permanent", label: "Удалить безвозвратно", icon: "delete-forever", enabled: true, orderItem: 16, orderEmpty: 0, type: "action", context: "item" },
  { id: "rename", label: "Переименовать", icon: "edit", enabled: true, orderItem: 17, orderEmpty: 0, type: "action", context: "item" },
  { id: "divider-5", label: "", enabled: true, orderItem: 18, orderEmpty: 6, type: "divider", context: "both" },

  // Создание — подменю с типами (Папка, Текст, Markdown, JSON, скрипты и т.д.)
  { id: "create", label: "Создать", icon: "add", enabled: true, orderItem: 19, orderEmpty: 7, type: "submenu", context: "both" },
  { id: "divider-6", label: "", enabled: true, orderItem: 20, orderEmpty: 8, type: "divider", context: "both" },

  // Скрытые папки: скрыть — для выбранной папки, показать скрытые — для пустой области
  { id: "hide-folder", label: "Скрыть папку", icon: "visibility-off", enabled: true, orderItem: 21, orderEmpty: 0, type: "action", context: "item" },
  { id: "show-hidden", label: "Показать скрытые", icon: "visibility", enabled: true, orderItem: 0, orderEmpty: 9, type: "action", context: "empty" },
  { id: "divider-7", label: "", enabled: true, orderItem: 22, orderEmpty: 10, type: "divider", context: "both" },

  // Права доступа и специфика Linux (только для элемента)
  { id: "make-executable", label: "Сделать исполняемым (chmod +x)", icon: "terminal", enabled: true, orderItem: 23, orderEmpty: 0, type: "action", context: "item" },
  { id: "permissions", label: "Права доступа (chmod)", icon: "lock", enabled: false, orderItem: 24, orderEmpty: 0, type: "action", context: "item" },
  { id: "mount-iso", label: "Монтировать образ диска (ISO)", icon: "disc", enabled: false, orderItem: 25, orderEmpty: 0, type: "action", context: "item" },
  { id: "install-package", label: "Установить пакет (.deb/.rpm)", icon: "package", enabled: false, orderItem: 26, orderEmpty: 0, type: "action", context: "item" },
  { id: "divider-8", label: "", enabled: true, orderItem: 27, orderEmpty: 0, type: "divider", context: "item" },

  // Properties — только для выбранного элемента
  { id: "properties", label: "Свойства", icon: "info", enabled: true, orderItem: 28, orderEmpty: 0, type: "action", context: "item" },
];

export class ContextMenuConfigService {
  private readonly CONFIG_KEY = "context_menu_config";

  getConfig(): ContextMenuConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        return this.reconcileWithDefaults(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Ошибка при загрузке конфига меню:", error);
    }

    return this.getDefaultConfig();
  }

  // Сливает сохранённый пользователем конфиг с актуальным списком по умолчанию:
  // - новые пункты (появившиеся в новых версиях приложения) добавляются автоматически
  // - устаревшие id, которых больше нет в дефолтном списке, отбрасываются сами
  // - пользовательские enabled/orderItem/orderEmpty для существующих пунктов сохраняются
  // Без этого при каждом изменении набора пунктов меню пользователю пришлось бы
  // вручную жать "По умолчанию", иначе старый localStorage просто не знал бы о новых id
  private reconcileWithDefaults(stored: ContextMenuConfig): ContextMenuConfig {
    if (!stored?.items || !Array.isArray(stored.items)) {
      return this.getDefaultConfig();
    }

    const storedById = new Map(stored.items.map((item) => [item.id, item]));

    const merged = DEFAULT_CONTEXT_MENU_ITEMS.map((defaultItem) => {
      const existing = storedById.get(defaultItem.id);
      if (!existing) return defaultItem;

      return {
        ...defaultItem,
        enabled: typeof existing.enabled === "boolean" ? existing.enabled : defaultItem.enabled,
        orderItem: typeof existing.orderItem === "number" ? existing.orderItem : defaultItem.orderItem,
        orderEmpty: typeof existing.orderEmpty === "number" ? existing.orderEmpty : defaultItem.orderEmpty,
      };
    });

    return { items: merged, lastUpdated: stored.lastUpdated || new Date().toISOString() };
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

  // Список пунктов для реального рендера меню (учитывает enabled + сортировку
  // по нужному для контекста полю)
  getEnabledItems(context: ContextMenuContext = "both"): ContextMenuItem[] {
    const config = this.getConfig();
    const filtered = config.items
      .filter((item) => item.enabled)
      .filter((item) => item.context === "both" || item.context === context)
      .sort((a, b) => this.orderFor(a, context) - this.orderFor(b, context));

    return this.stripRedundantDividers(filtered);
  }

  // Список пунктов для экрана настроек одного конкретного контекста —
  // в отличие от getEnabledItems включает и выключенные пункты (чтобы их
  // можно было включить обратно) и не схлопывает разделители
  getItemsForContext(context: "item" | "empty"): ContextMenuItem[] {
    const config = this.getConfig();
    return config.items
      .filter((item) => item.context === "both" || item.context === context)
      .sort((a, b) => this.orderFor(a, context) - this.orderFor(b, context));
  }

  private orderFor(item: ContextMenuItem, context: ContextMenuContext): number {
    return context === "empty" ? item.orderEmpty : item.orderItem;
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

  // Переупорядочивает пункты ТОЛЬКО в рамках одного контекста — если среди
  // items встречается пункт с context "both", меняется лишь его позиция
  // для этого конкретного контекста, второй контекст не затрагивается
  reorderItems(items: ContextMenuItem[], context: "item" | "empty"): void {
    const config = this.getConfig();
    items.forEach((item, index) => {
      const configItem = config.items.find((i) => i.id === item.id);
      if (!configItem) return;

      if (context === "empty") {
        configItem.orderEmpty = index;
      } else {
        configItem.orderItem = index;
      }
    });
    this.saveConfig(config);
  }

  resetToDefault(): void {
    this.saveConfig(this.getDefaultConfig());
  }
}
