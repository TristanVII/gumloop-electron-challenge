import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { dialog } from 'electron'
import icon from '../../resources/icon.png?asset';

// Register IPC handlers before window creation

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const exposeElectronAPI = (): void => {
  ipcMain.handle('ping', () => {
    console.log('pong');
    return 'pong';
  });

  ipcMain.handle('appGetPath', (_, name: string) => {
    const validPaths = [
      'home',
      'appData',
      'userData',
      'sessionData',
      'temp',
      'exe',
      'module',
      'desktop',
      'documents',
      'downloads',
      'music',
      'pictures',
      'videos',
      'recent',
      'logs',
      'crashDumps'
    ];
    if (validPaths.includes(name)) {
      return app.getPath(name as any);
    } else {
      throw Error('Invalid path name');
    }
  });

  ipcMain.handle('pathSelect', async () => {
    const result = await dialog.showOpenDialog({
      properties:['openDirectory']
    });
    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  });
};

// Expose Electron when App is ready
app.on('ready', exposeElectronAPI);
