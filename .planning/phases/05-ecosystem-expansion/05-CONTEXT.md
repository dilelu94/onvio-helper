# Phase Context: Phase 05 - Ecosystem Expansion & External Tools

## Objective
The objective of this phase is to install `pnpm` (package manager) and clone/configure the `airi` repository from https://github.com/moeru-ai/airi in `~/repos/airi`.

## Decisions
- **D-01: pnpm Installation**: Use the official `pnpm` installation script (`curl -fsSL https://get.pnpm.io/install.sh | sh -`).
- **D-02: airi Repository**: Clone the repository to `~/repos/airi`.
- **D-03: Dependency Installation**: Use `pnpm install` inside the `airi` repository.
- **D-04: Registration**: Log the installation in `MODS.md` and `STATE.md`.

## Requirements
- `EXT-01`: `pnpm` must be installed and available in the shell.
- `EXT-02`: `airi` repository must be cloned to `~/repos/airi`.
- `EXT-03`: `airi` dependencies must be installed.
- `REG-01`: Modifications must be registered in `MODS.md` and `STATE.md`.
