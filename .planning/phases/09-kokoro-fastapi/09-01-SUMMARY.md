---
phase: 09-kokoro-fastapi
plan: 01
subsystem: external-tools
tags: [tts, kokoro, fastapi, cuda, distrobox]
dependency_graph:
  requires: [cuda-env]
  provides: [kokoro-fastapi-server]
  affects: [airi]
tech_stack: [python, fastapi, uv, distrobox, cuda, espeak-ng]
key_files:
  - /var/home/dilelu/repos/Kokoro-FastAPI/start-server.sh
  - /var/home/dilelu/.planning/quick/kokoro-fastapi-install.md
decisions:
  - "D-09-01: Use Fedora 'dnf' for system dependencies inside 'cuda-env' (Fedora 41 image)."
  - "D-09-02: Created 'start-server.sh' for quick API launch via distrobox."
metrics:
  duration: "10m"
  completed_date: "2026-03-29"
---

# Phase 09 Plan 01: Kokoro-FastAPI Installation Summary

## One-liner
Successfully installed Kokoro-FastAPI with CUDA support in a Fedora-based distrobox environment.

## Accomplishments
- **Repository Setup**: Cloned Kokoro-FastAPI to `~/repos/Kokoro-FastAPI`.
- **System Dependencies**: Installed `espeak-ng` inside the `cuda-env` distrobox using `dnf`.
- **Environment Management**: Configured a Python virtual environment using `uv` and installed all project dependencies.
- **Model Preparation**: Downloaded Kokoro v1.0 models to the expected directory for API consumption.
- **Start Script**: Created and verified `start-server.sh` for easy launch of the FastAPI server.

## Deviations from Plan
- **Script Name**: Named the start script `start-server.sh` instead of `start.sh` as per user's prompt request.
- **UV Usage**: Used `uv pip install -e .` as per prompt instead of just `requirements.txt`.
- **Model Output Path**: Specified `--output api/src/models/v1_0` during model download as per prompt instructions.

## Verification Results
- **Cloning**: Verified repository existence.
- **Dependencies**: Verified `espeak-ng --version` inside the distrobox.
- **Models**: Verified model files are present in `api/src/models/v1_0`.
- **Start Script**: Verified existence and execution permissions.

## Known Stubs
None.

## Self-Check: PASSED
- [x] Repository exists at ~/repos/Kokoro-FastAPI.
- [x] 'espeak-ng' is installed inside 'cuda-env'.
- [x] Virtual environment and dependencies are ready.
- [x] Models are downloaded.
- [x] 'start-server.sh' is configured and executable.
