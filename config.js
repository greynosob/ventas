// ============================================================
// config.js — Configuración central del sitio
// ============================================================
//
// INSTRUCCIONES DE SETUP:
//
// 1. Crear una hoja de Google Sheets con 3 pestañas:
//    - "Inventario" (columnas: ID | Título | DescripciónCorta | DescripciónLarga | Precio | PrecioAnterior | Categoría | Tags | Imágenes | Estado | FechaPublicación)
//    - "Categorías" (columnas: ID | Nombre | Imagen | Descripción)
//    - "Ventas"     (columnas: ID | Fecha | ProductoIDs | Títulos | Total | Origen | MétodoPago | Notas | Comprador)
//
// 2. En Google Cloud Console (https://console.cloud.google.com):
//    - Crear un proyecto nuevo (o usar uno existente)
//    - Habilitar la API "Google Sheets API"
//    - Crear una API Key en Credenciales
//    - Restringir la key a "Google Sheets API" y a tu dominio (si tienes uno)
//
// 3. En Google Apps Script (https://script.google.com):
//    - Crear un proyecto nuevo vinculado a tu hoja
//    - Copiar el contenido de google-apps-script/Code.gs
//    - Publicar como "Web App" (acceso: "Cualquiera")
//    - Copiar la URL del despliegue
//
// 4. Reemplazar los valores de abajo con los tuyos:
//    - SHEET_ID:        El ID de tu Google Sheet (está en la URL entre /d/ y /edit)
//    - API_KEY:         Tu API Key de Google Cloud
//    - APPS_SCRIPT_URL: La URL de tu Apps Script desplegado
//    - WHATSAPP_NUMBER: Tu número de WhatsApp con código de país (sin +)
//    - ADMIN_PASSWORD_HASH: Hash SHA-256 de tu contraseña de admin
//

const CONFIG = {
  // Google Sheets
  SHEET_ID: '1RX_C0ZNMiKRdgG_JB0jCtlm-9PXuv8b5pGKnl2cwExA',
  API_KEY: 'AIzaSyBEzPwwzxyCDWoHJFKrhJYn600yZopefCk',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzRKXJgaRXI_MUhUmzGTEsZW4W6UD0YCjSgT2La0CRMrrjrvEj_d90y8pTXZ5jR2nVr/exec',

  // Rangos de cada hoja
  RANGES: {
    INVENTARIO: 'Inventario!A:K',
    CATEGORIAS: 'Categorías!A:D',
    VENTAS: 'Ventas!A:I'
  },

  // Columnas esperadas en cada hoja:
  // Inventario: ID | Título | DescripciónCorta | DescripciónLarga | Precio | PrecioAnterior | Categoría | Tags | Imágenes | Estado | FechaPublicación
  // Categorías: ID | Nombre | Imagen | Descripción
  // Ventas: ID | Fecha | ProductoIDs | Títulos | Total | Origen | MétodoPago | Notas | Comprador

  // WhatsApp del vendedor (con código de país, sin +)
  WHATSAPP_NUMBER: '521234567890',

  // Admin password (hash SHA-256 de la contraseña)
  // Para generar: en consola del navegador ejecutar:
  // crypto.subtle.digest('SHA-256', new TextEncoder().encode('tu_password')).then(h => console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,'0')).join('')))
  ADMIN_PASSWORD_HASH: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // "password"

  // Caché TTL en milisegundos (5 minutos)
  CACHE_TTL: 5 * 60 * 1000,

  // Nombre del sitio
  SITE_NAME: 'Garage Sale',
  SITE_DESCRIPTION: 'Las mejores ofertas en artículos de segunda mano',

  // Moneda
  CURRENCY: 'MXN',
  CURRENCY_SYMBOL: '$',

  // Idioma por defecto
  DEFAULT_LANG: 'es'
};

// Validación: avisar si el SHEET_ID no ha sido configurado
(() => {
  if (CONFIG.SHEET_ID === 'TU_SHEET_ID_AQUI') {
    console.error(
      '%c⚠ CONFIGURACIÓN PENDIENTE %c\n' +
      'El SHEET_ID no ha sido configurado.\n' +
      'Abre config.js y reemplaza "TU_SHEET_ID_AQUI" con el ID de tu Google Sheet.\n' +
      'El ID se encuentra en la URL de tu hoja: https://docs.google.com/spreadsheets/d/[ESTE_ES_TU_ID]/edit',
      'background:#dc2626;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold;',
      'color:#dc2626;'
    );
    document.addEventListener('DOMContentLoaded', () => {
      const banner = document.createElement('div');
      banner.id = 'config-warning-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#dc2626;color:#fff;padding:12px 16px;text-align:center;font-family:system-ui,sans-serif;font-size:14px;';
      banner.innerHTML = '<strong>⚠ Configuración pendiente:</strong> Abre <code style="background:rgba(0,0,0,.2);padding:2px 6px;border-radius:4px;">config.js</code> y reemplaza <code style="background:rgba(0,0,0,.2);padding:2px 6px;border-radius:4px;">TU_SHEET_ID_AQUI</code> con el ID de tu Google Sheet.';
      document.body.prepend(banner);
    });
  }
})();
