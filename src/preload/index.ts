import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import * as path from 'path';
import * as fs from 'fs';
import { createInterface } from 'readline';
import * as utils from 'util';
import * as os from 'os';

// Custom APIs for renderer
const api = {
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),
  // gets full path to users 'downloads', 'desktop', 'documents', 'appData' ...
  appGetPath: (name: string): Promise<string> => ipcRenderer.invoke('appGetPath', name),
  pathSelect: (): Promise<string> => ipcRenderer.invoke('pathSelect')
};

const NodeJS = {
  path,
  fs,
  readLine: {
    createInterface: createInterface
  },
  utils,
  os
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('NodeJS', NodeJS);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
  // Globally expose NODEJS to renderer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).NodeJS = {
    path,
    fs,
    readLine: {
      createInterface: createInterface
    },
    utils,
    os
  };
}
