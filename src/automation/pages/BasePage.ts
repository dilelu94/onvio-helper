import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigates to a specific URL.
   * @param url The URL to navigate to.
   */
  async navigate(url: string) {
    await this.page.goto(url);
  }

  /**
   * Waits for Kendo loading masks to disappear.
   */
  async waitForLoading() {
    const loading = this.page.locator('.k-loading-mask, .ui-widget-overlay');
    await expect(loading).not.toBeVisible({ timeout: 15000 });
  }

  /**
   * Wait for specific network response.
   * @param urlPart Partial URL to match.
   */
  async waitForResponse(urlPart: string | RegExp) {
    return this.page.waitForResponse(response => 
      (typeof urlPart === 'string' ? response.url().includes(urlPart) : urlPart.test(response.url())) &&
      response.status() === 200
    );
  }
}
