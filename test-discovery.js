const { chromium } = require('playwright');

async function testDiscovery() {
  console.log('--- Iniciando Prueba de Descubrimiento de Pestañas ---');
  const browser = await chromium.launch({ headless: true }); // Ejecución en segundo plano
  const context = await browser.newContext();
  const page = await context.newPage();

  const newPages = [];
  context.on('page', p => newPages.push(p));

  // Simulamos Onvio abriendo pestañas
  await page.goto('about:blank');
  console.log('[1] Abriendo pestañas simuladas...');
  await page.evaluate(() => {
    const b1 = new Blob(['%PDF-1.4 ... Contenido Erroneo ...'], { type: 'application/pdf' });
    const b2 = new Blob(['%PDF-1.4 ... Planilla de Totales Generales ...'], { type: 'application/pdf' });
    window.open(URL.createObjectURL(b1), '_blank');
    window.open(URL.createObjectURL(b2), '_blank');
  });

  console.log('[2] Buscando la correcta por contenido...');
  let found = null;
  const timeout = Date.now() + 15000;

  while (Date.now() < timeout && !found) {
    for (const p of newPages) {
      try {
        const url = p.url();
        if (!url.startsWith('blob:')) continue;

        const isCorrect = await p.evaluate(async (u) => {
          const resp = await fetch(u);
          const text = await (await resp.blob()).text();
          return text.includes('Planilla de Totales Generales');
        }, url);

        if (isCorrect) {
          found = p;
          break;
        }
      } catch (e) {}
    }
    if (!found) await new Promise(r => setTimeout(r, 1000));
  }

  if (found) {
    console.log('✅ ÉXITO: Se encontró la pestaña correcta por contenido binario.');
    console.log('URL encontrada:', found.url());
  } else {
    console.log('❌ FALLO: No se pudo identificar la pestaña.');
  }

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

testDiscovery();
