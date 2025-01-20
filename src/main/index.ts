import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { dialog } from 'electron';

// Register IPC handlers before window creation

const getIcon = (): string => {
  if (is.dev) {
    return join(__dirname, '../../resources/icon.icns');
  } else {
    return join(process.resourcesPath, 'icon.icns');
  }
};

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: getIcon(),
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
      properties: ['openDirectory']
    });
    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  });
};

// Expose Electron when App is ready
app.on('ready', () => {
  exposeElectronAPI();
  createTray();
  // Set the dock icon for macOS
  if (isMacOS()) {
    app.dock.setIcon(getIcon());
  }
});

const createOrFocusWindow = (): void => {
  console.log('IMPLEMENT');
};

const quitApplication = (): void => {
  app.quit();
};

const createTray = (): void => {
  let trayIcon;
  if (is.dev) {
    // In development, use the path relative to project root
    trayIcon = join(__dirname, '../../resources/tray.png');
  } else {
    // In production, use the path relative to the app resources
    trayIcon = join(process.resourcesPath, 'tray.png');
  }

  try {
    const tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Gumloop', type: 'normal', click: createOrFocusWindow },
      {
        label: 'Quit',
        type: 'normal',
        click: quitApplication
      }
    ]);
    tray.setToolTip('Gumloop Desktop Application');
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
};

function isMacOS(): boolean {
  return process.platform === 'darwin';
}

// function isWin(): boolean {
//   return process.platform === 'win32';
// }
//
// function isLinux(): boolean {
//   return process.platform === 'linux';
// }
