# Onvio Helper - Session State

## Last Session Achievements (v1.5.0 - v1.5.3)
- **Restored & Bundled Automation Scripts:** All four scripts (SCVO, ARTFIJA, Totales, Liquidaciones) are now correctly bundled into `dist_scripts` using `esbuild`.
- **Native PDF Download:** Updated `descarga_totales_generales.js` to use Playwright's native `download` event instead of manual `blob:` capture, improving reliability on Windows.
- **Auto-Restart Timer:** Implemented a 5-second countdown in the update modal that automatically triggers `handleRestart()` if no user action is taken.
- **Bulk Selection:** Added a "Select All" checkbox in the companies list for easier selection management.
- **GitHub Actions Fixes:** Updated `build.yml` to Node.js 22 LTS and added conditional publishing (`--publish always` only on tags) to resolve build concurrency errors.

## Quick Tasks Completed
- [x] **Install pnpm:** Installed via official script (v10.33.0).
- [x] **Correct Discord Token:** Changed `DISCORD_BOT_TOKEN` to `DISCORD_TOKEN` in `~/.bashrc` and `Bazzite-dotfile/aliases.sh` to allow Airi Flatpak to connect to Discord.
- [x] **Robust Airi Alias:** Implemented automatic cleanup (killall + cache removal) in `airi` alias to prevent "Loading" issues after RAM crashes.
- [x] **Remove local airi repo:** Repository `~/repos/airi/` deleted as requested to use the installed Flatpak version exclusively.
- [x] **Whisper Server Config:** Generated optimized Docker Run command for `faster-whisper-server` (base, int8_float16, CUDA).
- [x] **Whisper Aliases:** Added `whisper-server` and `whisper-stop` aliases to `~/.bashrc` and `Bazzite-dotfile/aliases.sh`.
- [x] **OpenAI Library Installation:** Installed 'openai' package and added 'scripts/verify-openai.js' for verification.

## Current Project Version
- **v1.5.3** (Commit: `7698cbf` / `d9a42d9`)

## Pending Tasks (Future Sessions)
- [ ] **UI Tooltips:** Add descriptive tooltips to buttons and configuration fields for better UX.
- [ ] **Keyboard Accessibility:** Map the `Enter` key to main actions (like "Iniciar Proceso" or "Guardar") to make navigation more intuitive.
- [ ] **UI Refinement:** General pass on spacing and feedback to improve "intuitiveness."

---
*Session closed on March 29, 2026.*
| Task | Status | Date |
|---|---|---|
| Install Speaches.ai locally (CUDA-env) | Completed | 2026-03-29 |
| faster-whisper-server Docker config | Completed | 2026-03-30 |
| faster-whisper-server aliases | Completed | 2026-03-30 |
| Install OpenAI Codex CLI | Completed | 2026-03-30 |
