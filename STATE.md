# Onvio Helper - Session State

## Last Session Achievements (v1.5.0 - v1.5.3)
- **Restored & Bundled Automation Scripts:** All four scripts (SCVO, ARTFIJA, Totales, Liquidaciones) are now correctly bundled into `dist_scripts` using `esbuild`.
- **Native PDF Download:** Updated `descarga_totales_generales.js` to use Playwright's native `download` event instead of manual `blob:` capture, improving reliability on Windows.
- **Auto-Restart Timer:** Implemented a 5-second countdown in the update modal that automatically triggers `handleRestart()` if no user action is taken.
- **Bulk Selection:** Added a "Select All" checkbox in the companies list for easier selection management.
- **GitHub Actions Fixes:** Updated `build.yml` to Node.js 22 LTS and added conditional publishing (`--publish always` only on tags) to resolve build concurrency errors.

## Current Project Version
- **v1.5.3** (Commit: `7698cbf` / `d9a42d9`)

## Pending Tasks (Future Sessions)
- [ ] **UI Tooltips:** Add descriptive tooltips to buttons and configuration fields for better UX.
- [ ] **Keyboard Accessibility:** Map the `Enter` key to main actions (like "Iniciar Proceso" or "Guardar") to make navigation more intuitive.
- [ ] **UI Refinement:** General pass on spacing and feedback to improve "intuitiveness."

---
*Session closed on March 28, 2026.*
