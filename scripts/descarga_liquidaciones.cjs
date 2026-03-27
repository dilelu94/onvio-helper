const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const USER = process.env.ONVIO_USER;
const PASS = process.env.ONVIO_PASS;
const COMPANY = process.env.ONVIO_COMPANY;
const ALIAS = process.env.ONVIO_ALIAS;
const MONTH = process.env.TARGET_MONTH;
const YEAR = process.env.TARGET_YEAR;

if (!USER || !PASS || !COMPANY || !ALIAS || !MONTH || !YEAR) {
  console.error('ERROR: Faltan parámetros requeridos.');
  console.error(`Valores recibidos: USER=${USER ? 'OK' : 'MISSING'}, PASS=${PASS ? 'OK' : 'MISSING'}, COMPANY=${COMPANY || 'MISSING'}, ALIAS=${ALIAS || 'MISSING'}, MONTH=${MONTH || 'MISSING'}, YEAR=${YEAR || 'MISSING'}`);
  process.exit(1);
}

async function run() {
  console.log(`[INICIO] Liquidaciones: ${COMPANY} (${MONTH}/${YEAR})`);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. LOGIN
    console.log('[LOG] Accediendo a Onvio...');
    await page.goto('https://onvio.com.ar/staff/#/login');
    
    // Esperar a que el botón de iniciar sesión aparezca o directamente al input de correo
    try {
        await page.getByRole('button', { name: 'Iniciar sesión' }).click({ timeout: 10000 });
    } catch (e) {
        // Ignorar si no aparece el botón intermedio
    }

    await page.getByRole('textbox', { name: /correo/i }).waitFor({ state: 'visible', timeout: 30000 });
    await page.getByRole('textbox', { name: /correo/i }).fill(USER);
    await page.getByRole('button', { name: /iniciar/i }).click();
    
    await page.getByRole('textbox', { name: /contraseña/i }).waitFor({ state: 'visible', timeout: 30000 });
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
    
    // Selección precisa
    await estudioPage.keyboard.press('ArrowDown');
    await estudioPage.keyboard.press('Enter');
    await estudioPage.waitForTimeout(1000);
    await estudioPage.getByRole('button', { name: 'Aceptar' }).click({ force: true });
    
    // Esperar a que el modal desaparezca
    await estudioPage.waitForSelector('.ui-dialog, .modal-backdrop', { state: 'hidden', timeout: 30000 });
    console.log('[LOG] Empresa seleccionada.');

    // 4. NAVEGACIÓN A REPORTE
    console.log('[LOG] Navegando a Reportes -> Informe de Liquidación...');
    await estudioPage.getByRole('heading', { name: ' Reportes' }).click();
    await estudioPage.getByRole('link', { name: 'Informe de Liquidación' }).first().click();

    // Verificación de redirección accidental
    if (estudioPage.url().includes('AGralEmpresas')) {
        console.log('[RECOVERY] Redirigido a lista. Re-seleccionando empresa...');
        // Repetir selección si es necesario (según lógica de estudio_one.js)
        await searchBox.waitFor({ state: 'visible', timeout: 20000 });
        await searchBox.click();
        await searchBox.fill(COMPANY);
        await estudioPage.waitForTimeout(3000);
        await estudioPage.keyboard.press('ArrowDown');
        await estudioPage.keyboard.press('Enter');
        await estudioPage.getByRole('button', { name: 'Aceptar' }).click({ force: true });
        await estudioPage.waitForSelector('.ui-dialog, .modal-backdrop', { state: 'hidden', timeout: 30000 });
        await estudioPage.getByRole('heading', { name: ' Reportes' }).click();
        await estudioPage.getByRole('link', { name: 'Informe de Liquidación' }).first().click();
    }

    // 5. CONFIGURACIÓN DE PARÁMETROS
    console.log(`[LOG] Configurando periodo: ${MONTH}/${YEAR}`);
    await estudioPage.getByTitle('Seleccionar').click({ timeout: 20000 });
    await estudioPage.waitForTimeout(5000);
    
    const targetDate = `${MONTH}/${YEAR}`;
    const rows = estudioPage.getByRole('row');
    const count = await rows.count();
    let tickedCount = 0;
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.innerText();
      if (text.includes(targetDate)) {
        const checkbox = row.getByRole('checkbox');
        if (await checkbox.count() > 0) {
          await checkbox.evaluate(node => { if (!node.checked) node.click(); });
          tickedCount++;
        }
      }
    }
    console.log(`[LOG] Marcadas ${tickedCount} liquidaciones.`);
    await estudioPage.getByRole('button', { name: 'Aceptar' }).click();
    await estudioPage.waitForTimeout(3000);

    // 6. EMITIR Y GESTIÓN DE iFrame
    console.log('[LOG] Emitiendo reporte...');
    await estudioPage.getByRole('button', { name: 'Emitir' }).click();
    await estudioPage.waitForTimeout(10000);

    console.log('[LOG] Accediendo a Cubo en iFramePpal...');
    const frame = estudioPage.locator('.iFramePpal').contentFrame();
    await frame.getByRole('tab', { name: 'Cubo' }).click({ timeout: 45000 });
    await estudioPage.waitForTimeout(5000);

    console.log('[LOG] Desactivando subtotales...');
    try {
      await frame.locator('.bento-toggle-nob').click({ timeout: 10000 });
    } catch(e) {
      console.log('[LOG] No se encontró switch de subtotales, intentando cerrar sección...');
      await frame.getByRole('img', { name: 'Cerrar sección' }).click().catch(() => {});
    }

    await estudioPage.waitForTimeout(3000);
    
    // 7. EXPORTACIÓN Y GUARDADO
    console.log('[LOG] Ejecutando exportación...');
    const dlPromise = estudioPage.waitForEvent('download', { timeout: 120000 });
    await frame.getByRole('menuitem', { name: 'Exportar' }).click();

    const download = await dlPromise;
    
    // --- NUEVA LÓGICA DE CARPETAS JERÁRQUICA EN ROOT ---
    const projectRoot = process.env.DESKTOP_PATH;
    // yearFolder removed
    const periodFolder = path.join(projectRoot, `${MONTH} ${YEAR} Liquidaciones`);
    const targetDir = path.join(periodFolder, ALIAS.replace(/[^a-z0-9 ]/gi, ' ').trim());
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const savePath = path.join(targetDir, `Liquidaciones_Detalladas.xlsx`);
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
