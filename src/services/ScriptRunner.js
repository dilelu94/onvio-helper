const { spawn } = require('child_process');

class ScriptRunner {
  /**
   * Ejecuta un comando y reporta la salida en tiempo real a través de un callback.
   * @param {string} command - El comando completo a ejecutar.
   * @param {function} onData - Callback que recibe cada línea de salida (stdout/stderr).
   * @returns {Promise} - Se resuelve cuando el proceso termina.
   */
  async run(command, onData) {
    return new Promise((resolve, reject) => {
      // Fix ENOENT: Use current process.execPath (Electron) instead of global 'node'
      // If the command starts with 'node ', we replace it.
      let finalCommand = command;
      let args = [];
      
      if (command.startsWith('node ')) {
        finalCommand = process.execPath;
        args = command.split(' ').slice(1);
      }

      const child = spawn(finalCommand, args, { 
        shell: true,
        windowsHide: true,
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
      });

      child.stdout.on('data', (data) => {
        if (onData) onData(data.toString());
      });

      child.stderr.on('data', (data) => {
        if (onData) onData(`ERROR: ${data.toString()}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`El script terminó con código ${code}`));
        }
      });
    });
  }
}

// Exportamos una instancia única (Singleton)
module.exports = new ScriptRunner();
