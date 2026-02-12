// ============================================================
// sheets-api.js — Lectura de datos de Google Sheets con caché
// ============================================================

const SheetsAPI = (() => {
  // Caché en memoria: { key: { data, timestamp } }
  const cache = {};

  /**
   * Fetch genérico a Google Sheets API con caché
   */
  async function _fetch(range) {
    const cacheKey = range;
    const cached = cache[cacheKey];

    if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_TTL) {
      return cached.data;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(range)}?key=${CONFIG.API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Google Sheets API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const rows = json.values || [];

    if (rows.length < 2) return [];

    // Primera fila = headers, resto = datos
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * Invalida la caché de un rango específico o toda
   */
  function invalidateCache(range) {
    if (range) {
      delete cache[range];
    } else {
      Object.keys(cache).forEach(k => delete cache[k]);
    }
  }

  /**
   * Obtiene todos los productos del inventario
   */
  async function getProducts() {
    const data = await _fetch(CONFIG.RANGES.INVENTARIO);
    return data.map(row => ({
      id: row['ID'] || '',
      title: row['Título'] || row['Titulo'] || '',
      shortDesc: row['DescripciónCorta'] || row['DescripcionCorta'] || '',
      longDesc: row['DescripciónLarga'] || row['DescripcionLarga'] || '',
      price: parseFloat(row['Precio']) || 0,
      oldPrice: parseFloat(row['PrecioAnterior']) || 0,
      category: row['Categoría'] || row['Categoria'] || '',
      tags: row['Tags'] || '',
      images: (row['Imágenes'] || row['Imagenes'] || '').split(',').map(s => s.trim()).filter(Boolean),
      status: row['Estado'] || 'Disponible',
      date: row['FechaPublicación'] || row['FechaPublicacion'] || ''
    }));
  }

  /**
   * Obtiene productos disponibles (no vendidos)
   */
  async function getAvailableProducts() {
    const products = await getProducts();
    return products.filter(p => p.status !== 'Vendido');
  }

  /**
   * Obtiene un producto por ID
   */
  async function getProductById(id) {
    const products = await getProducts();
    return products.find(p => p.id === id) || null;
  }

  /**
   * Obtiene todas las categorías
   */
  async function getCategories() {
    const data = await _fetch(CONFIG.RANGES.CATEGORIAS);
    return data.map(row => ({
      id: row['ID'] || '',
      name: row['Nombre'] || '',
      image: row['Imagen'] || '',
      description: row['Descripción'] || row['Descripcion'] || ''
    }));
  }

  /**
   * Obtiene todas las ventas
   */
  async function getSales() {
    const data = await _fetch(CONFIG.RANGES.VENTAS);
    return data.map(row => ({
      id: row['ID'] || '',
      date: row['Fecha'] || '',
      productIds: row['ProductoIDs'] || '',
      titles: row['Títulos'] || row['Titulos'] || '',
      total: parseFloat(row['Total']) || 0,
      origin: row['Origen'] || '',
      paymentMethod: row['MétodoPago'] || row['MetodoPago'] || '',
      notes: row['Notas'] || '',
      buyer: row['Comprador'] || ''
    }));
  }

  /**
   * Verifica si un producto está en oferta
   */
  function isOnSale(product) {
    return product.oldPrice > 0 && product.oldPrice > product.price;
  }

  /**
   * Calcula el porcentaje de descuento
   */
  function discountPercent(product) {
    if (!isOnSale(product)) return 0;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }

  /**
   * Obtiene la primera imagen de un producto o un placeholder
   */
  function getMainImage(product) {
    return product.images[0] || 'https://placehold.co/400x300/e2e8f0/64748b?text=Sin+imagen';
  }

  return {
    getProducts,
    getAvailableProducts,
    getProductById,
    getCategories,
    getSales,
    isOnSale,
    discountPercent,
    getMainImage,
    invalidateCache
  };
})();
