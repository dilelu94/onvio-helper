import { describe, it, expect, vi } from 'vitest';
const { spawn } = require('child_process');
import ScriptRunner from '../../src/services/ScriptRunner';

describe('ScriptRunner', () => {
  it('should execute a simple command and capture output', async () => {
    const output = [];
    const onData = (data) => output.push(data);
    
    // Ejecutamos un comando simple de echo para probar el motor
    await ScriptRunner.run('echo "Hello from script"', onData);
    
    expect(output.join('')).toContain('Hello from script');
  });
});
