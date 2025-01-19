import { ElectronAPI } from '@electron-toolkit/preload';
import type * as fs from 'fs'
import type * as os from 'os'
import type * as path from 'path'
import type * as fs from 'fs'



type fs = typeof fs;
type os = typeof os;
type path = typeof path;
type createInterface = typeof createInterface;
type util = typeof util;


declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      ping: () => Promise<string>;
      appGetPath: (name: string) => Promise<string>;
      pathSelect: () => Promise<string>;
    };
    NodeJS: {
      fs: fs;
      os: os;
      path: path;
      readline: {
        createInterface: createInterface;
      };
      util: util;
    };
  }
}
