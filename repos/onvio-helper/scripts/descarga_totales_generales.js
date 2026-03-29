import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Buscar playwright en asar.unpacked si estamos en producción (usando RESOURCES_PATH pasado desde Electron)
const resourcesPath = process.env.RESOURCES_PATH || process.resourcesPath;
let playwrightPath = 'playwright';

console.log(`[DEBUG] Resources Path: ${resourcesPath}`);

if (resourcesPath) {
  const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked', 'node_modules', 'playwright');
  console.log(`[DEBUG] Checking unpacked path: ${unpackedPath}`);
  if (fs.existsSync(unpackedPath)) {
    console.log(`[DEBUG] Unpacked path EXISTS. Using it.`);
    playwrightPath = unpackedPath;
  } else {
    console.log(`[DEBUG] Unpacked path DOES NOT exist.`);
  }
}

console.log(`[DEBUG] Requiring playwright from: ${playwrightPath}`);
const { chromium } = require(playwrightPath);

const USER = process.env.ONVIO_USER;
const PASS = process.env.ONVIO_PASS;
const COMPANY = process.env.ONVIO_COMPANY;
const ALIAS = process.env.ONVIO_ALIAS || process.env.ONVIO_COMPANY;
const MONTH = process.env.TARGET_MONTH;
const YEAR = process.env.TARGET_YEAR;

if (!USER || !PASS || !COMPANY || !MONTH || !YEAR) {
  console.error('ERROR: Faltan parámetros requeridos.');
  process.exit(1);
}

async function run() {
  console.log(`[LOG] Iniciando descarga de Totales Generales para: ${ALIAS} (${MONTH}/${YEAR})`);
  
  let browser;
  try {
    const isHeadless = process.env.HEADLESS !== 'false';
    browser = await chromium.launch({ headless: isHeadless, slowMo: 100 });
  } catch (error) {
    if (error.message.includes('Executable doesn\'t exist') || error.message.includes('browserType.launch')) {
      console.log(`[LOG] Navegador no encontrado. Intentando instalar Chromium...`);
      try {
        const playwrightRoot = path.dirname(require.resolve(path.join(playwrightPath, 'package.json')));
        const cliPath = path.join(playwrightRoot, 'cli.js');
        console.log(`[DEBUG] Ejecutando: node ${cliPath} install chromium`);
        execSync(`"${process.execPath}" "${cliPath}" install chromium`, { stdio: 'inherit' });
        console.log(`[LOG] Instalación finalizada. Reintentando inicio...`);
        browser = await chromium.launch({ headless: true, slowMo: 100 });
      } catch (installError) {
        console.error(`[ERROR] No se pudo instalar el navegador: ${installError.message}`);
        process.exit(1);
      }
    } else {
      throw error;
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. LOGIN
    console.log('[LOG] Iniciando sesión en Onvio...');
    await page.goto('https://onvio.com.ar/staff/#/login');
    await page.getByRole('button', { name: 'Iniciar sesión' }).first().click().catch(() => {});
    await page.getByRole('textbox', { name: /correo/i }).fill(USER);
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.getByRole('textbox', { name: /contraseña/i }).fill(PASS);
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/.*staff.*/, { timeout: 60000 });
    console.log('[LOG] Login exitoso.');

    // 2. ABRIR SUELDOS
    console.log('[LOG] Abriendo módulo de Sueldos y Jornales...');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Menú' }).click();
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: /Sueldos y Jornales/i }).click();
    const estudioPage = await popupPromise;
    await estudioPage.waitForLoadState('load');

    // 3. SELECCIÓN DE EMPRESA
    console.log(`[LOG] Seleccionando empresa: ${COMPANY}`);
    await estudioPage.waitForTimeout(8000); 
    const searchBox = estudioPage.getByRole('textbox', { name: 'Buscar por Código, Razón' });
    await searchBox.waitFor({ state: 'visible' });
    await searchBox.fill(COMPANY);
    await estudioPage.waitForTimeout(3000); 
    await estudioPage.keyboard.press('ArrowDown');
    await estudioPage.keyboard.press('Enter');
    await estudioPage.waitForTimeout(1000);
    await estudioPage.getByRole('button', { name: 'Aceptar' }).click({ force: true });
    await estudioPage.waitForSelector('.ui-dialog, .modal-backdrop', { state: 'hidden', timeout: 30000 });

    // 4. NAVEGACIÓN A REPORTE
    console.log('[LOG] Navegando a Planilla de Totales por Sector...');
    await estudioPage.getByRole('heading', { name: ' Reportes' }).click();
    await estudioPage.getByRole('link', { name: 'Planilla de Totales por Sector' }).first().click();
    await estudioPage.getByRole('textbox', { name: 'Período:' }).fill(`${MONTH} ${YEAR}`);
    await estudioPage.getByTitle('Seleccionar').click();
    await estudioPage.waitForTimeout(5000);
    
    console.log(`[LOG] Buscando periodos para ${MONTH}/${YEAR}...`);
    const targetDate = `${MONTH}/${YEAR}`;
    const rows = estudioPage.getByRole('row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      if ((await rows.nth(i).innerText()).includes(targetDate)) {
        const checkbox = rows.nth(i).getByRole('checkbox');
        if (await checkbox.count() > 0) await checkbox.evaluate(node => { if (!node.checked) node.click(); });
      }
    }
    await estudioPage.getByRole('button', { name: 'Aceptar' }).click();
    await estudioPage.waitForTimeout(2000);

    // 5. EMISIÓN Y DESCARGA NATIVA
    console.log('[LOG] Emitiendo reporte y esperando descarga...');
    
    // Preparar la captura de la descarga antes de hacer clic
    const downloadPromise = estudioPage.waitForEvent('download', { timeout: 60000 });
    
    await estudioPage.getByRole('button', { name: 'Emitir' }).click();

    try {
      const download = await downloadPromise;
      
      const projectRoot = process.env.DESKTOP_PATH;
      const periodFolder = path.join(projectRoot, "Liquidaciones", `${MONTH} ${YEAR}`);
      const targetDir = path.join(periodFolder, ALIAS.replace(/[^a-z0-9 ]/gi, ' ').trim());

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const savePath = path.join(targetDir, `Planilla_Totales_Generales.pdf`);
      await download.saveAs(savePath);
      
      console.log(`[SUCCESS] PDF guardado en: ${savePath}`);
      process.exit(0);
    } catch (e) {
      throw new Error('No se detectó la descarga automática del PDF. ' + e.message);
    }

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
