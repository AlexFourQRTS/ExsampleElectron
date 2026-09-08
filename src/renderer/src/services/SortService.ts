export type SortKey = "name" | "size" | "type";
export type SortDirection = "asc" | "desc";

interface SortableFile {
  type: "file" | "directory";
  name: string;
  stats?: { size?: number; extension?: string };
}

export class SortService {
  private readonly SORT_KEY_STORAGE = "explorer_sort_key";
  private readonly SORT_DIR_STORAGE = "explorer_sort_direction";

  getSortKey(): SortKey {
    const stored = localStorage.getItem(this.SORT_KEY_STORAGE);
    return stored === "size" || stored === "type" ? stored : "name";
  }

  setSortKey(key: SortKey): void {
    try {
      localStorage.setItem(this.SORT_KEY_STORAGE, key);
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  getSortDirection(): SortDirection {
    return localStorage.getItem(this.SORT_DIR_STORAGE) === "desc" ? "desc" : "asc";
  }

  setSortDirection(direction: SortDirection): void {
    try {
      localStorage.setItem(this.SORT_DIR_STORAGE, direction);
    } catch {
      // Игнорируем ошибки localStorage
    }
  }

  // Папки всегда идут первой группой независимо от выбранной сортировки —
  // так ведут себя все файловые менеджеры (Nautilus, Explorer, Finder)
  sortFiles<T extends SortableFile>(files: T[], key: SortKey, direction: SortDirection): T[] {
    const multiplier = direction === "asc" ? 1 : -1;

    return [...files].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }

      if (key === "size") {
        const sizeA = a.stats?.size ?? 0;
        const sizeB = b.stats?.size ?? 0;
        if (sizeA !== sizeB) return (sizeA - sizeB) * multiplier;
      } else if (key === "type") {
        const extA = (a.stats?.extension || "").toLowerCase();
        const extB = (b.stats?.extension || "").toLowerCase();
        if (extA !== extB) return extA.localeCompare(extB) * multiplier;
      }

      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }) * multiplier;
    });
  }
}
