import { describe, it, expect } from 'vitest';
import ScriptRunner from '../../src/services/ScriptRunner';
import path from 'path';
require('dotenv').config();

describe('Integration Test: Liquidaciones Detalladas', () => {
  it('should run descarga_liquidaciones for period 02/2026', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/descarga_liquidaciones.js');
    const logs = [];
    const onData = (data) => {
        console.log(`[STDOUT] ${data}`);
        logs.push(data);
    };

    if (!process.env.ONVIO_USER || !process.env.ONVIO_PASS) {
        console.warn('⚠️ Saltando test real: Faltan credenciales');
        return;
    }

    console.log('--- Iniciando Ejecución de Script de Liquidaciones ---');
    await ScriptRunner.run(`node ${scriptPath}`, onData);
    
    const output = logs.join('');
    expect(output).toContain('[SUCCESS] Excel guardado');
  }, 240000); // 4 minutos para este reporte pesado
});
