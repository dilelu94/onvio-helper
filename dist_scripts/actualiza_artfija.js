// scripts/actualiza_artfija.js
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
var require2 = createRequire(import.meta.url);
var resourcesPath = process.env.RESOURCES_PATH || process.resourcesPath;
var playwrightPath = "playwright";
console.log(`[DEBUG] Resources Path: ${resourcesPath}`);
if (resourcesPath) {
  const unpackedPath = path.join(resourcesPath, "app.asar.unpacked", "node_modules", "playwright");
  console.log(`[DEBUG] Checking unpacked path: ${unpackedPath}`);
  if (fs.existsSync(unpackedPath)) {
    console.log(`[DEBUG] Unpacked path EXISTS. Using it.`);
    playwrightPath = unpackedPath;
  } else {
    console.log(`[DEBUG] Unpacked path DOES NOT exist.`);
  }
}
console.log(`[DEBUG] Requiring playwright from: ${playwrightPath}`);
var { chromium } = require2(playwrightPath);
async function run() {
  const {
    ONVIO_USER,
    ONVIO_PASS,
    ONVIO_COMPANY,
    MONTO_ACTUALIZAR,
    TARGET_DATE
  } = process.env;
  console.log(`[LOG] Iniciando proceso ARTFIJA para: ${ONVIO_COMPANY}`);
  let browser;
  try {
    browser = await chromium.launch({ headless: true, slowMo: 100 });
  } catch (error) {
    if (error.message.includes("Executable doesn't exist") || error.message.includes("browserType.launch")) {
      console.log(`[LOG] Navegador no encontrado. Intentando instalar Chromium...`);
      try {
        const playwrightRoot = path.dirname(require2.resolve(path.join(playwrightPath, "package.json")));
        const cliPath = path.join(playwrightRoot, "cli.js");
        console.log(`[DEBUG] Ejecutando: node ${cliPath} install chromium`);
        execSync(`"${process.execPath}" "${cliPath}" install chromium`, { stdio: "inherit" });
        console.log(`[LOG] Instalaci\xF3n finalizada. Reintentando inicio...`);
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
    await page.getByRole("link", { name: "Men\xFA" }).click();
    const page1Promise = page.waitForEvent("popup");
    await page.getByRole("link", { name: "Sueldos y Jornales \uE6AC" }).click();
    const page1 = await page1Promise;
    const searchInput = page1.getByRole("textbox", { name: "Buscar por C\xF3digo, Raz\xF3n" });
    await page1.waitForLoadState("networkidle");
    await searchInput.waitFor({ state: "visible", timeout: 6e4 });
    await searchInput.fill(ONVIO_COMPANY);
    await page1.waitForTimeout(1e3);
    await page1.getByText(ONVIO_COMPANY, { exact: false }).first().click();
    await page1.getByRole("button", { name: "Aceptar" }).click();
    const matrixPage = new MatrixPage(page1);
    await matrixPage.navigateToMatrices();
    try {
      await matrixPage.filterMatrixByCode("ARTFIJA");
      await matrixPage.editMatrix("ARTFIJA");
    } catch (e) {
      console.error(`[ERROR] No se encontr\xF3 la matriz ARTFIJA`);
      process.exit(1);
    }
    await matrixPage.clickAddValue();
    await matrixPage.fillMatrixValue(TARGET_DATE, MONTO_ACTUALIZAR);
    await matrixPage.confirmModal();
    const existed = await matrixPage.handleDuplicateError();
    if (existed) {
      console.log(`[LOG] AVISO: El valor para ${TARGET_DATE} ya exist\xEDa.`);
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
