# Roadmap for onvio-helper

## Project Milestone: V1 MVP

This milestone focuses on delivering a functional Electron app for local automation on the Onvio platform.

## Phases

- [x] **Phase 1: Configuration Management** - Finalize UI and service for managing Onvio credentials and company list.
- [ ] **Phase 2: Automation Execution Engine** - Implement IPC and UI logging console to run external scripts and stream output.
- [ ] **Phase 3: Totales Generales Script** - Implement the "Totales Generales" Playwright/Python script and its UI trigger.
- [ ] **Phase 4: Liquidaciones Script** - Implement the "Liquidaciones" Playwright/Python script and its UI trigger.
- [ ] **Phase 5: Dashboard & Final Polish** - Refine the user interface into a cohesive dashboard with company selection.

## Phase Details

### Phase 1: Configuration Management
**Goal**: Securely manage Onvio credentials and company lists without hardcoding.
**Depends on**: Initial Scaffolding
**Requirements**: CONFIG-01, CONFIG-02, CONFIG-03, TDD-01
**Success Criteria**:
  1. User can enter and save email/password that persists across sessions.
  2. User can add/remove companies with Name and ID.
  3. Tests confirm ConfigManager correctly handles storage.
**Plans**: TBD

### Phase 2: Automation Execution Engine
**Goal**: Enable the UI to trigger scripts and display live output.
**Depends on**: Phase 1
**Requirements**: UI-02, SCRIPT-03, TDD-01
**Success Criteria**:
  1. A "Test Script" button triggers a background process.
  2. The UI console shows `stdout`/`stderr` from the script in real-time.
  3. Scripts are loaded from isolated files/scripts.
**Plans**: TBD

### Phase 3: Totales Generales Script
**Goal**: Automate "Totales Generales" extraction.
**Depends on**: Phase 2
**Requirements**: SCRIPT-01, UI-03, TDD-01
**Success Criteria**:
  1. User can select a company from the saved list.
  2. Clicking "Run Totales Generales" executes the automation.
  3. Process completes with a success/failure log message.
**Plans**: TBD

### Phase 4: Liquidaciones Script
**Goal**: Automate "Liquidaciones" extraction.
**Depends on**: Phase 3
**Requirements**: SCRIPT-02, TDD-01
**Success Criteria**:
  1. User can run "Liquidaciones" for a selected company.
  2. Automation handles Onvio navigation correctly.
  3. Results/Logs are visible in the UI console.
**Plans**: TBD

### Phase 5: Dashboard & Final Polish
**Goal**: Provide a professional and easy-to-use interface.
**Depends on**: Phase 4
**Requirements**: UI-01, TDD-01
**Success Criteria**:
  1. Clean UI layout with clear distinction between configuration and execution.
  2. Error handling for missing credentials or failed automations.
  3. Responsive UI that doesn't freeze during script execution.
**Plans**: TBD

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Configuration Management | 0/1 | In Progress | - |
| 2. Automation Execution Engine | 0/1 | Not started | - |
| 3. Totales Generales Script | 0/1 | Not started | - |
| 4. Liquidaciones Script | 0/1 | Not started | - |
| 5. Dashboard & Final Polish | 0/1 | Not started | - |
