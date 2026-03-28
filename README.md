# Onvio Helper - Windows 11 Automation

This project is optimized for **Windows 11** compatibility.

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

4. **Run Smoke Test (Verification):**
   ```powershell
   npm run test:smoke
   ```

## 🛠 Features for Windows Compatibility
- **Cross-platform Paths**: Uses `path.join` to avoid `/` vs `\` issues.
- **Cross-env**: Uses `cross-env` for setting environment variables in PowerShell/CMD.
- **TypeScript (tsx)**: Native execution without complex build steps.
