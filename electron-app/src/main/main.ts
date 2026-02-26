/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { app, BrowserWindow, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { registerRepoHandlers } from './repo-service';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

// Deep link URL pending navigation (received before window was ready)
let pendingDeepLinkUrl: string | null = null;

type NavigateToRepoPayload = {
  repoPath: string;
  filePath?: string;
};

function resolveNavigationPath(inputPath: string): NavigateToRepoPayload | null {
  const normalizedPath = path.resolve(inputPath);
  const stats = fs.statSync(normalizedPath, { throwIfNoEntry: false });
  if (!stats) return null;

  if (stats.isDirectory()) {
    return { repoPath: normalizedPath };
  }

  const parentDir = path.dirname(normalizedPath);
  const gitResult = spawnSync(
    'git',
    ['-C', parentDir, 'rev-parse', '--show-toplevel'],
    { encoding: 'utf8' },
  );

  const repoPath = gitResult.status === 0 ? gitResult.stdout.trim() : parentDir;
  if (!repoPath) return { repoPath: parentDir };

  const filePath = path.relative(repoPath, normalizedPath);
  if (!filePath || filePath.startsWith('..')) return { repoPath };

  return { repoPath, filePath };
}

function navigateToRepo(payload: NavigateToRepoPayload) {
  if (!mainWindow) return;
  mainWindow.webContents.send('navigate-to-repo', payload);
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
}

function handleDeepLinkUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'multi:') return;
    if (parsed.hostname === 'open' || parsed.pathname === '//open') {
      const targetPath = parsed.searchParams.get('path');
      if (!targetPath) return;
      const navigationTarget = resolveNavigationPath(targetPath);
      if (!navigationTarget) return;
      if (mainWindow) {
        navigateToRepo(navigationTarget);
      } else {
        pendingDeepLinkUrl = url;
      }
    }
  } catch {
    // Invalid URL, ignore
  }
}

// Single instance lock — forward deep links to existing instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    // On Windows/Linux the URL is passed as the last argument
    const url = argv.find((arg) => arg.startsWith('multi://'));
    if (url) handleDeepLinkUrl(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Register multi:// protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('multi', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('multi');
}

// macOS: open-url fires when app is already running or being launched
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLinkUrl(url);
});

registerRepoHandlers();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }

    // Handle any deep link URL that arrived before the window was ready
    if (pendingDeepLinkUrl) {
      handleDeepLinkUrl(pendingDeepLinkUrl);
      pendingDeepLinkUrl = null;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Check for deep link URL in process.argv (macOS cold start)
const argUrl = process.argv.find((arg) => arg.startsWith('multi://'));
if (argUrl) {
  pendingDeepLinkUrl = argUrl;
}

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
