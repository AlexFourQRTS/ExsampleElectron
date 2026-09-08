export type ContextMenuContext = "item" | "empty";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  // Раньше было одно поле context ("item"/"empty"/"both"), которое жёстко
  // решало, где пункт МОЖЕТ появиться — пользователь не мог включить то,
  // что "логически" не имело смысла для контекста. Теперь оба списка в
  // настройках показывают ВСЕ пункты, а включение независимое на каждый
  // контекст — пользователь сам решает, что ему нужно, а не мы за него.
  enabledForItem: boolean;
  enabledForEmpty: boolean;
  orderItem: number;
  orderEmpty: number;
  type: "action" | "divider" | "submenu";
}

export interface ContextMenuConfig {
  items: ContextMenuItem[];
  lastUpdated: string;
}

export const DEFAULT_CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  // Обновить — по умолчанию для пустой области, перезагружает содержимое папки
  { id: "refresh", label: "Обновить", icon: "refresh", enabledForItem: false, enabledForEmpty: true, orderItem: 0, orderEmpty: 0, type: "action" },
  { id: "divider-0", label: "", enabledForItem: false, enabledForEmpty: true, orderItem: 0, orderEmpty: 1, type: "divider" },

  // Открытие
  { id: "open", label: "Открыть", icon: "open", enabledForItem: true, enabledForEmpty: false, orderItem: 0, orderEmpty: 0, type: "action" },
  { id: "open-with", label: "Открыть с помощью...", icon: "open-with", enabledForItem: true, enabledForEmpty: false, orderItem: 1, orderEmpty: 0, type: "action" },
  { id: "open-new-window", label: "Открыть в новом окне", icon: "open-new", enabledForItem: true, enabledForEmpty: false, orderItem: 2, orderEmpty: 0, type: "action" },
  { id: "open-terminal", label: "Открыть в терминале", icon: "terminal", enabledForItem: true, enabledForEmpty: true, orderItem: 3, orderEmpty: 2, type: "action" },
  { id: "divider-1", label: "", enabledForItem: true, enabledForEmpty: true, orderItem: 4, orderEmpty: 3, type: "divider" },

  // Архивация
  { id: "compress", label: "Сжать (архив)", icon: "archive", enabledForItem: true, enabledForEmpty: false, orderItem: 5, orderEmpty: 0, type: "action" },
  { id: "extract", label: "Извлечь архив", icon: "unarchive", enabledForItem: true, enabledForEmpty: false, orderItem: 6, orderEmpty: 0, type: "action" },
  { id: "divider-2", label: "", enabledForItem: true, enabledForEmpty: false, orderItem: 7, orderEmpty: 0, type: "divider" },

  // Поделиться / система
  { id: "share", label: "Поделиться", icon: "share", enabledForItem: false, enabledForEmpty: false, orderItem: 8, orderEmpty: 0, type: "action" },
  { id: "pin-taskbar", label: "Закрепить на панели задач", icon: "pin", enabledForItem: false, enabledForEmpty: false, orderItem: 9, orderEmpty: 0, type: "action" },
  { id: "divider-3", label: "", enabledForItem: true, enabledForEmpty: false, orderItem: 10, orderEmpty: 0, type: "divider" },

  // Буфер обмена
  { id: "cut", label: "Вырезать", icon: "cut", enabledForItem: true, enabledForEmpty: false, orderItem: 11, orderEmpty: 0, type: "action" },
  { id: "copy", label: "Копировать", icon: "copy", enabledForItem: true, enabledForEmpty: false, orderItem: 12, orderEmpty: 0, type: "action" },
  { id: "paste", label: "Вставить", icon: "paste", enabledForItem: false, enabledForEmpty: true, orderItem: 0, orderEmpty: 4, type: "action" },
  { id: "divider-4", label: "", enabledForItem: true, enabledForEmpty: true, orderItem: 13, orderEmpty: 5, type: "divider" },

  // Управление
  { id: "create-shortcut", label: "Создать ярлык/ссылку", icon: "link", enabledForItem: false, enabledForEmpty: false, orderItem: 14, orderEmpty: 0, type: "action" },
  { id: "delete-trash", label: "Переместить в корзину", icon: "delete", enabledForItem: true, enabledForEmpty: false, orderItem: 15, orderEmpty: 0, type: "action" },
  { id: "delete-permanent", label: "Удалить безвозвратно", icon: "delete-forever", enabledForItem: true, enabledForEmpty: false, orderItem: 16, orderEmpty: 0, type: "action" },
  { id: "rename", label: "Переименовать", icon: "edit", enabledForItem: true, enabledForEmpty: false, orderItem: 17, orderEmpty: 0, type: "action" },
  { id: "divider-5", label: "", enabledForItem: true, enabledForEmpty: true, orderItem: 18, orderEmpty: 6, type: "divider" },

  // Создание — подменю с типами (Папка, Текст, Markdown, JSON, скрипты и т.д.)
  { id: "create", label: "Создать", icon: "add", enabledForItem: true, enabledForEmpty: true, orderItem: 19, orderEmpty: 7, type: "submenu" },
  { id: "divider-6", label: "", enabledForItem: true, enabledForEmpty: true, orderItem: 20, orderEmpty: 8, type: "divider" },

  // Скрытые папки
  { id: "hide-folder", label: "Скрыть папку", icon: "visibility-off", enabledForItem: true, enabledForEmpty: false, orderItem: 21, orderEmpty: 0, type: "action" },
  { id: "show-hidden", label: "Показать скрытые", icon: "visibility", enabledForItem: false, enabledForEmpty: true, orderItem: 0, orderEmpty: 9, type: "action" },
  { id: "divider-7", label: "", enabledForItem: true, enabledForEmpty: true, orderItem: 22, orderEmpty: 10, type: "divider" },

  // Права доступа и специфика Linux
  { id: "make-executable", label: "Сделать исполняемым (chmod +x)", icon: "terminal", enabledForItem: true, enabledForEmpty: false, orderItem: 23, orderEmpty: 0, type: "action" },
  { id: "permissions", label: "Права доступа (chmod)", icon: "lock", enabledForItem: false, enabledForEmpty: false, orderItem: 24, orderEmpty: 0, type: "action" },
  { id: "mount-iso", label: "Монтировать образ диска (ISO)", icon: "disc", enabledForItem: false, enabledForEmpty: false, orderItem: 25, orderEmpty: 0, type: "action" },
  { id: "install-package", label: "Установить пакет (.deb/.rpm)", icon: "package", enabledForItem: false, enabledForEmpty: false, orderItem: 26, orderEmpty: 0, type: "action" },
  { id: "divider-8", label: "", enabledForItem: true, enabledForEmpty: false, orderItem: 27, orderEmpty: 0, type: "divider" },

  // Свойства
  { id: "properties", label: "Свойства", icon: "info", enabledForItem: true, enabledForEmpty: false, orderItem: 28, orderEmpty: 0, type: "action" },
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

  // Сливает сохранённый конфиг с актуальным списком по умолчанию:
  // - новые пункты добавляются автоматически
  // - устаревшие id отбрасываются сами
  // - пользовательские enabledForItem/enabledForEmpty/orderItem/orderEmpty сохраняются
  // Также аккуратно мигрирует ОЧЕНЬ старый формат (единое поле enabled + context),
  // чтобы апгрейд схемы не обнулял пользовательские настройки молча
  private reconcileWithDefaults(stored: ContextMenuConfig): ContextMenuConfig {
    if (!stored?.items || !Array.isArray(stored.items)) {
      return this.getDefaultConfig();
    }

    const storedById = new Map(stored.items.map((item) => [item.id, item as any]));

    const merged = DEFAULT_CONTEXT_MENU_ITEMS.map((defaultItem) => {
      const existing = storedById.get(defaultItem.id);
      if (!existing) return defaultItem;

      // Миграция самого старого формата: было единое `enabled` + `context`
      const legacyEnabled = typeof existing.enabled === "boolean" ? existing.enabled : null;
      const legacyContext = typeof existing.context === "string" ? existing.context : null;

      let enabledForItem = defaultItem.enabledForItem;
      let enabledForEmpty = defaultItem.enabledForEmpty;

      if (typeof existing.enabledForItem === "boolean") {
        enabledForItem = existing.enabledForItem;
      } else if (legacyEnabled !== null && legacyContext) {
        enabledForItem = legacyContext === "both" || legacyContext === "item" ? legacyEnabled : false;
      }

      if (typeof existing.enabledForEmpty === "boolean") {
        enabledForEmpty = existing.enabledForEmpty;
      } else if (legacyEnabled !== null && legacyContext) {
        enabledForEmpty = legacyContext === "both" || legacyContext === "empty" ? legacyEnabled : false;
      }

      return {
        ...defaultItem,
        enabledForItem,
        enabledForEmpty,
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

  private isEnabledFor(item: ContextMenuItem, context: ContextMenuContext): boolean {
    return context === "empty" ? item.enabledForEmpty : item.enabledForItem;
  }

  private orderFor(item: ContextMenuItem, context: ContextMenuContext): number {
    return context === "empty" ? item.orderEmpty : item.orderItem;
  }

  // Список пунктов для реального рендера меню в момент правого клика
  getEnabledItems(context: ContextMenuContext): ContextMenuItem[] {
    const config = this.getConfig();
    const filtered = config.items
      .filter((item) => this.isEnabledFor(item, context))
      .sort((a, b) => this.orderFor(a, context) - this.orderFor(b, context));

    return this.stripRedundantDividers(filtered);
  }

  // Список пунктов для экрана настроек — теперь ВСЕГДА полный список (все
  // пункты меню, в любом контексте), с независимым флагом enabled для
  // конкретного контекста; пользователь сам решает, что включить, а не мы
  // фильтруем "логичное"
  getItemsForContext(context: ContextMenuContext): ContextMenuItem[] {
    const config = this.getConfig();
    return [...config.items].sort((a, b) => this.orderFor(a, context) - this.orderFor(b, context));
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

  toggleItem(itemId: string, enabled: boolean, context: ContextMenuContext): void {
    const config = this.getConfig();
    const item = config.items.find((i) => i.id === itemId);
    if (!item) return;

    if (context === "empty") {
      item.enabledForEmpty = enabled;
    } else {
      item.enabledForItem = enabled;
    }
    this.saveConfig(config);
  }

  // Переупорядочивает пункты ТОЛЬКО в рамках одного контекста
  reorderItems(items: ContextMenuItem[], context: ContextMenuContext): void {
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
