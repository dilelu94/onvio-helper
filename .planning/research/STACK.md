# Playwright Stack Research: Kendo UI Grids

## Overview
Interacting with complex Kendo UI grids (used extensively in Onvio) requires stable, resilient automation strategies in Playwright.

## Best Practices
1. **Stable Selectors**: 
   - Avoid brittle CSS paths. Use Playwright's robust locators like `getByRole`, `getByText`, or custom `data-test-id` attributes.
   - For Kendo grids specifically, target the semantic table structure (`role="grid"`, `role="row"`, `role="gridcell"`) rather than auto-generated Kendo classes which can change between versions.

2. **Handling Kendo UI Asynchronous Loading**:
   - Kendo grids often use virtual scrolling and lazy loading. Playwright's auto-waiting is useful, but explicit waits for specific API responses (using `page.waitForResponse`) or DOM states (e.g., loading spinners disappearing) are often necessary.

3. **Popups and Modals**:
   - Onvio frequently uses Kendo Window or custom modals. Playwright handles these seamlessly if they are DOM elements. Use `page.locator('.k-window').waitFor({ state: 'visible' })`.
   - Ensure you wait for animation completion before interacting with elements inside the popup to avoid "element intercepted" errors.
