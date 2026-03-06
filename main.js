const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
import ExcelDB from './src/services/ExcelDB';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// --- IPC HANDLERS ---

const getRootPath = () => app.getPath('userData');
const getConfigPath = () => path.join(getRootPath(), 'config.json');
const getDbPath = () => path.join(getRootPath(), 'database.xlsx');

ipcMain.handle('load-config', () => {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.password && safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(config.password, 'base64');
        config.password = safeStorage.decryptString(buffer);
      } catch (e) { console.error('Error decrypt:', e); }
    }
    return config;
  }
  return { user: '', password: '', companies: [] };
});

ipcMain.on('save-config', (event, config) => {
  const configToSave = { ...config };
  if (configToSave.password && safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = safeStorage.encryptString(configToSave.password);
      configToSave.password = encrypted.toString('base64');
    } catch (e) { console.error('Error encrypt:', e); }
  }
  fs.writeFileSync(getConfigPath(), JSON.stringify(configToSave, null, 2));
});

// --- EXCEL DB HANDLERS ---

ipcMain.handle('db-check-record', (event, { alias, period, type }) => {
  return ExcelDB.findRecord(getDbPath(), alias, period, type);
});

ipcMain.on('db-add-record', (event, data) => {
  ExcelDB.addRecord(getDbPath(), data);
});

ipcMain.on('run-script', (event, { scriptName, params }) => {
  const scriptPath = path.join(__dirname, 'scripts', scriptName);
  const env = { 
    ...process.env, 
    ONVIO_USER: params.user,
    ONVIO_PASS: params.password,
    ONVIO_COMPANY: params.companyName,
    ONVIO_ALIAS: params.companyAlias,
    TARGET_MONTH: params.month,
    TARGET_YEAR: params.year
  };

  const child = spawn('node', [scriptPath], { env });

  child.stdout.on('data', (data) => {
    mainWindow.webContents.send('script-log', data.toString());
  });

  child.stderr.on('data', (data) => {
    mainWindow.webContents.send('script-log', `ERROR: ${data.toString()}`);
  });

  child.on('close', (code) => {
    mainWindow.webContents.send('script-log', `\n[FIN] Script finalizado con código ${code}\n`);
    mainWindow.webContents.send('script-finished', code);
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
