const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const USER = process.env.ONVIO_USER;
const PASS = process.env.ONVIO_PASS;
const COMPANY = process.env.ONVIO_COMPANY;
const MONTH = process.env.TARGET_MONTH;
const YEAR = process.env.TARGET_YEAR;

async function run() {
  console.log(`[INICIO] Totales Generales: ${COMPANY} (${MONTH}/${YEAR})`);
  const browser = await chromium.launch({ headless: false }); 
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. LOGIN
    await page.goto('https://onvio.com.ar/staff/#/login');
    await page.getByRole('button', { name: 'Iniciar sesión' }).first().click().catch(() => {});
    await page.getByRole('textbox', { name: /correo/i }).fill(USER);
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.getByRole('textbox', { name: /contraseña/i }).fill(PASS);
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/.*staff.*/, { timeout: 60000 });

    // 2. ABRIR SUELDOS
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Menú' }).click();
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: /Sueldos y Jornales/i }).click();
    const estudioPage = await popupPromise;
    await estudioPage.waitForLoadState('load');

    // 3. SELECCIÓN DE EMPRESA
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
    await estudioPage.getByRole('heading', { name: ' Reportes' }).click();
    await estudioPage.getByRole('link', { name: 'Planilla de Totales por Sector' }).first().click();
    await estudioPage.getByRole('textbox', { name: 'Período:' }).fill(`${MONTH} ${YEAR}`);
    await estudioPage.getByTitle('Seleccionar').click();
    await estudioPage.waitForTimeout(5000);
    
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

    // 5. CAPTURA POR ADN DEL ARCHIVO (TAMAÑO Y CONTENIDO)
    console.log('[LOG] Emitiendo reporte. Discriminando pestañas...');
    await estudioPage.getByRole('button', { name: 'Emitir' }).click();

    let reportPage = null;
    const globalTimeout = Date.now() + 60000;
    
    while (Date.now() < globalTimeout && !reportPage) {
      const allPages = context.pages();
      for (const p of allPages) {
        try {
          const url = p.url();
          if (!url.startsWith('blob:')) continue;

          const title = (await p.title()).toLowerCase();
          
          // ANALISIS PROFUNDO
          const info = await p.evaluate(async (u) => {
            try {
              const resp = await fetch(u);
              const blob = await resp.blob();
              const text = await blob.text();
              return {
                size: blob.size,
                hasCorrectText: text.includes('Planilla de Totales Generales') || text.includes('Totales Gral')
              };
            } catch (e) { return null; }
          }, url);

          if (info) {
            console.log(`[DEBUG] Analizando Blob -> Tamaño: ${info.size}, Título: "${title}", Contenido Correcto: ${info.hasCorrectText}`);
            
            // PRIORIDAD 1: Tiene el texto exacto
            if (info.hasCorrectText && !title.includes('por sector')) {
              reportPage = p;
              break;
            }
            
            // PRIORIDAD 2: El título coincide con lo que buscamos (Gral)
            if (title.includes('totales') && title.includes('gral') && title.includes('seccion')) {
              reportPage = p;
              break;
            }
          }
        } catch (e) {}
      }
      if (!reportPage) await estudioPage.waitForTimeout(3000);
    }

    if (!reportPage) {
      throw new Error('No se pudo identificar la pestaña del reporte correcto.');
    }

    // 6. GUARDADO
    console.log('[LOG] Pestaña identificada con éxito. Guardando...');
    const pdfUrl = reportPage.url();
    const desktopPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Desktop');
    const savePath = path.join(desktopPath, `Planilla_${COMPANY.replace(/[^a-z0-9]/gi, '_')}_${MONTH}_${YEAR}.pdf`);

    const base64Data = await reportPage.evaluate(async (u) => {
      const resp = await fetch(u);
      const b = await resp.blob();
      return new Promise(r => {
        const reader = new FileReader();
        reader.onloadend = () => r(reader.result.split(',')[1]);
        reader.readAsDataURL(b);
      });
    }, pdfUrl);

    fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
    console.log(`[SUCCESS] PDF guardado: ${savePath}`);
    process.exit(0);

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  } finally {
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
  }
}

run();
