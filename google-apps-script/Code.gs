// ============================================================
// Code.gs — Google Apps Script Web App (Proxy de lectura y escritura)
// ============================================================
//
// INSTRUCCIONES DE SETUP:
// 1. Abrir Google Apps Script: https://script.google.com
// 2. Crear un nuevo proyecto
// 3. Pegar este código en Code.gs
// 4. Reemplazar SPREADSHEET_ID con el ID de tu Google Sheet
// 5. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copiar la URL del deployment y pegarla en config.js como APPS_SCRIPT_URL
//
// ESTRUCTURA DE LA HOJA "Ventas":
// Columnas: ID | Fecha | ProductoIDs | Títulos | Total | Origen | MétodoPago | Notas | Comprador
//
// ESTRUCTURA DE LA HOJA "Inventario":
// Columnas: ID | Título | DescripciónCorta | DescripciónLarga | Precio | PrecioAnterior | Categoría | Tags | Imágenes | Estado | FechaPublicación
//

const SPREADSHEET_ID = '1RX_C0ZNMiKRdgG_JB0jCtlm-9PXuv8b5pGKnl2cwExA'; // ← Reemplazar con tu Sheet ID

/**
 * Maneja peticiones POST
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'registerSale':
        result = registerSale(data);
        break;
      case 'markSold':
        result = markSold(data.productIds);
        break;
      default:
        return jsonResponse({ success: false, error: 'Acción no reconocida: ' + data.action }, 400);
    }

    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

/**
 * Maneja peticiones GET (lectura de datos)
 * Parámetro ?range=Inventario!A:K (o Categorías!A:D, Ventas!A:I)
 */
function doGet(e) {
  try {
    var range = e && e.parameter && e.parameter.range;
    if (!range) {
      return jsonResponse({ success: true, message: 'Garage Sale API activa', timestamp: new Date().toISOString() });
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var values = ss.getRange(range).getValues();

    // Filtrar filas completamente vacías
    var filtered = values.filter(function(row) {
      return row.some(function(cell) { return cell !== ''; });
    });

    return jsonResponse({ success: true, values: filtered });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

/**
 * Registra una venta en la hoja "Ventas"
 */
function registerSale(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Ventas');

  if (!sheet) throw new Error('Hoja "Ventas" no encontrada');

  // Generar ID único
  const lastRow = sheet.getLastRow();
  const id = 'V' + String(lastRow).padStart(4, '0');

  // Fecha actual
  const fecha = Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm:ss');

  // Agregar fila
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

  // Si hay IDs de productos, marcarlos como vendidos
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

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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

/**
 * Construye respuesta JSON con headers CORS
 */
function jsonResponse(data, code) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
