import { KendoGrid } from '../components/KendoGrid.js';

export class MatrixPage {
  constructor(page) {
    this.page = page;
    this.grid = new KendoGrid(page);
  }

  async navigateToMatrices() {
    await this.page.getByRole('heading', { name: ' Configuración' }).click();
    await this.page.getByRole('link', { name: 'Matrices', exact: true }).click();
  }

  async filterMatrixByCode(code) {
    console.log(`[LOG] Filtrando matriz: ${code}...`);
    await this.grid.filterByColumn('Código', code);
  }

  async editMatrix(code) {
    const row = this.grid.getRowByText(code);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await this.grid.editRow(row);
  }

  async waitForLoading() {
    const loading = this.page.locator('#cargando, .k-loading-mask, .ui-widget-overlay');
    await loading.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async clickAddValue() {
    await this.waitForLoading();
    console.log('[LOG] Agregando nuevo valor...');
    await this.page.getByLabel('Matriz', { exact: true }).getByRole('link', { name: 'Agregar' }).click();
  }

  async fillMatrixValue(date, value) {
    await this.page.getByText('Valor de la Matriz', { exact: true }).waitFor({ state: 'visible' });
    
    console.log(`[LOG] Escribiendo Fecha: ${date}`);
    const fechaInput = this.page.getByLabel('Fecha:');
    await fechaInput.click();
    await fechaInput.pressSequentially(date, { delay: 100 });
    await this.page.waitForTimeout(300);
    
    console.log(`[LOG] Escribiendo Valor: ${value}`);
    const valorInput = this.page.getByRole('textbox', { name: 'Valor:*' });
    await valorInput.click();
    await valorInput.pressSequentially(value, { delay: 100 });
    await this.page.waitForTimeout(300);
  }

  async confirmModal() {
    await this.waitForLoading();
    console.log('[LOG] Confirmando modal...');
    await this.page.getByLabel('Valor de la Matriz').getByRole('button', { name: 'Aceptar' }).click();
  }

  async handleDuplicateError() {
    const errorMsg = this.page.getByText('La fecha y el tope estan repetidos para la matriz');
    await this.page.waitForTimeout(500);
    if (await errorMsg.isVisible()) {
      console.log('[LOG] AVISO: El registro ya existe. Cancelando modal.');
      await this.page.getByLabel('Valor de la Matriz').getByRole('button', { name: 'Cancelar' }).click();
      return true;
    }
    return false;
  }

  async confirmMainConfiguration() {
    await this.waitForLoading();
    console.log('[LOG] Guardando configuración de la matriz principal...');
    await this.page.getByLabel('Matriz', { exact: true }).getByRole('button', { name: 'Aceptar' }).click();
  }
}
