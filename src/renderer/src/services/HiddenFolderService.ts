export class HiddenFolderService {
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

  async getHiddenFoldersList(): Promise<string[]> {
    return await window.api.getHiddenFoldersList();
  }

  async isFolderHidden(folderPath: string): Promise<boolean> {
    return await window.api.isFolderHidden(folderPath);
  }
}
