// ============================================================
// home.js — Lógica de index.html (carrusel, ofertas, categorías)
// ============================================================

const Home = (() => {
  async function init() {
    await loadOffers();
    await loadFeaturedCategories();
  }

  /**
   * Carga el carrusel de ofertas
   */
  async function loadOffers() {
    const container = document.getElementById('offers-carousel');
    if (!container) return;

    App.showLoading(container, 4);

    try {
      const products = await SheetsAPI.getAvailableProducts();
      const offers = products
        .filter(p => SheetsAPI.isOnSale(p))
        .sort((a, b) => SheetsAPI.discountPercent(b) - SheetsAPI.discountPercent(a))
        .slice(0, 12);

      if (offers.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center col-span-full py-8">No hay ofertas disponibles</p>';
        return;
      }

      container.innerHTML = offers.map(product => `
        <a href="productos.html?id=${product.id}" class="product-card flex-shrink-0 w-64 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer">
          <div class="relative">
            <img src="${SheetsAPI.getMainImage(product)}" alt="${product.title}"
              class="w-full h-40 object-cover" loading="lazy"
              onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Sin+imagen'">
            <span class="discount-badge absolute top-2 right-2">
              -${SheetsAPI.discountPercent(product)}% OFF
            </span>
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">${product.title}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">${product.shortDesc}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-teal-600 dark:text-teal-400 font-bold">${App.formatPrice(product.price)}</span>
              <span class="text-gray-400 line-through text-xs">${App.formatPrice(product.oldPrice)}</span>
            </div>
          </div>
        </a>
      `).join('');

      initCarouselControls();
    } catch (err) {
      console.error('[home] Error cargando ofertas:', err);
      container.innerHTML = '<p class="text-red-400 text-center col-span-full py-8">Error al cargar ofertas</p>';
    }
  }

  /**
   * Inicializa controles del carrusel (prev/next)
   */
  function initCarouselControls() {
    const container = document.getElementById('offers-carousel');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    if (!container || !prevBtn || !nextBtn) return;

    const scrollAmount = 280;

    prevBtn.addEventListener('click', () => {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  /**
   * Carga categorías destacadas
   */
  async function loadFeaturedCategories() {
    const container = document.getElementById('featured-categories');
    if (!container) return;

    try {
      const categories = await SheetsAPI.getCategories();
      const products = await SheetsAPI.getAvailableProducts();

      const featured = categories.slice(0, 6);

      container.innerHTML = featured.map(cat => {
        const count = products.filter(p => p.category === cat.name).length;
        return `
          <a href="productos.html?cat=${encodeURIComponent(cat.name)}"
            class="product-card bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 group cursor-pointer">
            <div class="relative h-36 overflow-hidden">
              <img src="${cat.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=' + encodeURIComponent(cat.name)}"
                alt="${cat.name}"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(cat.name)}'">
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div class="absolute bottom-0 left-0 right-0 p-3">
                <h3 class="text-white font-semibold text-sm">${cat.name}</h3>
                <p class="text-white/80 text-xs">${count} ${I18n.t('categories.products')}</p>
              </div>
            </div>
          </a>
        `;
      }).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
      console.error('[home] Error cargando categorías:', err);
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  // Solo ejecutar en index.html
  if (document.getElementById('home-page')) {
    Home.init();
  }
});
