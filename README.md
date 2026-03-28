# Onvio Helper - Windows 11 Automation & Desktop App

This project is a **Desktop Application** built with Electron and React, optimized for **Windows 11** compatibility. It automates the 'artfija' matrix update in Onvio using Playwright.

## 🚀 Setup for Windows 11

1. **Clone the repository:**
   ```powershell
   git clone https://github.com/dilelu94/onvio-helper.git
   cd onvio-helper
   git checkout master
   ```

2. **Install Dependencies:**
   ```powershell
   npm install
   npx playwright install chromium --with-deps
   ```

3. **Configure Environment:**
   - Copy `.env.example` to `.env`.
   - Fill in your Onvio credentials.

## 💻 Running the Desktop App

### Development Mode
To run the app locally for development:
```powershell
npm run dev
```

### Build the Windows Installer
To generate the `.exe` installer (found in `dist_electron/`):
```powershell
npm run build
```

## 🧪 Automation Verification
To run the Playwright smoke tests:
```powershell
npm run test:smoke
```

## 🛠 Features for Windows Compatibility
- **Cross-platform Paths**: Uses `path.join` to avoid `/` vs `\` issues.
- **Cross-env**: Uses `cross-env` for setting environment variables in PowerShell/CMD.
- **Enhanced POM**: Modular TypeScript structure for Kendo UI grid interaction.
- **Auto-Update**: Integrated `electron-updater` for seamless application updates.

---
**Maintained by:** dilelu94
**Version:** 1.2.3
