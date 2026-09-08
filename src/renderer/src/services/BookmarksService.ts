export interface Bookmark {
  id: string;
  label: string;
  path: string;
}

export class BookmarksService {
  private readonly STORAGE_KEY = "explorer_bookmarks";

  getAll(): Bookmark[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (error) {
      console.error("Ошибка при загрузке закладок:", error);
    }
    return [];
  }

  add(path: string, label?: string): void {
    const bookmarks = this.getAll();
    if (bookmarks.some((b) => b.path === path)) return;

    const name = label || path.split("/").filter(Boolean).pop() || path;
    bookmarks.push({ id: `bookmark-${Date.now()}`, label: name, path });
    this.save(bookmarks);
  }

  remove(id: string): void {
    const bookmarks = this.getAll().filter((b) => b.id !== id);
    this.save(bookmarks);
  }

  isBookmarked(path: string): boolean {
    return this.getAll().some((b) => b.path === path);
  }

  reorder(bookmarks: Bookmark[]): void {
    this.save(bookmarks);
  }

  private save(bookmarks: Bookmark[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error("Ошибка при сохранении закладок:", error);
    }
  }
}
