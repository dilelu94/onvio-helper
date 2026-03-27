const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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
  const browser = await chromium.launch({ headless: false }); 
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

    // 5. EMISIÓN Y CAPTURA BINARIA
    console.log('[LOG] Emitiendo reporte y capturando PDF...');
    await estudioPage.getByRole('button', { name: 'Emitir' }).click();

    let reportPage = null;
    const globalTimeout = Date.now() + 60000;
    while (Date.now() < globalTimeout && !reportPage) {
      for (const p of context.pages()) {
        try {
          if (p.url().startsWith('blob:')) {
            const isCorrect = await p.evaluate(async (u) => {
              try {
                const resp = await fetch(u);
                const blob = await resp.blob();
                const text = await blob.text();
                return text.includes('Planilla de Totales Generales') || text.includes('Totales Gral');
              } catch (e) { return false; }
            }, p.url());
            if (isCorrect) { reportPage = p; break; }
          }
        } catch (e) {}
      }
      if (!reportPage) await new Promise(r => setTimeout(r, 3000));
    }

    if (reportPage) {
        // --- NUEVA LÓGICA DE CARPETAS JERÁRQUICA EN ROOT ---
        const projectRoot = process.env.DESKTOP_PATH;
        // yearFolder removed
        const periodFolder = path.join(projectRoot, `${MONTH} ${YEAR} Totales Generales`);
        const targetDir = path.join(periodFolder, ALIAS.replace(/[^a-z0-9 ]/gi, ' ').trim());

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const savePath = path.join(targetDir, `Planilla_Totales_Generales.pdf`);
        
        const base64Data = await reportPage.evaluate(async () => {
            const resp = await fetch(window.location.href);
            const b = await resp.blob();
            return new Promise(res => {
                const rd = new FileReader();
                rd.onloadend = () => res(rd.result.split(',')[1]);
                rd.readAsDataURL(b);
            });
        });

        fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
        console.log(`[SUCCESS] PDF guardado en: ${savePath}`);
        process.exit(0);
    } else {
        throw new Error('No se encontró el PDF.');
    }

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
