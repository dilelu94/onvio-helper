import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ExcelDB from './src/services/ExcelDB.js';

// En ESM no existe __dirname por defecto, lo definimos así:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Para autoUpdater si usa commonjs internamente
const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  // Intentar leer la versión desde package.json (funciona en dev y prod si se incluye en files)
  let version = app.getVersion();
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      version = pkg.version;
    }
  } catch (e) {
    console.error('Error leyendo package.json para la versión:', e);
  }
  
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    title: `Onvio Helper v${version} 🚀`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Asegurar que el título no cambie después de cargar el contenido
  mainWindow.on('page-title-updated', (e) => e.preventDefault());

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // Notificaciones de Auto-Update para el usuario
  autoUpdater.on('update-available', () => {
    console.log('Actualización disponible.');
    if (mainWindow) {
      mainWindow.webContents.send('script-log', '\n[SISTEMA] Nueva versión detectada. Descargando en segundo plano...\n');
    }
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('Actualización descargada.');
    if (mainWindow) {
      mainWindow.webContents.send('script-log', '\n[SISTEMA] ¡Actualización lista! Se aplicará al reiniciar el programa.\n');
    }
  });
}

// --- IPC HANDLERS ---

const getRootPath = () => app.getPath('userData');
const getDesktopPath = () => app.getPath('desktop');

const getConfigPath = () => {
  const p = path.join(getRootPath(), 'config.json');
  return p;
};

const getDbPath = () => path.join(getRootPath(), 'database.xlsx');

ipcMain.handle('load-config', () => {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.password && safeStorage.isEncryptionAvailable()) {
        try {
          const buffer = Buffer.from(config.password, 'base64');
          config.password = safeStorage.decryptString(buffer);
        } catch (e) { console.error('Error decrypt:', e); }
      }
      return config;
    } catch (e) {
      console.error('Error parsing config.json:', e);
    }
  }
  return { user: '', password: '', companies: [] };
});

ipcMain.on('save-config', (event, config) => {
  const configPath = getConfigPath();
  const configToSave = { ...config };
  if (configToSave.password && safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = safeStorage.encryptString(configToSave.password);
      configToSave.password = encrypted.toString('base64');
    } catch (e) { console.error('Error encrypt:', e); }
  }
  fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2));
});

// --- EXCEL DB HANDLERS ---

ipcMain.handle('db-check-record', (event, { alias, period, type }) => {
  return ExcelDB.findRecord(getDbPath(), alias, period, type);
});

ipcMain.handle('check-file-exists', (event, { year, period, alias, type }) => {
  const desktop = getDesktopPath();
  const typeFolder = "Liquidaciones";
  const fileName = type === 'Totales' ? 'Planilla_Totales_Generales.pdf' : 'Liquidaciones_Detalladas.xlsx';
  
  const filePath = path.join(
    desktop,
    typeFolder,
    period.replace('/', ' '),
    alias.replace(/[^a-z0-9 ]/gi, ' ').trim(),
    fileName
  );
  
  return fs.existsSync(filePath);
});

ipcMain.on('db-add-record', (event, data) => {
  ExcelDB.addRecord(getDbPath(), data);
});

ipcMain.on('run-script', (event, { scriptName, params }) => {
  // En producción (dentro de asar), los scripts están en resources/app.asar/scripts/
  // o si están fuera de asar (descomprimidos), en resources/app/scripts/
  const scriptPath = path.join(__dirname, 'scripts', scriptName);
  const desktop = getDesktopPath();
  
  const env = { 
    ...process.env, 
    ONVIO_USER: params.user,
    ONVIO_PASS: params.password,
    ONVIO_COMPANY: params.companyName,
    ONVIO_ALIAS: params.companyAlias,
    TARGET_MONTH: params.month,
    TARGET_YEAR: params.year,
    MONTO_ACTUALIZAR: params.updateValue,
    TARGET_DATE: params.updateDate,
    DESKTOP_PATH: desktop,
    ELECTRON_RUN_AS_NODE: '1' // Fuerza a Electron a actuar como Node.js puro
  };

  const child = spawn(process.execPath, [scriptPath], { 
    env,
    stdio: ['inherit', 'pipe', 'pipe'] 
  });

  child.stdout.on('data', (data) => {
    if (mainWindow) mainWindow.webContents.send('script-log', data.toString());
  });

  child.stderr.on('data', (data) => {
    if (mainWindow) mainWindow.webContents.send('script-log', `ERROR: ${data.toString()}`);
  });

  child.on('close', (code) => {
    if (mainWindow) {
      mainWindow.webContents.send('script-log', `\n[FIN] Script finalizado con código ${code}\n`);
      mainWindow.webContents.send('script-finished', code);
    }
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
