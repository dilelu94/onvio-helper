import { chromium } from 'playwright';
import { login } from '../src/automation/utils/auth.js';
import { MatrixPage } from '../src/automation/pages/MatrixPage.js';

const { 
  ONVIO_USER, 
  ONVIO_PASS, 
  ONVIO_COMPANY, 
  MONTO_ACTUALIZAR, 
  TARGET_DATE 
} = process.env;

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page, ONVIO_USER, ONVIO_PASS);

    console.log(`[LOG] PROCESANDO: ${ONVIO_COMPANY}`);
    
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
