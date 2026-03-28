import { Locator, Page } from '@playwright/test';

export class KendoGrid {
  constructor(private page: Page, private container: Locator) {}

  /**
   * Finds a row that contains the specified text.
   * @param text The text to search for within the row.
   */
  async getRowByText(text: string) {
    return this.container.getByRole('row').filter({ hasText: text });
  }

  /**
   * Applies a filter to a specific column.
   * @param columnName The name of the column to filter.
   * @param value The value to filter by.
   */
  async filterByColumn(columnName: string, value: string) {
    const header = this.container.locator('th').filter({ hasText: columnName });
    await header.locator('.k-grid-filter').click();
    
    const filterMenu = this.page.locator('.k-filter-menu');
    await filterMenu.locator('input').first().fill(value);
    await filterMenu.getByRole('button', { name: 'Filtrar' }).click();
    
    // Grid usually reloads after filtering
    await this.page.waitForResponse(response => 
      response.url().includes('Onvio') && response.status() === 200
    );
  }

  /**
   * Gets a cell by row and column index.
   */
  async getCell(rowIndex: number, colIndex: number) {
    const row = this.container.locator('tbody tr').nth(rowIndex);
    return row.locator('td').nth(colIndex);
  }
}
