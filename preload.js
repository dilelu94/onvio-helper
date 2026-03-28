const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  runScript: (scriptName, params) => ipcRenderer.send('run-script', { scriptName, params }),
  
  // Base de Datos Excel
  dbCheckRecord: (alias, period, type) => ipcRenderer.invoke('db-check-record', { alias, period, type }),
  dbAddRecord: (data) => ipcRenderer.send('db-add-record', data),
  checkFileExists: (params) => ipcRenderer.invoke('check-file-exists', params),

  onScriptLog: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('script-log', listener);
    return () => ipcRenderer.removeListener('script-log', listener);
  },
  onScriptFinished: (callback) => {
    const listener = (event, code) => callback(code);
    ipcRenderer.on('script-finished', listener);
    return () => ipcRenderer.removeListener('script-finished', listener);
  }
});
