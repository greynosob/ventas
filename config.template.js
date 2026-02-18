// ============================================================
// config.template.js — Template de configuración (NO editar directamente)
// ============================================================
//
// Este archivo contiene placeholders (%%VAR%%) que el CI/CD (GitHub Actions)
// reemplaza automáticamente con los valores de GitHub Secrets durante el deploy.
//
// NO commitear config.js — ese archivo se genera en el pipeline.
// Para desarrollo local: crear config.js manualmente copiando este archivo
// y reemplazando los %%PLACEHOLDERS%% con valores reales.
//
// GitHub Secrets requeridos (Settings > Secrets and variables > Actions):
//   SHEET_ID             — ID del Google Sheet
//   API_KEY              — Google Cloud API Key (restringida a Sheets API + tu dominio)
//   APPS_SCRIPT_URL      — URL del Web App de Apps Script
//   API_TOKEN            — Token compartido 64 hex chars (generar una sola vez)
//   ADMIN_PASSWORD_SALT  — Salt PBKDF2 en hex (generado junto con el hash)
//   WHATSAPP_NUMBER      — Número de WhatsApp con código de país (sin +)
//
// Apps Script Properties requeridas (Project Settings > Script Properties):
//   API_TOKEN            — Mismo valor que el GitHub Secret API_TOKEN
//   SHEET_ID             — ID del Google Sheet
//   ADMIN_PASSWORD_HASH  — Hash PBKDF2 (generado localmente, nunca va a git)
//   ADMIN_PASSWORD_SALT  — Mismo valor que el GitHub Secret ADMIN_PASSWORD_SALT
//
// Para generar API_TOKEN:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// Para generar ADMIN_PASSWORD_HASH y ADMIN_PASSWORD_SALT (en consola del browser):
//   const password = 'TuContraseñaReal123!';
//   const salt = crypto.getRandomValues(new Uint8Array(16));
//   const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2,'0')).join('');
//   const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
//   const hash = await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000}, key, 256);
//   const hashHex = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
//   console.log('SALT:', saltHex);  // → GitHub Secret ADMIN_PASSWORD_SALT + Script Property
//   console.log('HASH:', hashHex);  // → SOLO Script Property ADMIN_PASSWORD_HASH (nunca a git)

const CONFIG = {
  SHEET_ID: '%%SHEET_ID%%',
  API_KEY: '%%API_KEY%%',
  APPS_SCRIPT_URL: '%%APPS_SCRIPT_URL%%',
  API_TOKEN: '%%API_TOKEN%%',
  ADMIN_PASSWORD_SALT: '%%ADMIN_PASSWORD_SALT%%',
  WHATSAPP_NUMBER: '%%WHATSAPP_NUMBER%%',

  RANGES: {
    INVENTARIO: 'Inventario!A:K',
    CATEGORIAS: 'Categorías!A:D',
    VENTAS: 'Ventas!A:I'
  },

  // ADMIN_PASSWORD_HASH eliminado — autenticación delegada a Apps Script

  CACHE_TTL: 5 * 60 * 1000,
  SITE_NAME: 'Garage Sale',
  SITE_DESCRIPTION: 'Las mejores ofertas en artículos de segunda mano',
  CURRENCY: 'QTZ',
  CURRENCY_SYMBOL: 'Q',
  DEFAULT_LANG: 'es'
};
