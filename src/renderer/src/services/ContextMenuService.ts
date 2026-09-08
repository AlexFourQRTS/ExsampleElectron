export interface ContextMenuAction {
  type: "create" | "rename" | "delete" | "hide" | "show-hidden";
  execute: () => Promise<void>;
}

export class ContextMenuService {
  async createFolder(parentPath: string, folderName: string): Promise<string> {
    return await window.api.createFolder(parentPath, folderName);
  }

  async renameItem(oldPath: string, newName: string): Promise<string> {
    return await window.api.renameItem(oldPath, newName);
  }

  async deleteItem(itemPath: string): Promise<void> {
    return await window.api.deleteItem(itemPath);
  }

  async hideFolder(folderPath: string): Promise<void> {
    return await window.api.hideFolder(folderPath);
  }

  async showFolder(folderPath: string): Promise<void> {
    return await window.api.showFolder(folderPath);
  }

  async getHiddenFolders(dirPath: string): Promise<string[]> {
    return await window.api.getHiddenFolders(dirPath);
  }

  async countHiddenFolders(dirPath: string): Promise<number> {
    return await window.api.countHiddenFolders(dirPath);
  }
}
