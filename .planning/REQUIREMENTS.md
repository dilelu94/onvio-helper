# Requirements for onvio-helper

## V1 Scope (MVP)

### CONFIG: Configuration Management
- **CONFIG-01**: User can configure and save Onvio credentials (email, password) through the UI.
- **CONFIG-02**: User can manage a list of companies (name, ID) through the UI.
- **CONFIG-03**: Sensitive credentials must be stored securely (no hardcoding).

### SCRIPT: Automation Scripts
- **SCRIPT-01**: User can trigger a "Totales Generales" script for a selected company.
- **SCRIPT-02**: User can trigger a "Liquidaciones" script for a selected company.
- **SCRIPT-03**: Scripts must be isolated in their own files/scripts (Playwright/Python).

### UI: User Interface
- **UI-01**: Dashboard with buttons to trigger each automation script.
- **UI-02**: Real-time log console showing script execution progress and errors.
- **UI-03**: Selection menu for which company to run the script for.

### TDD: Testing
- **TDD-01**: Each functionality must have at least one test.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONFIG-01 | Phase 1 | DONE |
| CONFIG-02 | Phase 1 | DONE |
| CONFIG-03 | Phase 1 | Pending |
| SCRIPT-01 | Phase 3 | Pending |
| SCRIPT-02 | Phase 4 | Pending |
| SCRIPT-03 | Phase 2 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 3 | Pending |
| TDD-01 | All Phases | Ongoing |
