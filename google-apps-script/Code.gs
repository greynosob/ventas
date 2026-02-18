// ============================================================
// Code.gs — Google Apps Script Web App
// ============================================================
//
// SETUP:
// 1. Project Settings > Script Properties — configurar:
//    API_TOKEN            — Token compartido con el frontend (64 hex chars)
//    SHEET_ID             — ID del Google Sheet
//    ADMIN_PASSWORD_HASH  — Hash PBKDF2 de la contraseña admin (nunca va a git)
//    ADMIN_PASSWORD_SALT  — Salt PBKDF2 en hex (igual que ADMIN_PASSWORD_SALT de GitHub Secrets)
//
// 2. Deploy > New deployment > Web app
//    Execute as: Me | Who has access: Anyone
//
// 3. Triggers > Add Trigger:
//    Function: cleanupExpiredSessions | Time-driven > Every 6 hours
//

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

// ========================
// Autenticación — Token
// ========================

/**
 * Validación de token compartido en tiempo constante (anti-timing attack)
 */
function validateToken(token) {
  const stored = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (!stored || !token || stored.length !== token.length) return false;
  let r = 0;
  for (let i = 0; i < stored.length; i++) r |= stored.charCodeAt(i) ^ token.charCodeAt(i);
  return r === 0;
}

/**
 * Comparación en tiempo constante de dos strings
 */
function constantTimeEquals(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ========================
// Request handlers
// ========================

/**
 * GET: lectura de rangos (requiere token)
 * ?token=...&range=Inventario!A:K
 */
function doGet(e) {
  try {
    const token = e && e.parameter && e.parameter.token;
    if (!validateToken(token)) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }

    const range = e.parameter.range;
    if (!range) {
      return jsonResponse({ success: true, message: 'Garage Sale API activa', timestamp: new Date().toISOString() });
    }

    const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    const ss = SpreadsheetApp.openById(sheetId);
    const values = ss.getRange(range).getValues();

    const filtered = values.filter(function(row) {
      return row.some(function(cell) { return cell !== ''; });
    });

    return jsonResponse({ success: true, values: filtered });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

/**
 * POST: escritura y acciones admin (requiere token)
 * { token, action, ...payload }
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!validateToken(data.token)) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }

    switch (data.action) {
      case 'adminLogin':
        return jsonResponse({ success: true, data: handleAdminLogin(data) });
      case 'adminLogout':
        return jsonResponse({ success: true, data: handleAdminLogout(data) });
      case 'registerSale':
        return jsonResponse({ success: true, data: handleAdminWrite(data, function() { return registerSale(data); }) });
      case 'markSold':
        return jsonResponse({ success: true, data: handleAdminWrite(data, function() { return markSold(data.productIds); }) });
      default:
        return jsonResponse({ success: false, error: 'Acción no reconocida: ' + data.action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ========================
// Sesiones Admin
// ========================

/**
 * Verifica hash de contraseña, crea sesión server-side
 */
function handleAdminLogin(data) {
  const props = PropertiesService.getScriptProperties();
  const storedHash = props.getProperty('ADMIN_PASSWORD_HASH');

  if (!constantTimeEquals(storedHash, data.passwordHash || '')) {
    Utilities.sleep(500); // penalización anti-fuerza bruta
    throw new Error('Credenciales inválidas');
  }

  const sessionToken = Utilities.getUuid();
  props.setProperty(
    'session_' + sessionToken,
    JSON.stringify({ expiry: Date.now() + SESSION_TTL_MS })
  );

  return {
    sessionToken: sessionToken,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
  };
}

/**
 * Invalida la sesión en el servidor
 */
function handleAdminLogout(data) {
  if (data.sessionToken) {
    PropertiesService.getScriptProperties().deleteProperty('session_' + data.sessionToken);
  }
  return { loggedOut: true };
}

/**
 * Valida que la sesión exista y no haya expirado
 */
function validateAdminSession(sessionToken) {
  if (!sessionToken) return false;
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('session_' + sessionToken);
  if (!raw) return false;
  const session = JSON.parse(raw);
  if (Date.now() > session.expiry) {
    props.deleteProperty('session_' + sessionToken);
    return false;
  }
  return true;
}

/**
 * Wrapper: valida sesión antes de ejecutar operación de escritura
 */
function handleAdminWrite(data, operation) {
  if (!validateAdminSession(data.sessionToken)) {
    throw new Error('Sesión inválida o expirada');
  }
  return operation();
}

/**
 * Limpia sesiones expiradas — configurar como trigger cada 6 horas
 */
function cleanupExpiredSessions() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all)
    .filter(function(k) { return k.startsWith('session_'); })
    .forEach(function(k) {
      try {
        if (Date.now() > JSON.parse(all[k]).expiry) props.deleteProperty(k);
      } catch (e) {
        props.deleteProperty(k);
      }
    });
}

// ========================
// Operaciones de datos
// ========================

/**
 * Registra una venta en la hoja "Ventas"
 */
function registerSale(data) {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Ventas');

  if (!sheet) throw new Error('Hoja "Ventas" no encontrada');

  const lastRow = sheet.getLastRow();
  const id = 'V' + String(lastRow).padStart(4, '0');
  const fecha = Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm:ss');

  sheet.appendRow([
    id,
    fecha,
    data.productIds || '',
    data.titles || '',
    data.total || 0,
    data.origin || '',
    data.paymentMethod || '',
    data.notes || '',
    data.buyer || ''
  ]);

  if (data.productIds) {
    const ids = data.productIds.split(',').map(function(s) { return s.trim(); });
    markSold(ids);
  }

  return { id: id, fecha: fecha };
}

/**
 * Marca productos como "Vendido" en la hoja "Inventario"
 */
function markSold(productIds) {
  if (!productIds || productIds.length === 0) return { updated: 0 };

  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Inventario');

  if (!sheet) throw new Error('Hoja "Inventario" no encontrada');

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('ID');
  const statusCol = headers.indexOf('Estado');

  if (idCol === -1 || statusCol === -1) {
    throw new Error('Columnas "ID" o "Estado" no encontradas en Inventario');
  }

  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    if (productIds.indexOf(String(data[i][idCol])) !== -1) {
      sheet.getRange(i + 1, statusCol + 1).setValue('Vendido');
      updated++;
    }
  }

  return { updated: updated };
}

// ========================
// Helper
// ========================

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
