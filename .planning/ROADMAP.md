# Roadmap: Onvio 'artfija' Matrix Update Automation

## Goal
Automate the 'artfija' matrix update process in Onvio using Playwright and a modular, maintainable architecture.

## Phase 1: Environment Setup & Scaffolding
**Goal**: Set up the Playwright environment and initialize the enhanced POM structure.
**Plans:** 2 plans
- [x] 01-01-PLAN.md — Core Playwright Initialization & Windows Baseline
- [x] 01-02-PLAN.md — Enhanced POM Scaffolding (TypeScript Migration)

**Success Criteria**: Playwright is running and the basic structure is ready for feature development.

## Phase 2: Kendo UI Components & Matrix Navigation
**Goal**: Implement reusable Kendo UI components and automate navigation to the 'artfija' matrix.
- [ ] Create `KendoGrid` component for interacting with role-based grid elements.
- [ ] Develop `MatrixPage` for navigating to and identifying the 'artfija' matrix.
- [ ] Implement initial identification and "Edit" action click.
- **Success Criteria**: Automation can reliably navigate to the matrix and initiate an edit action.

## Phase 3: Matrix Data Entry & Update Logic
**Goal**: Automate the data entry process and handle the commit workflow.
- [ ] Implement cell-level interaction and data input logic.
- [ ] Add wait strategies for Kendo validation and toast notifications.
- [ ] Automate the "Save/Apply" action and success validation.
- **Success Criteria**: Matrix updates are correctly input, saved, and verified.

## Phase 4: Integration & Final Validation
**Goal**: Ensure end-to-end reliability and project cleanup.
- [ ] Refine fixtures for authenticated state handling.
- [ ] Conduct final end-to-end tests for the complete matrix update.
- [ ] Final documentation and code cleanup.
- **Success Criteria**: A stable, documented automation solution for the 'artfija' matrix update.

## Phase 5: Ecosystem Expansion & External Tools
**Goal**: Integrate external tools and projects into the environment.
**Plans:** 2 plans
- [x] 05-01-PLAN.md — pnpm and airi Setup
- [x] 05-02-PLAN.md — airi Configuration & Verification
**Success Criteria**: pnpm is installed and airi repository is cloned and ready for use.

## Phase 6: Dotfiles Management
**Goal**: Set up a centralized dotfiles repository using GNU Stow for system configuration portability.
**Plans:** 1 plan
- [x] 06-01-PLAN.md — GNU Stow Initialization & Repo Sync
**Success Criteria**: .bashrc and .gitconfig are managed by Stow and pushed to GitHub.
**Requirements:** [DOTFILES-01]
