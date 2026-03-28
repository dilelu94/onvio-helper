import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';
import fs from 'fs';

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

import { execSync } from 'child_process';

async function run() {
  console.log(`[LOG] Iniciando proceso SCVO para: ${ONVIO_COMPANY}`);
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true, slowMo: 100 });
  } catch (error) {
    if (error.message.includes('Executable doesn\'t exist') || error.message.includes('browserType.launch')) {
      console.log(`[LOG] Navegador no encontrado. Intentando instalar Chromium...`);
      try {
        // Encontrar el CLI de playwright relativo al path del módulo
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
    await login(page, ONVIO_USER, ONVIO_PASS);

    console.log(`[LOG] Seleccionando empresa: ${ONVIO_COMPANY}`);
    
    await page.getByRole('link', { name: 'Menú' }).click();
    const page1Promise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Sueldos y Jornales ' }).click();
    const page1 = await page1Promise;
    
    const searchInput = page1.getByRole('textbox', { name: 'Buscar por Código, Razón' });
    await page1.waitForLoadState('networkidle');
    await searchInput.waitFor({ state: 'visible', timeout: 60000 });
    await searchInput.fill(ONVIO_COMPANY);
    await page1.waitForTimeout(1000);
    await page1.getByText(ONVIO_COMPANY, { exact: false }).first().click();
    await page1.getByRole('button', { name: 'Aceptar' }).click();

    const matrixPage = new MatrixPage(page1);
    await matrixPage.navigateToMatrices();
    
    try {
      await matrixPage.filterMatrixByCode('SCVO');
      await matrixPage.editMatrix('SCVO');
    } catch (e) {
      console.error(`[ERROR] No se encontró la matriz SCVO`);
      process.exit(1);
    }
    
    await matrixPage.clickAddValue();
    await matrixPage.fillMatrixValue(TARGET_DATE, MONTO_ACTUALIZAR);
    await matrixPage.confirmModal();

    const existed = await matrixPage.handleDuplicateError();
    if (existed) {
      console.log(`[LOG] AVISO: El valor para ${TARGET_DATE} ya existía.`);
    }

    await matrixPage.confirmMainConfiguration();
    console.log(`[LOG] [SUCCESS] ${ONVIO_COMPANY} finalizada.`);

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
