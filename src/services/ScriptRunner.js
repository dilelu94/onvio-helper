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
      // Usamos shell: true para manejar comandos complejos en Windows
      const child = spawn(command, { shell: true });

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
