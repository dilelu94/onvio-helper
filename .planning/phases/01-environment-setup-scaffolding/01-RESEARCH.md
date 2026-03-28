# Phase 1: Environment Setup & Scaffolding - Research

**Researched:** 2026-03-28
**Domain:** Playwright, Node.js, Windows 11 Compatibility, POM Scaffolding
**Confidence:** HIGH

## Summary

The goal of Phase 1 is to initialize a Playwright project and scaffold an enhanced Page Object Model (POM) that is fully compatible with Windows 11. The current version works on Linux but fails on Windows, likely due to environment-specific configurations or path handling.

**Primary recommendation:** Use a standardized Playwright structure with explicit path handling, cross-platform scripts, and a robust POM base to abstract Kendo UI complexities.

<user_constraints>
## User Constraints (from 01-CONTEXT.md)

### Locked Decisions
- **Windows 11 Support**: The primary goal is to make the automation work seamlessly on Windows 11. All dependencies, path handling, and shell executions must be tested for Windows 11 compatibility.

### the agent's Discretion
- Implementation details for POM structure and Playwright initialization.

### Deferred Ideas (OUT OF SCOPE)
- None — Focus is on setup and basic navigation compatibility.
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | ^1.42.0+ | Core automation framework | Industry standard for reliable, cross-browser automation. |
| @playwright/test | ^1.42.0+ | Test runner and assertions | Optimized for Playwright, provides powerful features like trace viewer and parallelism. |
| tsx | ^4.7.1 | TypeScript execution | Allows running TypeScript directly in ESM mode without manual compilation. |
| dotenv | ^17.3.1 | Environment management | Handles secrets and configuration (ONVIO credentials). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| cross-env | ^7.0.3 | Cross-platform env vars | Essential for setting environment variables in `package.json` scripts (e.g., `SET MONTO=123`). |
| path-browserify | — | Path handling | If any browser-side path manipulation is needed (unlikely here but good to know). |

**Installation:**
```bash
npm install @playwright/test playwright tsx dotenv cross-env typescript --save-dev
npx playwright install --with-deps
```

## Architecture Patterns

### Recommended Project Structure
```
/
├── .env                # Secrets (ignored by git)
├── playwright.config.ts # Playwright settings
├── src/
│   ├── automation/
│   │   ├── pages/      # Page objects
│   │   ├── components/ # Reusable UI fragments (KendoGrid)
│   │   ├── fixtures/   # Playwright fixtures (injecting pages)
│   │   └── utils/      # Helpers (auth, path, date)
│   └── main.ts         # Script entry point
└── tests/              # E2E test files
```

### Pattern 1: Base Page Object
**What:** A common class that all Page Objects extend to share logic.
**When to use:** Handling common UI states like "loading" or "notifications".
**Example:**
```typescript
// src/automation/pages/BasePage.ts
import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async waitForLoading() {
    // Kendo specific loading masks
    const loading = this.page.locator('.k-loading-mask, .ui-widget-overlay');
    await expect(loading).not.toBeVisible({ timeout: 15000 });
  }

  async navigate(url: string) {
    await this.page.goto(url);
  }
}
```

