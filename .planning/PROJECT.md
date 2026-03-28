# Project: Onvio 'artfija' Matrix Update Automation

## What This Is
Automation of the Onvio 'artfija' matrix update workflow using Playwright and an enhanced Page Object Model (POM) to handle complex Kendo UI grids.

## Core Value
Efficiency, consistency, and reliability in the 'artfija' matrix update process, reducing manual intervention and potential errors.

## Requirements
- **Validated**:
  - Automate navigation to the 'artfija' matrix.
  - Implement robust row/cell identification and interaction.
  - Automate data entry and validation for matrix updates.
  - Handle asynchronous events (Kendo UI loading, toast notifications).
- **Active**:
  - Initial setup and scaffolding with Playwright.
  - Development of reusable Kendo UI components for the grid.
- **Out of Scope**:
  - Handling Onvio login (assume pre-authenticated state or provided fixture).
  - General Onvio site-wide automation.

## Key Decisions
- **Enhanced POM**: Use a modular structure for maintainability.
- **Role-based Locators**: Prioritize `getByRole` and `getByText` for Kendo UI stability.
- **Wait Strategies**: Use `page.waitForResponse` and explicit DOM state checks for Kendo events.

## Constraints
- Must be compatible with Onvio's current Kendo UI implementation.
- Should avoid brittle CSS/XPath selectors.
- Must handle network latency and asynchronous UI transitions.
