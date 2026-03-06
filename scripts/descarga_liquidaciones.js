const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const USER = process.env.ONVIO_USER;
const PASS = process.env.ONVIO_PASS;
const COMPANY = process.env.ONVIO_COMPANY;
const MONTH = process.env.TARGET_MONTH;
const YEAR = process.env.TARGET_YEAR;

if (!USER || !PASS || !COMPANY || !MONTH || !YEAR) {
  console.error('ERROR: Faltan parámetros requeridos.');
  console.error(`Valores recibidos: USER=${USER ? 'OK' : 'MISSING'}, PASS=${PASS ? 'OK' : 'MISSING'}, COMPANY=${COMPANY || 'MISSING'}, MONTH=${MONTH || 'MISSING'}, YEAR=${YEAR || 'MISSING'}`);
  process.exit(1);
}

async function run() {
  console.log(`[INICIO] Liquidaciones: ${COMPANY} (${MONTH}/${YEAR})`);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. LOGIN (Igual que Totales)
    console.log('[LOG] Accediendo a Onvio...');
    await page.goto('https://onvio.com.ar/staff/#/login');
    await page.getByRole('button', { name: 'Iniciar sesión' }).first().click().catch(() => {});
    await page.getByRole('textbox', { name: /correo/i }).fill(USER);
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.getByRole('textbox', { name: /contraseña/i }).fill(PASS);
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/.*staff.*/, { timeout: 60000 });
    console.log('[LOG] Sesión iniciada.');

    // 2. ABRIR SUELDOS (NUEVA VENTANA)
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Menú' }).click({ timeout: 15000 });
    const pagePromise = page.waitForEvent('popup', { timeout: 30000 });
    await page.getByRole('link', { name: /Sueldos y Jornales/i }).click({ timeout: 15000 });
    const estudioPage = await pagePromise;
    await estudioPage.waitForLoadState('load');
    console.log('[LOG] Ventana de Sueldos abierta.');

    // 3. SELECCIÓN DE EMPRESA
    console.log(`[LOG] Seleccionando: ${COMPANY}`);
    await estudioPage.waitForTimeout(8000); 
    const searchBox = estudioPage.getByRole('textbox', { name: 'Buscar por Código, Razón' });
    await searchBox.waitFor({ state: 'visible', timeout: 60000 });
    await searchBox.click();
    await searchBox.fill(COMPANY);
    await estudioPage.waitForTimeout(3000); 
    await estudioPage.keyboard.press('ArrowDown');
    await estudioPage.keyboard.press('Enter');
    await estudioPage.waitForTimeout(1000);
    await estudioPage.getByRole('button', { name: 'Aceptar' }).click({ force: true });
    await estudioPage.waitForSelector('.ui-dialog, .modal-backdrop', { state: 'hidden', timeout: 30000 });
    console.log('[LOG] Empresa seleccionada.');

    // 4. DESCARGA LIQUIDACIONES (EXCEL)
    console.log('[LOG] Navegando a Reportes -> Informe de Liquidación...');
    await estudioPage.getByRole('heading', { name: ' Reportes' }).click();
    await estudioPage.getByRole('link', { name: 'Informe de Liquidación' }).first().click();

    // Configurar Periodo
    console.log(`[LOG] Configurando periodo: ${MONTH}/${YEAR}`);
    await estudioPage.getByTitle('Seleccionar').click({ timeout: 20000 });
    await estudioPage.waitForTimeout(5000);
    
    const targetDate = `${MONTH}/${YEAR}`;
    const rows = estudioPage.getByRole('row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.innerText();
      if (text.includes(targetDate)) {
        const checkbox = row.getByRole('checkbox');
        if (await checkbox.count() > 0) {
          await checkbox.evaluate(node => { if (!node.checked) node.click(); });
        }
      }
    }
    await estudioPage.getByRole('button', { name: 'Aceptar' }).click();
    await estudioPage.waitForTimeout(3000);

    // EMITIR Y EXPORTAR CUBO
    console.log('[LOG] Emitiendo y abriendo Cubo...');
    await estudioPage.getByRole('button', { name: 'Emitir' }).click();
    await estudioPage.waitForTimeout(10000);

    const frame = estudioPage.locator('.iFramePpal').contentFrame();
    await frame.getByRole('tab', { name: 'Cubo' }).click({ timeout: 30000 });
    await estudioPage.waitForTimeout(5000);

    // Desactivar subtotales (igual que en tu repo)
    try {
      await frame.locator('.bento-toggle-nob').click({ timeout: 5000 });
    } catch(e) {
      await frame.getByRole('img', { name: 'Cerrar sección' }).click().catch(() => {});
    }

    await estudioPage.waitForTimeout(3000);
    console.log('[LOG] Exportando a Excel...');
    const dlPromise = estudioPage.waitForEvent('download', { timeout: 90000 });
    await frame.getByRole('menuitem', { name: 'Exportar' }).click();

    const download = await dlPromise;
    const desktopPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Desktop');
    const savePath = path.join(desktopPath, `Liquidaciones_${COMPANY.replace(/[^a-z0-9]/gi, '_')}_${MONTH}_${YEAR}.xlsx`);
    await download.saveAs(savePath);
    
    console.log(`[SUCCESS] Excel guardado en: ${savePath}`);
    process.exit(0);

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
