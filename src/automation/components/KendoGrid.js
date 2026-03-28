export class KendoGrid {
  constructor(page, selector = 'div.k-grid') {
    this.page = page;
    this.grid = page.locator(selector);
  }

  async filterByColumn(columnName, value) {
    const headerCell = this.grid.locator('th').filter({ hasText: columnName });
    const filterIcon = headerCell.locator('.k-grid-filter');
    
    await filterIcon.click({ delay: 200 });
    
    const filterMenu = this.page.locator('.k-filter-menu');
    await filterMenu.waitFor({ state: 'visible' });
    
    await filterMenu.locator('input').first().fill(value);
    await this.page.waitForTimeout(500);
    
    await filterMenu.locator('button:has-text("Filtrar")').click({ force: true });
  }

  getRowByText(text) {
    return this.grid.locator('tr').filter({ hasText: text }).first();
  }

  async editRow(row) {
    await row.click();
    await this.page.getByRole('link', { name: 'Editar' }).click();
  }

  async clickAdd() {
    await this.grid.getByRole('link', { name: 'Agregar' }).click();
  }
}
