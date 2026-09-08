import { contextBridge, ipcRenderer } from 'electron';
import { coreApi } from './core/core';
import { folderApi } from './folder/folder';
import { fileApi } from './file/file';
import { clipboardApi } from './clipboard/clipboard';
import { archiveApi } from './archive/archive';
import { permissionsApi } from './permissions/permissions';
import { sidebarApi } from './sidebar/sidebar';
import { thumbnailApi } from './thumbnail/thumbnail';
import { systemIntegrationApi } from './systemIntegration/systemIntegration';

contextBridge.exposeInMainWorld('api', {
  ...coreApi,
  ...folderApi,
  ...fileApi,
  ...clipboardApi,
  ...archiveApi,
  ...permissionsApi,
  ...sidebarApi,
  ...thumbnailApi,
  ...systemIntegrationApi,
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data: any) => ipcRenderer.send(channel, data),
  },
});
