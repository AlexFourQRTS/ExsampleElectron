export type ViewMode = "table" | "icons-small" | "icons-medium" | "icons-large";

export class ViewModeService {
  private readonly VIEW_MODE_KEY = "explorer_view_mode";
  private readonly SIDEBAR_VISIBLE_KEY = "explorer_sidebar_visible";
  private readonly PREVIEW_VISIBLE_KEY = "explorer_preview_visible";

  getViewMode(): ViewMode {
    try {
      const stored = localStorage.getItem(this.VIEW_MODE_KEY);
      if (stored === "table" || stored === "icons-small" || stored === "icons-medium" || stored === "icons-large") {
        return stored;
      }
    } catch {
      // Игнорируем ошибки localStorage
    }
    return "table";
  }

  setViewMode(mode: ViewMode): void {
    try {
      localStorage.setItem(this.VIEW_MODE_KEY, mode);
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  isSidebarVisible(): boolean {
    try {
      const stored = localStorage.getItem(this.SIDEBAR_VISIBLE_KEY);
      return stored === null ? true : JSON.parse(stored);
    } catch {
      return true;
    }
  }

  setSidebarVisible(visible: boolean): void {
    try {
      localStorage.setItem(this.SIDEBAR_VISIBLE_KEY, JSON.stringify(visible));
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  isPreviewVisible(): boolean {
    try {
      const stored = localStorage.getItem(this.PREVIEW_VISIBLE_KEY);
      return stored === null ? true : JSON.parse(stored);
    } catch {
      return true;
    }
  }

  setPreviewVisible(visible: boolean): void {
    try {
      localStorage.setItem(this.PREVIEW_VISIBLE_KEY, JSON.stringify(visible));
    } catch {
      // Игнорируем ошибки localStorage
    }
  }
}
