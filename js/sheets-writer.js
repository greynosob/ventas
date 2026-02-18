// ============================================================
// sheets-writer.js — Escritura vía Google Apps Script Web App
// ============================================================

const SheetsWriter = (() => {
  /**
   * Envía un POST al Apps Script incluyendo token de API y token de sesión admin
   */
  async function _post(data) {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script requiere text/plain para evitar preflight CORS
      body: JSON.stringify({
        ...data,
        token: CONFIG.API_TOKEN,
        sessionToken: sessionStorage.getItem('admin-session-token')
      })
    });

    if (!res.ok) {
      throw new Error(`Apps Script error: ${res.status}`);
    }

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.error || 'Error desconocido');
    }

    return result.data;
  }

  /**
   * Registra una venta
   * @param {Object} saleData - { productIds, titles, total, origin, paymentMethod, notes, buyer }
   */
  async function registerSale(saleData) {
    const result = await _post({
      action: 'registerSale',
      ...saleData
    });

    // Invalidar caché para que los datos se refresquen
    SheetsAPI.invalidateCache();

    return result;
  }

  /**
   * Marca productos como vendidos
   * @param {string[]} productIds - Array de IDs de productos
   */
  async function markAsSold(productIds) {
    const result = await _post({
      action: 'markSold',
      productIds: productIds
    });

    SheetsAPI.invalidateCache();

    return result;
  }

  return { registerSale, markAsSold };
})();
