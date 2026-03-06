const { app } = require('electron');
app.whenReady().then(() => {
  console.log('RUTA_CONFIG:', app.getPath('userData'));
  app.quit();
});
