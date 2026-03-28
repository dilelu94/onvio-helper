# Architecture Research: Playwright Project Structure

## Proposal: Enhanced Page Object Model (POM)

To improve upon the `onvio-svco` structure, we propose a modular architecture utilizing an enhanced Page Object Model.

### Core Structure
- **`/pages`**: Classes representing distinct Onvio screens or major components (e.g., `MatrixPage.ts`, `DashboardPage.ts`).
- **`/components`**: Reusable Kendo UI abstractions (e.g., `KendoGrid.ts`, `KendoDropdown.ts`) to encapsulate the complex selector logic for these common widgets.
- **`/fixtures`**: Playwright custom fixtures for authenticated state, setup, and teardown, ensuring tests are isolated and run efficiently.
- **`/utils`**: Helper functions for API mocking, specific date parsing, and wait strategies tailored to Onvio's load patterns.

### Benefits
- **Maintainability**: Centralizing Kendo specific logic in `/components` means UI updates only require changes in one place.
- **Readability**: Tests focus on business logic (the 'artfija' update) rather than low-level DOM interaction.
