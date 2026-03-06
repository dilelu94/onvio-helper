const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  runScript: (scriptName, params) => ipcRenderer.send('run-script', { scriptName, params }),
  
  // Listeners con retorno de función de limpieza para evitar duplicados
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
