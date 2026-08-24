import { contextBridge, ipcRenderer } from 'electron'

// Описываем API, которое будет доступно в window.api
const api = {
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (на случай отключенной изоляции контекста)
  window.api = api
}