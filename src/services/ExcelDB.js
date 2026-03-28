import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

class ExcelDB {
  constructor() {
    this.headers = ['Fecha Descarga', 'Alias', 'Nombre Real', 'Periodo (MM/YYYY)', 'Tipo', 'Ruta Archivo'];
  }

  /**
   * Inicializa el archivo Excel si no existe.
   */
  init(filePath) {
    if (!fs.existsSync(filePath)) {
      console.log(`[DB] Creando nueva base de datos en: ${filePath}`);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([this.headers]);
      XLSX.utils.book_append_sheet(wb, ws, 'Descargas');
      XLSX.writeFile(wb, filePath);
    }
  }

  /**
   * Añade un registro al Excel.
   */
  addRecord(filePath, data) {
    this.init(filePath);
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets['Descargas'];
    
    const newRow = [
      new Date().toLocaleString(),
      data.alias,
      data.companyName || '',
      data.period,
      data.type,
      data.path
    ];

    XLSX.utils.sheet_add_aoa(ws, [newRow], { origin: -1 });
    XLSX.writeFile(wb, filePath);
    console.log(`[DB] Registro guardado: ${data.alias} - ${data.type}`);
  }

  /**
   * Busca un registro por alias, periodo y tipo.
   */
  findRecord(filePath, alias, period, type) {
    if (!fs.existsSync(filePath)) return null;
    
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets['Descargas'];
    const rows = XLSX.utils.sheet_to_json(ws);

    const match = rows.find(r => 
      r.Alias === alias && 
      r['Periodo (MM/YYYY)'] === period && 
      r.Tipo === type
    );

    if (match) {
      console.log(`[DB] Registro encontrado para ${alias} (${period})`);
    }
    return match || null;
  }
}

export default new ExcelDB();
