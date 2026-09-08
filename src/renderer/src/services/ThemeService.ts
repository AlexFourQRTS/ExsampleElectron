export type ThemeMode = "light" | "dark";

export class ThemeService {
  private readonly THEME_KEY = "explorer_theme_mode";

  getMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(this.THEME_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch {
      // Игнорируем ошибки localStorage
    }

    // Если тема не выбрана — используем системную настройку
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  setMode(mode: ThemeMode): void {
    try {
      localStorage.setItem(this.THEME_KEY, mode);
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  toggle(): ThemeMode {
    const next: ThemeMode = this.getMode() === "dark" ? "light" : "dark";
    this.setMode(next);
    return next;
  }
}