### Pattern 2: Kendo Grid Component
**What:** Abstraction for interacting with complex Kendo UI grids.
**When to use:** Any page containing an 'artfija' or similar matrix.
**Example:**
```typescript
// src/automation/components/KendoGrid.ts
import { Locator, Page } from '@playwright/test';

export class KendoGrid {
  constructor(private page: Page, private container: Locator) {}

  async getRowByText(text: string) {
    return this.container.getByRole('row').filter({ hasText: text });
  }

  async filterByColumn(columnName: string, value: string) {
    const header = this.container.locator('th').filter({ hasText: columnName });
    await header.locator('.k-grid-filter').click();
    const filterMenu = this.page.locator('.k-filter-menu');
    await filterMenu.locator('input').first().fill(value);
    await filterMenu.getByRole('button', { name: 'Filtrar' }).click();
  }
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wait for elements | `setTimeout` or manual loops | Playwright Auto-waiting | Brittle and inefficient compared to built-in polling. |
| Path handling | String concatenation (`'src/' + file`) | `path.join()` | Windows uses `\`, Linux uses `/`. |
| Env var setting | Shell scripts (`EXPORT X=1`) | `cross-env` | Shell commands vary wildly between PowerShell and Bash. |
| JSON parsing | Custom regex | `fs.readFileSync` + `JSON.parse` | Standard Node.js practice. |

## Common Pitfalls

### Pitfall 1: Hardcoded Linux Paths
**What goes wrong:** `const path = '/home/user/app'` fails on Windows.
**Why it happens:** Linux/macOS paths are absolute and use `/`.
**How to avoid:** Always use `path.join(process.cwd(), 'rel_path')`.

### Pitfall 2: Shell Compatibility
**What goes wrong:** `npm run start` fails because `VAR=1 node script.js` only works on Bash.
**Why it happens:** Windows CMD uses `set VAR=1 && node script.js`, PowerShell uses different syntax.
**How to avoid:** Use `cross-env VAR=1 node script.js` in `package.json`.

### Pitfall 3: Browser Dependencies
**What goes wrong:** Browser fails to launch with "Missing dependencies".
**Why it happens:** Playwright browsers need system libraries (DirectX, Media Foundation, etc.).
**How to avoid:** Run `npx playwright install --with-deps`.

### Pitfall 4: Encoding & Special Characters
**What goes wrong:** Selectors like `getByText('')` fail if file is not UTF-8.
**Why it happens:** Icon fonts use Private Use Area characters that are fragile in different environments.
**How to avoid:** Use regex for text matching (e.g., `/Sueldos y Jornales/`) or stable role/aria-label locators.

## Code Examples

### cross-platform File Reading
```typescript
// Source: https://nodejs.org/api/path.html
import path from 'path';
import fs from 'fs';

const filePath = path.join(process.cwd(), 'data', 'companies.txt');
const content = fs.readFileSync(filePath, 'utf-8');
```

### cross-platform Shell Scripts (package.json)
```json
{
  "scripts": {
    "start": "cross-env MONTO_ACTUALIZAR=1637 tsx src/main.ts",
    "test": "playwright test"
  }
}
```

## Open Questions

1. **Specific Windows Failure Log:** 
   - What we know: It fails on Windows.
   - What's unclear: The exact error message (Path not found? Browser crash? Timeout?).
   - Recommendation: Plan for a "Smoke Test" task early in Phase 1 to capture logs if it still fails.

2. **Terminal Choice:**
   - What we know: Windows 11 uses Terminal (PowerShell 7+ or CMD).
   - What's unclear: If the environment has restrictive execution policies.
   - Recommendation: Use `npx` prefix for all CLI tools to avoid path issues.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 25.8.2 | — |
| npm | Package Manager | ✓ | 11.11.1 | — |
| Playwright | Automation | ✓ | ^1.58.2 | Reinstall in Phase 1 |
| Windows 11 | OS Constraint | ✗ | — | Local execution (this env is Linux) |

**Missing dependencies with no fallback:**
- Windows 11 (This researcher environment is Linux). The planner must include verification steps that can be run on the target Windows machine or provide clear instructions for the user to verify.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright Test |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test --project=chromium --grep "@smoke"` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-01 | Playwright initialized | Smoke | `npx playwright --version` | ❌ Wave 0 |
| SETUP-02 | Directories created | Unit | `ls src/automation/pages` | ❌ Wave 0 |
| SETUP-03 | Base POM works | Integration | `npx playwright test tests/setup.test.ts` | ❌ Wave 0 |

## Sources

### Primary (HIGH confidence)
- [Playwright Official Docs](https://playwright.dev/docs/intro) - Installation and POM patterns.
- [Node.js Path Docs](https://nodejs.org/api/path.html) - Cross-platform path handling.
- [Kendo UI Grid Docs](https://www.telerik.com/kendo-angular-ui/components/grid/) - Understanding the DOM structure.

### Secondary (MEDIUM confidence)
- [cross-env GitHub](https://github.com/kentcdodds/cross-env) - Handling environment variables cross-platform.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright is well-documented for Windows.
- Architecture: HIGH - Standard POM is robust.
- Pitfalls: HIGH - Common cross-platform issues are well-known.

**Research date:** 2026-03-28
**Valid until:** 2026-04-28
