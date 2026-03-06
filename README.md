# Onvio Helper 🚀

Asistente de escritorio inteligente para automatizar la descarga de comprobantes y reportes de la plataforma Onvio. Diseñado para contadores y estudios que necesitan eficiencia y organización sin complicaciones.

## ✨ Funcionalidades Clave

- **Descarga Secuencial:** Procesa múltiples empresas una por una para evitar bloqueos de sesión en Onvio.
- **Detección por Contenido:** Identifica automáticamente la planilla de Totales Generales mediante análisis binario (inmune a retrasos de carga).
- **Gestión de Alias:** Organiza tus descargas en carpetas personalizadas usando alias para cada empresa.
- **Seguridad Local:** Tus credenciales se cifran mediante el llavero nativo de tu sistema operativo (Windows/Linux).
- **Auto-Update:** Se actualiza automáticamente cada vez que hay una mejora en GitHub.

---

## 🚀 Instalación (Windows)

Esta aplicación es **Portable**, lo que significa que no requiere instalación.

1. Ve a la sección de [Releases](https://github.com/dilelu94/onvio-helper/releases).
2. Descarga el archivo `OnvioHelper.exe`.
3. Guárdalo en una carpeta cómoda (ej. tu Escritorio o Documentos).
4. Haz doble clic para iniciar.

---

## 🛠️ Cómo se usa

### 1. Configuración Inicial
Al abrir la app por primera vez, verás el estado "🔴 Sin cuenta vinculada".
- Haz clic en el botón **⚙️ Cuenta**.
- Ingresa tu Email y Contraseña de Onvio.
- Dale a **Vincular**. El estado cambiará a "🟢 Conectado como...".

### 2. Gestión de Empresas
- Ingresa el **Nombre Real** de la empresa (exactamente como figura en el buscador de Onvio).
- Ingresa un **Alias** (ej. "CLUB PESCA"). Este nombre se usará para crear las carpetas en tu PC.
- Pulsa el botón **+** para agregarla a tu lista permanente.
- *Tip:* Puedes editar nombres y alias en cualquier momento usando el icono del lápiz ✏️.

### 3. Descarga de Reportes
- Selecciona el **Mes** y **Año** deseado en el Panel de Control.
- Marca los checkboxes de las empresas que deseas procesar.
- Haz clic en **📥 Descargar Totales Generales** o **📥 Descargar Liquidaciones**.
- **Destino:** Los archivos se guardarán automáticamente en tu Escritorio dentro de una carpeta organizada por fecha (ej. `02 2026 Liquidaciones / CLUB PESCA / ...`).

---

## 🔄 Actualizaciones

¡No tienes que hacer nada! 
Cada vez que inicies la aplicación, ella consultará si existe una nueva versión en este repositorio. Si hay una actualización disponible:
1. La descargará silenciosamente en segundo plano.
2. Te notificará cuando esté lista.
3. Se reiniciará con todas las mejoras aplicadas.

---

## 🛡️ Seguridad y Privacidad

- **Sin Hardcodeo:** No hay contraseñas ni datos sensibles guardados en el código fuente.
- **Cifrado Industrial:** La contraseña se guarda usando `safeStorage`, protegida por la seguridad de tu propio usuario de Windows/Linux.
- **Aislamiento:** Cada descarga abre una instancia de navegador limpia para garantizar la privacidad de los datos entre empresas.

---
*Desarrollado con rigor técnico mediante TDD y GSD.*
