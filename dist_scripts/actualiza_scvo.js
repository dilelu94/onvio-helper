// scripts/actualiza_scvo.js
import { createRequire } from "module";
import path from "path";
import fs from "fs";

// src/automation/utils/auth.js
async function login(page, user, pass) {
  console.log("--- INICIANDO LOGIN EN ONVIO ---");
  await page.goto("https://onvio.com.ar/#/");
  await page.getByRole("button", { name: "Iniciar sesi\xF3n" }).click();
  await page.getByRole("textbox", { name: "Correo electr\xF3nico" }).fill(user);
  await page.getByRole("button", { name: "Iniciar sesi\xF3n" }).click();
  await page.getByRole("textbox", { name: "Contrase\xF1a" }).fill(pass);
  await page.getByRole("button", { name: "Iniciar sesi\xF3n" }).click();
  await page.waitForURL(/.*onvio.com.ar\/staff.*/);
  console.log("Login exitoso.");
}

// src/automation/components/KendoGrid.js
var KendoGrid = class {
  constructor(page, selector = "div.k-grid") {
    this.page = page;
    this.grid = page.locator(selector);
  }
  /**
   * Clicks the filter icon for a specific column and fills the filter input.
   * @param columnName - The text of the column header to filter.
   * @param value - The value to filter by.
   */
  async filterByColumn(columnName, value) {
    const headerCell = this.grid.locator("th").filter({ hasText: columnName });
    const filterIcon = headerCell.locator(".k-grid-filter");
    await filterIcon.click({ delay: 200 });
    const filterMenu = this.page.locator(".k-filter-menu");
    await filterMenu.waitFor({ state: "visible" });
    await filterMenu.locator("input").first().fill(value);
    await this.page.waitForTimeout(500);
    await filterMenu.locator('button:has-text("Filtrar")').click({ force: true });
  }
  /**
   * Finds a row that contains specific text and returns it.
   * @param text - The text to look for in the row.
   */
  getRowByText(text) {
    return this.grid.locator("tr").filter({ hasText: text }).first();
  }
  /**
   * Clicks the "Editar" link within a specific row.
   * @param row - The row locator.
   */
  async editRow(row) {
    await row.click();
    await this.page.getByRole("link", { name: "\uE663Editar" }).click();
  }
  /**
   * Clicks the "Agregar" button within the grid (e.g., in the toolbar).
   */
  async clickAdd() {
    await this.grid.getByRole("link", { name: "\uE600Agregar" }).click();
  }
};

// src/automation/pages/MatrixPage.js
var MatrixPage = class {
  constructor(page) {
    this.page = page;
    this.grid = new KendoGrid(page);
  }
  /**
   * Navigates to the Matrix configuration section.
   */
  async navigateToMatrices() {
    await this.page.getByRole("heading", { name: "\uE638 Configuraci\xF3n" }).click();
    await this.page.getByRole("link", { name: "Matrices", exact: true }).click();
  }
  /**
   * Finds and filters a matrix by its code.
   * @param code - The matrix code (e.g., 'ARTFIJA' or 'SCVO').
   */
  async filterMatrixByCode(code) {
    console.log(`Filtrando matriz: ${code}...`);
    await this.grid.filterByColumn("C\xF3digo", code);
  }
  /**
   * Initiates the editing process for a specific matrix.
   * @param code - The matrix code.
   */
  async editMatrix(code) {
    const row = this.grid.getRowByText(code);
    await row.waitFor({ state: "visible", timeout: 1e4 });
    await this.grid.editRow(row);
  }
  /**
   * Espera a que los elementos de carga (spinners/overlays) desaparezcan.
   */
  async waitForLoading() {
    const loading = this.page.locator("#cargando, .k-loading-mask, .ui-widget-overlay");
    await loading.waitFor({ state: "hidden", timeout: 3e4 }).catch(() => {
    });
    await this.page.waitForTimeout(500);
  }
  /**
   * Clicks the "Agregar" button within the matrix context.
   */
  async clickAddValue() {
    await this.waitForLoading();
    console.log("Agregando nuevo valor...");
    await this.page.getByLabel("Matriz", { exact: true }).getByRole("link", { name: "\uE600Agregar" }).click();
  }
  /**
   * Fills the "Fecha" and "Valor" fields in the "Valor de la Matriz" modal.
   * @param date - The target date.
   * @param value - The new value.
   */
  async fillMatrixValue(date, value) {
    await this.page.getByText("Valor de la Matriz", { exact: true }).waitFor({ state: "visible" });
    console.log(`Escribiendo Fecha: ${date}`);
    const fechaInput = this.page.getByLabel("Fecha:");
    await fechaInput.click();
    await fechaInput.pressSequentially(date, { delay: 100 });
    await this.page.waitForTimeout(300);
    console.log(`Escribiendo Valor: ${value}`);
    const valorInput = this.page.getByRole("textbox", { name: "Valor:*" });
    await valorInput.click();
    await valorInput.pressSequentially(value, { delay: 100 });
    await this.page.waitForTimeout(300);
  }
  /**
   * Confirms the matrix value update in the modal.
   */
  async confirmModal() {
    await this.waitForLoading();
    console.log("Confirmando modal...");
    await this.page.getByLabel("Valor de la Matriz").getByRole("button", { name: "Aceptar" }).click();
  }
  /**
   * Handles duplicate entry errors by canceling the modal if needed.
   * Returns true if a duplicate was handled.
   */
  async handleDuplicateError() {
    const errorMsg = this.page.getByText("La fecha y el tope estan repetidos para la matriz");
    await this.page.waitForTimeout(500);
    if (await errorMsg.isVisible()) {
      console.log("AVISO: El registro ya existe. Cancelando modal.");
      await this.page.getByLabel("Valor de la Matriz").getByRole("button", { name: "Cancelar" }).click();
      return true;
    }
    return false;
  }
  /**
   * Confirms the overall matrix configuration update.
   */
  async confirmMainConfiguration() {
    console.log("Guardando configuraci\xF3n de la matriz principal...");
    await this.page.getByLabel("Matriz", { exact: true }).getByRole("button", { name: "Aceptar" }).click();
  }
};

// scripts/actualiza_scvo.js
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
var {
  ONVIO_USER,
  ONVIO_PASS,
  ONVIO_COMPANY,
  MONTO_ACTUALIZAR,
  TARGET_DATE
} = process.env;
async function run() {
  console.log(`[LOG] Iniciando proceso SCVO para: ${ONVIO_COMPANY}`);
  const browser = await chromium.launch({ headless: true, slowMo: 100 });
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
      await matrixPage.filterMatrixByCode("SCVO");
      await matrixPage.editMatrix("SCVO");
    } catch (e) {
      console.error(`[ERROR] No se encontr\xF3 la matriz SCVO`);
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
