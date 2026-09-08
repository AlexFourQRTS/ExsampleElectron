export interface FolderStats {
  size: number;
  fileCount: number;
}

export class FolderService {
  async openFolder(folderPath: string): Promise<any[]> {
    return await window.api.getFolderFilesFiltered(folderPath);
  }

  async getItemStats(itemPath: string): Promise<any> {
    return await window.api.getItemStats(itemPath);
  }

  async calculateFolderSize(folderPath: string): Promise<number> {
    return await window.api.calculateFolderSize(folderPath);
  }

  async countFolderFiles(folderPath: string): Promise<number> {
    return await window.api.countFolderFiles(folderPath);
  }

  async getTreeStructure(folderPath: string): Promise<any> {
    return await window.api.getOnlyDirectoriesTreeFiltered(folderPath);
  }

  async getFolderStats(folderPath: string): Promise<FolderStats> {
    const [size, fileCount] = await Promise.all([
      this.calculateFolderSize(folderPath),
      this.countFolderFiles(folderPath),
    ]);

    return { size, fileCount };
  }

  getHomeDirectory(): string {
    return process.env.HOME || process.env.USERPROFILE || "/home";
  }
}
