import { test, expect } from '@playwright/test';
import { BasePage } from '../src/automation/pages/BasePage';
import { KendoGrid } from '../src/automation/components/KendoGrid';

test('POM: base classes can be instantiated', async ({ page }) => {
  const basePage = new BasePage(page);
  expect(basePage).toBeDefined();
  
  const grid = new KendoGrid(page, page.locator('.k-grid'));
  expect(grid).toBeDefined();
});
