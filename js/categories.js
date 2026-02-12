// ============================================================
// categories.js — Lógica de categorias.html
// ============================================================

const Categories = (() => {
  async function init() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    App.showLoading(container, 6);

    try {
      const [categories, products] = await Promise.all([
        SheetsAPI.getCategories(),
        SheetsAPI.getAvailableProducts()
      ]);

      if (categories.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i data-lucide="folder-open" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"></i>
            <p class="text-gray-500 dark:text-gray-400">No hay categorías disponibles</p>
          </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
      }

      container.innerHTML = categories.map(cat => {
        const catProducts = products.filter(p => p.category === cat.name);
        const totalProducts = catProducts.length;
        const offersCount = catProducts.filter(p => SheetsAPI.isOnSale(p)).length;

        return `
          <a href="productos.html?cat=${encodeURIComponent(cat.name)}"
            class="product-card bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 group cursor-pointer animate-fade-in">
            <div class="relative h-48 overflow-hidden">
              <img src="${cat.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=' + encodeURIComponent(cat.name)}"
                alt="${cat.name}"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(cat.name)}'">
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

              <!-- Badges -->
              <div class="absolute top-3 right-3 flex flex-col gap-2">
                <span class="bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  ${totalProducts} ${I18n.t('categories.products')}
                </span>
                ${offersCount > 0 ? `
                  <span class="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    ${offersCount} ${I18n.t('categories.offers')}
                  </span>
                ` : ''}
              </div>

              <!-- Name -->
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <h3 class="text-white font-bold text-lg">${cat.name}</h3>
                ${cat.description ? `<p class="text-white/80 text-sm mt-1 line-clamp-2">${cat.description}</p>` : ''}
              </div>
            </div>
          </a>
        `;
      }).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
      console.error('[categories] Error:', err);
      App.showError(container, I18n.t('common.error'));
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('categories-page')) {
    Categories.init();
  }
});
