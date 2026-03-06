import { describe, it, expect } from 'vitest';
import ScriptRunner from '../../src/services/ScriptRunner';
import path from 'path';

describe('Liquidaciones Script', () => {
  it('should receive parameters from environment variables', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/liquidaciones.js');
    const logs = [];
    const onData = (data) => logs.push(data);

    // Simulamos parámetros pasados por el motor de ejecución
    process.env.ONVIO_USER = 'test-user@onvio.com';
    process.env.ONVIO_PASS = 'test-pass';
    process.env.ONVIO_COMPANY = 'Mi Empresa SA';
    
    // El script debe imprimir los parámetros recibidos
    await ScriptRunner.run(`node ${scriptPath}`, onData);
    
    expect(logs.join('')).toContain('[INICIO] Liquidaciones: Mi Empresa SA');
    expect(logs.join('')).toContain('Sesión iniciada correctamente');
  });
});
