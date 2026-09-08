import { registerCoreHandlers } from "./core/core";
import { registerFolderHandlers } from "./folder/folder";
import { registerFileHandlers } from "./file/file";
import { registerClipboardHandlers } from "./clipboard/clipboard";
import { registerArchiveHandlers } from "./archive/archive";
import { registerPermissionsHandlers } from "./permissions/permissions";
import { registerSidebarHandlers } from "./sidebar/sidebar";
import { registerThumbnailHandlers } from "./thumbnail/thumbnail";
import { registerSystemIntegrationHandlers } from "./systemIntegration/systemIntegration";

export function setupIpcHandlers(): void {
  registerCoreHandlers();
  registerFolderHandlers();
  registerFileHandlers();
  registerClipboardHandlers();
  registerArchiveHandlers();
  registerPermissionsHandlers();
  registerSidebarHandlers();
  registerThumbnailHandlers();
  registerSystemIntegrationHandlers();
}
