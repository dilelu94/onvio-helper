/**
 * Handles the Onvio login process.
 */
export async function login(page, user, pass) {
  console.log('[LOG] Iniciando login en Onvio...');
  await page.goto('https://onvio.com.ar/#/');
  
  // Wait for either the login button or the email field
  await page.waitForSelector('button:has-text("Iniciar sesión"), input[type="email"]', { timeout: 30000 });
  
  const loginBtn = page.getByRole('button', { name: 'Iniciar sesión' }).first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
  }

  await page.getByRole('textbox', { name: /correo/i }).fill(user);
  await page.getByRole('button', { name: /iniciar/i }).click();
  await page.getByRole('textbox', { name: /contraseña/i }).fill(pass);
  await page.getByRole('button', { name: /iniciar/i }).click();

  await page.waitForURL(/.*onvio.com.ar\/staff.*/, { timeout: 60000 });
  console.log('[LOG] Login exitoso.');
}
