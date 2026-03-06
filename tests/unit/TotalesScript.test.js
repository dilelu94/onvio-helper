import { describe, it, expect } from 'vitest';
import ScriptRunner from '../../src/services/ScriptRunner';
import path from 'path';

describe('Totales Generales Script', () => {
  it('should receive parameters from environment variables', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/totales_generales.js');
    const logs = [];
    const onData = (data) => logs.push(data);

    // Simulamos parámetros pasados por el motor de ejecución
    process.env.ONVIO_USER = 'test-user@onvio.com';
    process.env.ONVIO_PASS = 'test-pass';
    process.env.ONVIO_COMPANY = 'Mi Empresa SA';
    
    // El script de prueba solo imprimirá los parámetros para verificar que los recibió
    // (Por ahora será un script dummy para la fase GREEN del TDD)
    await ScriptRunner.run(`node ${scriptPath}`, onData);
    
    expect(logs.join('')).toContain('USER: test-user@onvio.com');
    expect(logs.join('')).toContain('PASS: test-pass');
  });
});
