// ============================================================
// search.js — Búsqueda en tiempo real con highlight
// ============================================================

const Search = (() => {
  let debounceTimer = null;
  let cachedProducts = null;

  function init() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) {
        results.classList.add('hidden');
        results.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(() => performSearch(query), 300);
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
      const container = document.getElementById('search-container');
      if (container && !container.contains(e.target)) {
        results.classList.add('hidden');
      }
    });

    // Cerrar con Escape
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        results.classList.add('hidden');
        input.blur();
      }
    });
  }

  /**
   * Realiza la búsqueda
   */
  async function performSearch(query) {
    const results = document.getElementById('search-results');
    if (!results) return;

    try {
      // Cargar productos si no están en caché
      if (!cachedProducts) {
        cachedProducts = await SheetsAPI.getAvailableProducts();
      }

      const q = query.toLowerCase();
      const matches = cachedProducts.filter(p => {
        return (
          p.title.toLowerCase().includes(q) ||
          p.shortDesc.toLowerCase().includes(q) ||
          p.tags.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }).slice(0, 8);

      if (matches.length === 0) {
        results.innerHTML = `
          <div class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            ${I18n.t('search.noResults')}
          </div>
        `;
        results.classList.remove('hidden');
        return;
      }

      results.innerHTML = matches.map(product => {
        const title = highlightText(product.title, query);
        const desc = highlightText(product.shortDesc, query);
        const isOffer = SheetsAPI.isOnSale(product);

        return `
          <a href="productos.html?id=${product.id}"
            class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0">
            <img src="${SheetsAPI.getMainImage(product)}" alt="${product.title}"
              class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=?'">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">${title}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${desc}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="text-sm font-bold text-teal-600 dark:text-teal-400">${App.formatPrice(product.price)}</span>
              ${isOffer ? `<span class="block text-xs text-orange-500 font-medium">-${SheetsAPI.discountPercent(product)}%</span>` : ''}
            </div>
          </a>
        `;
      }).join('');

      results.classList.remove('hidden');
    } catch (err) {
      console.error('[search] Error:', err);
      results.innerHTML = '<div class="p-4 text-center text-sm text-red-400">Error en la búsqueda</div>';
      results.classList.remove('hidden');
    }
  }

  /**
   * Resalta el texto encontrado con <mark>
   */
  function highlightText(text, query) {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Invalida la caché de búsqueda
   */
  function invalidateCache() {
    cachedProducts = null;
  }

  return { init, invalidateCache };
})();

document.addEventListener('DOMContentLoaded', () => Search.init());
