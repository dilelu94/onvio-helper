import { chromium } from 'playwright';
import { describe, it, expect } from 'vitest';

describe('Validación de Lógica de Descubrimiento', () => {
  it('debería detectar la pestaña blob correcta por su contenido binario', async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Creamos una página con un botón para abrir popups (esto evita el bloqueo de Chromium)
    await page.setContent(`
      <button id="emitir">Emitir</button>
      <script>
        document.getElementById('emitir').onclick = () => {
          const b1 = new Blob(['%PDF-1.4 ... Otro Reporte Innecesario ...'], { type: 'application/pdf' });
          const b2 = new Blob(['%PDF-1.4 ... Planilla de Totales Generales ...'], { type: 'application/pdf' });
          window.open(URL.createObjectURL(b1), '_blank');
          window.open(URL.createObjectURL(b2), '_blank');
        };
      </script>
    `);

    // Simulamos el clic en "Emitir"
    await page.click('#emitir');

    // --- LÓGICA DE BÚSQUEDA EXACTA QUE VAMOS A USAR ---
    let reportPage = null;
    const timeout = Date.now() + 15000;
    while (Date.now() < timeout && !reportPage) {
      const allPages = context.pages();
      for (const p of allPages) {
        try {
          const url = p.url();
          if (!url.startsWith('blob:')) continue;

          const isCorrect = await p.evaluate(async (u) => {
            try {
              const resp = await fetch(u);
              const blob = await resp.blob();
              const text = await blob.text();
              // Esta es la combinación de criterios que te funcionó
              return text.includes('Planilla de Totales Generales') || 
                     text.includes('Totales Gral') || 
                     document.title.includes('Totales Gral');
            } catch (e) { return false; }
          }, url);

          if (isCorrect) {
            reportPage = p;
            break;
          }
        } catch (e) {}
      }
      if (!reportPage) await new Promise(r => setTimeout(r, 1000));
    }

    expect(reportPage).not.toBeNull();
    console.log('✅ Test de descubrimiento pasado: Pestaña identificada.');
    await browser.close();
  }, 30000);
});
