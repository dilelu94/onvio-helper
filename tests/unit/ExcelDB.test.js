import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ExcelDB from '../../src/services/ExcelDB';
import fs from 'fs';
import path from 'path';

describe('ExcelDB Service', () => {
  const testDbPath = path.join(__dirname, 'test-database.xlsx');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it('should create a new excel file with headers if it does not exist', () => {
    ExcelDB.init(testDbPath);
    expect(fs.existsSync(testDbPath)).toBe(true);
  });

  it('should add and find a record correctly', () => {
    ExcelDB.init(testDbPath);
    const record = {
      alias: 'CLUB_TEST',
      period: '02/2026',
      type: 'Totales',
      path: 'C:/Desktop/test.pdf'
    };
    
    ExcelDB.addRecord(testDbPath, record);
    
    const found = ExcelDB.findRecord(testDbPath, 'CLUB_TEST', '02/2026', 'Totales');
    expect(found).not.toBeNull();
    expect(found.Alias).toBe('CLUB_TEST');
  });
});
