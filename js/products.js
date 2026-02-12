// ============================================================
// products.js — Lógica de productos.html + modal de detalle
// ============================================================

const Products = (() => {
  let allProducts = [];
  let currentModalIndex = 0; // Índice de imagen actual en galería

  async function init() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    App.showLoading(container, 8);

    try {
      allProducts = await SheetsAPI.getAvailableProducts();

      // Leer filtros de URL
      const params = new URLSearchParams(window.location.search);
      const catFilter = params.get('cat');
      const offersFilter = params.get('ofertas') === 'true';
      const productId = params.get('id');

      // Construir filtros de categoría
      await buildCategoryFilter(catFilter);

      // Filtrar productos
      let filtered = allProducts;
      if (catFilter) {
        filtered = filtered.filter(p => p.category === catFilter);
        updatePageTitle(catFilter);
      }
      if (offersFilter) {
        filtered = filtered.filter(p => SheetsAPI.isOnSale(p));
        updatePageTitle(I18n.t('products.onSale'));
      }

      renderProducts(filtered, container);

      // Si hay un ID en la URL, abrir modal
      if (productId) {
        const product = allProducts.find(p => p.id === productId);
        if (product) openModal(product);
      }
    } catch (err) {
      console.error('[products] Error:', err);
      App.showError(container, I18n.t('common.error'));
    }
  }

  /**
   * Construye el filtro de categorías
   */
  async function buildCategoryFilter(activeCat) {
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    try {
      const categories = await SheetsAPI.getCategories();

      filterContainer.innerHTML = `
        <a href="productos.html"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors ${!activeCat ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-teal-500'}">
          ${I18n.t('products.all')}
        </a>
        <a href="productos.html?ofertas=true"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors ${new URLSearchParams(window.location.search).get('ofertas') === 'true' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-orange-500'}">
          <span class="flex items-center gap-1">
            <i data-lucide="flame" class="w-3.5 h-3.5"></i>
            ${I18n.t('products.onSale')}
          </span>
        </a>
        ${categories.map(cat => `
          <a href="productos.html?cat=${encodeURIComponent(cat.name)}"
            class="px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCat === cat.name ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-teal-500'}">
            ${cat.name}
          </a>
        `).join('')}
      `;

      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
      console.warn('[products] No se pudieron cargar filtros:', err.message);
    }
  }

  /**
   * Actualiza el título de la página según el filtro
   */
  function updatePageTitle(filterName) {
    const title = document.getElementById('products-title');
    if (title) title.textContent = filterName;
  }

  /**
   * Renderiza el grid de productos
   */
  function renderProducts(products, container) {
    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i data-lucide="package-open" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"></i>
          <p class="text-gray-500 dark:text-gray-400">${I18n.t('products.noProducts')}</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = products.map((product, i) => {
      const isOffer = SheetsAPI.isOnSale(product);
      const isSold = product.status === 'Vendido';

      return `
        <div class="product-card bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in ${isSold ? 'opacity-60' : ''}"
          style="animation-delay: ${i * 50}ms"
          ${!isSold ? `onclick="Products.openModal(Products.getProductById('${product.id}'))"` : ''}>
          <div class="relative cursor-pointer">
            <img src="${SheetsAPI.getMainImage(product)}" alt="${product.title}"
              class="w-full h-48 object-cover" loading="lazy"
              onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Sin+imagen'">
            ${isOffer ? `
              <span class="discount-badge absolute top-2 right-2">
                -${SheetsAPI.discountPercent(product)}% OFF
              </span>
            ` : ''}
            ${isSold ? `
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span class="bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-lg rotate-[-12deg]">${I18n.t('products.sold')}</span>
              </div>
            ` : ''}
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">${product.title}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">${product.shortDesc}</p>
            <div class="flex items-center justify-between mt-3">
              <div class="flex items-center gap-2">
                <span class="text-teal-600 dark:text-teal-400 font-bold">${App.formatPrice(product.price)}</span>
                ${isOffer ? `<span class="text-gray-400 line-through text-xs">${App.formatPrice(product.oldPrice)}</span>` : ''}
              </div>
              ${!isSold ? `
                <button onclick="event.stopPropagation(); Products.addToCartFromGrid('${product.id}')"
                  class="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                  title="${I18n.t('products.addToCart')}">
                  <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /**
   * Obtiene un producto por ID del array cargado
   */
  function getProductById(id) {
    return allProducts.find(p => p.id === id) || null;
  }

  /**
   * Agrega al carrito desde el grid (sin abrir modal)
   */
  function addToCartFromGrid(productId) {
    const product = getProductById(productId);
    if (!product) return;

    Cart.addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: SheetsAPI.getMainImage(product)
    });

    App.showToast(`${product.title} agregado al carrito`);
  }

  /**
   * Abre el modal de detalle del producto
   */
  function openModal(product) {
    if (!product) return;
    currentModalIndex = 0;

    const modal = document.getElementById('product-modal');
    if (!modal) return;

    const images = product.images.length > 0 ? product.images : [SheetsAPI.getMainImage(product)];
    const isOffer = SheetsAPI.isOnSale(product);
    const tags = product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/60 z-50 animate-fade-overlay" onclick="Products.closeModal()">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up" onclick="event.stopPropagation()">
            <!-- Close button -->
            <div class="flex justify-end p-4 pb-0">
              <button onclick="Products.closeModal()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <div class="md:flex">
              <!-- Image gallery -->
              <div class="md:w-1/2 p-4">
                <div class="relative">
                  <img id="modal-main-image" src="${images[0]}" alt="${product.title}"
                    class="w-full h-64 md:h-80 object-cover rounded-lg"
                    onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Sin+imagen'">
                  ${images.length > 1 ? `
                    <button onclick="Products.prevImage()" class="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 shadow hover:bg-white dark:hover:bg-slate-700">
                      <i data-lucide="chevron-left" class="w-5 h-5"></i>
                    </button>
                    <button onclick="Products.nextImage()" class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 shadow hover:bg-white dark:hover:bg-slate-700">
                      <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    </button>
                  ` : ''}
                </div>
                ${images.length > 1 ? `
                  <div class="flex gap-2 mt-3 overflow-x-auto pb-2" id="modal-thumbnails">
                    ${images.map((img, i) => `
                      <img src="${img}" alt="Thumbnail ${i + 1}"
                        class="w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${i === 0 ? 'thumbnail-active border-teal-500' : 'border-transparent opacity-60 hover:opacity-100'}"
                        onclick="Products.goToImage(${i})"
                        onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=${i + 1}'">
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- Product info -->
              <div class="md:w-1/2 p-4 md:pl-2">
                <div class="mb-2">
                  <span class="text-xs text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-full">
                    ${product.category}
                  </span>
                </div>
                <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">${product.title}</h2>

                <div class="flex items-center gap-3 mb-4">
                  <span class="text-2xl font-bold text-teal-600 dark:text-teal-400">${App.formatPrice(product.price)}</span>
                  ${isOffer ? `
                    <span class="text-gray-400 line-through">${App.formatPrice(product.oldPrice)}</span>
                    <span class="discount-badge">-${SheetsAPI.discountPercent(product)}%</span>
                  ` : ''}
                </div>

                <div class="mb-4">
                  <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">${I18n.t('products.description')}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">${product.longDesc || product.shortDesc}</p>
                </div>

                ${tags.length > 0 ? `
                  <div class="mb-4">
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">${I18n.t('products.tags')}</h4>
                    <div class="flex flex-wrap gap-2">
                      ${tags.map(tag => `
                        <span class="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">${tag}</span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <button onclick="Products.addToCartFromModal('${product.id}')"
                  id="modal-add-btn"
                  class="w-full mt-4 py-3 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
                  <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                  <span>${I18n.t('products.addToCart')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Keyboard listener
    document.addEventListener('keydown', handleModalKeydown);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Guardar imágenes en data attribute para navegación
    modal.dataset.images = JSON.stringify(images);
    modal.dataset.productId = product.id;
  }

  function handleModalKeydown(e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  }

  /**
   * Cierra el modal
   */
  function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.innerHTML = '';
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleModalKeydown);
  }

  /**
   * Navegación de imágenes en el modal
   */
  function getModalImages() {
    const modal = document.getElementById('product-modal');
    if (!modal || !modal.dataset.images) return [];
    return JSON.parse(modal.dataset.images);
  }

  function goToImage(index) {
    const images = getModalImages();
    if (index < 0 || index >= images.length) return;
    currentModalIndex = index;

    const mainImg = document.getElementById('modal-main-image');
    if (mainImg) mainImg.src = images[index];

    // Actualizar thumbnails
    const thumbnails = document.querySelectorAll('#modal-thumbnails img');
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add('thumbnail-active', 'border-teal-500');
        thumb.classList.remove('border-transparent', 'opacity-60');
      } else {
        thumb.classList.remove('thumbnail-active', 'border-teal-500');
        thumb.classList.add('border-transparent', 'opacity-60');
      }
    });
  }

  function prevImage() {
    const images = getModalImages();
    currentModalIndex = (currentModalIndex - 1 + images.length) % images.length;
    goToImage(currentModalIndex);
  }

  function nextImage() {
    const images = getModalImages();
    currentModalIndex = (currentModalIndex + 1) % images.length;
    goToImage(currentModalIndex);
  }

  /**
   * Agrega al carrito desde el modal
   */
  function addToCartFromModal(productId) {
    const product = getProductById(productId);
    if (!product) return;

    Cart.addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: SheetsAPI.getMainImage(product)
    });

    const btn = document.getElementById('modal-add-btn');
    if (btn) {
      btn.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i><span>${I18n.t('products.added')}</span>`;
      btn.classList.remove('bg-teal-600', 'hover:bg-teal-700');
      btn.classList.add('bg-green-500');
      if (typeof lucide !== 'undefined') lucide.createIcons();

      setTimeout(() => {
        btn.innerHTML = `<i data-lucide="shopping-cart" class="w-5 h-5"></i><span>${I18n.t('products.addToCart')}</span>`;
        btn.classList.add('bg-teal-600', 'hover:bg-teal-700');
        btn.classList.remove('bg-green-500');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }, 1500);
    }

    App.showToast(`${product.title} agregado al carrito`);
  }

  return { init, openModal, closeModal, getProductById, addToCartFromGrid, addToCartFromModal, prevImage, nextImage, goToImage };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-page')) {
    Products.init();
  }
});
