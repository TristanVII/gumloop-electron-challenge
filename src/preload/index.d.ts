import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      ping: () => Promise<string>;
      appGetPath: (name: string) => Promise<string>;
      pathSelect: () => Promise<string>
    };
  }
}
