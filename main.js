const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
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
}

// --- IPC HANDLERS ---

const getConfigPath = () => path.join(app.getPath('userData'), 'config.json');

ipcMain.handle('load-config', () => {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Descifrar contraseña si existe y el cifrado está disponible
    if (config.password && safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(config.password, 'base64');
        const decrypted = safeStorage.decryptString(buffer);
        config.password = decrypted;
      } catch (e) {
        console.error('Error al descifrar contraseña:', e);
        // No borramos la contraseña por si es un error temporal del sistema
      }
    }
    return config;
  }
  return { user: '', password: '', companies: [] };
});

ipcMain.on('save-config', (event, config) => {
  const configToSave = { ...config };
  
  // Cifrar contraseña antes de guardar si el cifrado está disponible
  if (configToSave.password && safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = safeStorage.encryptString(configToSave.password);
      configToSave.password = encrypted.toString('base64');
    } catch (e) {
      console.error('Error al cifrar contraseña:', e);
    }
  }
  
  fs.writeFileSync(getConfigPath(), JSON.stringify(configToSave, null, 2));
});

ipcMain.on('run-script', (event, { scriptName, params }) => {
  const scriptPath = path.join(__dirname, 'scripts', scriptName);
  
  const env = { 
    ...process.env, 
    ONVIO_USER: params.user,
    ONVIO_PASS: params.password,
    ONVIO_COMPANY: params.companyName,
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
