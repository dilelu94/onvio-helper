import { app, BrowserWindow, ipcMain, safeStorage, Menu } from 'electron';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ExcelDB from './src/services/ExcelDB.js';

// Leer version desde package.json
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// En ESM no existe __dirname por defecto, lo definimos así:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Para autoUpdater si usa commonjs internamente
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  // Eliminar el menú superior (File, Edit, etc)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    title: `Onvio Helper v${pkg.version}`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Asegurar que el título no cambie por el HTML
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
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
const getDesktopPath = () => app.getPath('desktop');

const getConfigPath = () => {
  const p = path.join(getRootPath(), 'config.json');
  console.log('Ruta de configuración:', p);
  return p;
};

const getDbPath = () => path.join(getRootPath(), 'database.xlsx');

ipcMain.handle('load-config', () => {
  const configPath = getConfigPath();
  console.log('Intentando cargar configuración desde:', configPath);
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Configuración cargada con éxito. Empresas:', config.companies?.length || 0);
    if (config.password && safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(config.password, 'base64');
        config.password = safeStorage.decryptString(buffer);
      } catch (e) { console.error('Error decrypt:', e); }
    }
    return config;
  }
  console.log('No se encontró archivo de configuración.');
  return { user: '', password: '', companies: [] };
});

ipcMain.on('save-config', (event, config) => {
  const configPath = getConfigPath();
  console.log('Guardando configuración en:', configPath);
  const configToSave = { ...config };
  if (configToSave.password && safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = safeStorage.encryptString(configToSave.password);
      configToSave.password = encrypted.toString('base64');
    } catch (e) { console.error('Error encrypt:', e); }
  }
  fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2));
  console.log('Configuración guardada. Empresas:', configToSave.companies?.length || 0);
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
  let scriptPath;
  
  if (app.isPackaged) {
    // 1. Intento en resources/scripts (extraResources)
    const path1 = path.join(process.resourcesPath, 'scripts', scriptName);
    // 2. Intento en resources/app.asar.unpacked/scripts (asarUnpack)
    const path2 = path.join(process.resourcesPath, 'app.asar.unpacked', 'scripts', scriptName);
    
    if (fs.existsSync(path1)) {
      scriptPath = path1;
    } else if (fs.existsSync(path2)) {
      scriptPath = path2;
    } else {
      // Si falla, mostramos diagnóstico completo
      let resContent = [];
      try { resContent = fs.readdirSync(process.resourcesPath); } catch(e){}
      
      const errorMsg = `❌ ERROR: Script no encontrado.\n` +
                       `Buscado en:\n1. ${path1}\n2. ${path2}\n` +
                       `Contenido resources: [${resContent.join(', ')}]`;
      mainWindow.webContents.send('script-log', errorMsg);
      return;
    }
  } else {
    scriptPath = path.join(__dirname, 'scripts', scriptName);
  }
    
  console.log('Ejecutando script en:', scriptPath);
  
  const desktop = getDesktopPath();

  const envParams = { 
    ...process.env,
    ONVIO_USER: params.user,
    ONVIO_PASS: params.password,
    ONVIO_COMPANY: params.companyName,
    ONVIO_ALIAS: params.companyAlias,
    TARGET_MONTH: params.month,
    TARGET_YEAR: params.year,
    MONTO_ACTUALIZAR: params.updateValue,
    TARGET_DATE: params.updateDate,
    DESKTOP_PATH: getDesktopPath(),
    RESOURCES_PATH: process.resourcesPath,
    ELECTRON_RUN_AS_NODE: '1'
  };

  const child = spawn(process.execPath, [scriptPath], { 
    env: envParams,
    windowsHide: true
  });

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

// --- AUTO-UPDATER EVENTS ---

autoUpdater.on('checking-for-update', () => {
  console.log('Buscando actualizaciones...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Actualización disponible:', info.version);
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-not-available', (info) => {
  console.log('No hay actualizaciones disponibles.');
});

autoUpdater.on('error', (err) => {
  console.error('Error en el auto-updater:', err);
  mainWindow.webContents.send('update_error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Velocidad: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Descargado ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
  mainWindow.webContents.send('update_progress', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Actualización descargada.');
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('check_updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
