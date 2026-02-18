// ============================================================
// app.js — Inicializador global (todas las páginas)
// ============================================================

const App = (() => {
  /**
   * Inicializa todos los componentes globales
   */
  async function init() {
    await I18n.load(CONFIG.DEFAULT_LANG);
    renderNavbar();
    initThemeToggle();
    updateCartBadge();
    window.addEventListener('cart-updated', updateCartBadge);
    loadCategoryDropdown();

    // Año dinámico en el footer
    document.querySelectorAll('footer p').forEach(p => {
      p.innerHTML = p.innerHTML.replace(/&copy;\s*\d{4}/, `&copy; ${new Date().getFullYear()}`);
    });

    // Inicializar Lucide icons después de renderizar
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Señal para módulos de página que dependen de i18n (ej. CartPage)
    window.dispatchEvent(new CustomEvent('app-ready'));
  }

  /**
   * Renderiza la navbar responsive
   */
  function renderNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    nav.innerHTML = `
      <div class="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-slate-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <a href="index.html" class="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xl">
              <i data-lucide="store" class="w-6 h-6"></i>
              <span>${CONFIG.SITE_NAME}</span>
            </a>

            <!-- Desktop menu -->
            <div class="hidden md:flex items-center gap-1">
              <a href="index.html" class="nav-link ${currentPage === 'index.html' ? 'active' : ''}" data-i18n="nav.home">Inicio</a>
              <div class="relative group" id="nav-categories-dropdown">
                <a href="categorias.html" class="nav-link ${currentPage === 'categorias.html' ? 'active' : ''} flex items-center gap-1" data-i18n="nav.categories">
                  Categorías
                </a>
                <div class="absolute top-full left-0 mt-0 pt-2 hidden group-hover:block z-50">
                  <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-2 min-w-48" id="categories-dropdown-list">
                  </div>
                </div>
              </div>
              <a href="productos.html" class="nav-link ${currentPage === 'productos.html' ? 'active' : ''}" data-i18n="nav.products">Productos</a>
              <a href="carrito.html" class="nav-link ${currentPage === 'carrito.html' ? 'active' : ''} relative flex items-center gap-1">
                <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                <span data-i18n="nav.cart">Carrito</span>
                <span id="cart-badge" class="absolute -top-1 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
              </a>
            </div>

            <!-- Search + Theme + Mobile toggle -->
            <div class="flex items-center gap-2">
              <!-- Search bar -->
              <div class="relative" id="search-container">
                <div class="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-1.5">
                  <i data-lucide="search" class="w-4 h-4 text-gray-400 dark:text-slate-400"></i>
                  <input type="text" id="search-input"
                    class="bg-transparent border-none outline-none ml-2 text-sm w-32 sm:w-48 text-gray-800 dark:text-gray-200"
                    data-i18n="nav.search" placeholder="Buscar productos...">
                </div>
                <div id="search-results" class="search-dropdown absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 hidden z-50">
                </div>
              </div>

              <!-- Theme toggle -->
              <button id="theme-toggle" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                data-i18n-title="nav.darkMode">
                <i data-lucide="sun" class="w-5 h-5 hidden dark:block"></i>
                <i data-lucide="moon" class="w-5 h-5 block dark:hidden"></i>
              </button>

              <!-- Mobile menu toggle -->
              <button id="mobile-toggle" class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300">
                <i data-lucide="menu" class="w-5 h-5" id="menu-icon-open"></i>
                <i data-lucide="x" class="w-5 h-5 hidden" id="menu-icon-close"></i>
              </button>
            </div>
          </div>

          <!-- Mobile menu -->
          <div id="mobile-menu" class="md:hidden hidden pb-4 border-t border-gray-200 dark:border-slate-700 mt-2 pt-2">
            <a href="index.html" class="mobile-nav-link ${currentPage === 'index.html' ? 'active' : ''}" data-i18n="nav.home">Inicio</a>
            <a href="categorias.html" class="mobile-nav-link ${currentPage === 'categorias.html' ? 'active' : ''}" data-i18n="nav.categories">Categorías</a>
            <a href="productos.html" class="mobile-nav-link ${currentPage === 'productos.html' ? 'active' : ''}" data-i18n="nav.products">Productos</a>
            <a href="carrito.html" class="mobile-nav-link ${currentPage === 'carrito.html' ? 'active' : ''} flex items-center gap-2">
              <i data-lucide="shopping-cart" class="w-4 h-4"></i>
              <span data-i18n="nav.cart">Carrito</span>
              <span id="cart-badge-mobile" class="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
            </a>
            <div id="mobile-categories-list" class="ml-4 mt-1 space-y-1"></div>
          </div>
        </div>
      </div>
    `;

    // Mobile toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOpen = document.getElementById('menu-icon-open');
    const menuClose = document.getElementById('menu-icon-close');

    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        menuOpen.classList.toggle('hidden');
        menuClose.classList.toggle('hidden');
      });
    }

    // Estilos de los nav links
    const style = document.createElement('style');
    style.textContent = `
      .nav-link {
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #475569;
        transition: all 0.2s;
      }
      .dark .nav-link { color: #cbd5e1; }
      .nav-link:hover { background-color: #f1f5f9; color: #0d9488; }
      .dark .nav-link:hover { background-color: #334155; color: #14b8a6; }
      .nav-link.active { color: #0d9488; background-color: #f0fdfa; }
      .dark .nav-link.active { color: #14b8a6; background-color: #134e4a33; }
      .mobile-nav-link {
        display: block;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #475569;
      }
      .dark .mobile-nav-link { color: #cbd5e1; }
      .mobile-nav-link:hover { background-color: #f1f5f9; color: #0d9488; }
      .dark .mobile-nav-link:hover { background-color: #334155; color: #14b8a6; }
      .mobile-nav-link.active { color: #0d9488; background-color: #f0fdfa; }
      .dark .mobile-nav-link.active { color: #14b8a6; background-color: #134e4a33; }
    `;
    document.head.appendChild(style);

    // Re-init Lucide after rendering navbar
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Inicializa el toggle de dark/light mode
   */
  function initThemeToggle() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      });
    }
  }

  /**
   * Actualiza el badge del carrito en la navbar
   */
  function updateCartBadge() {
    const count = Cart.getCount();
    const badges = [document.getElementById('cart-badge'), document.getElementById('cart-badge-mobile')];
    badges.forEach(badge => {
      if (!badge) return;
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('hidden');
        badge.classList.add('cart-pulse');
        setTimeout(() => badge.classList.remove('cart-pulse'), 300);
      } else {
        badge.classList.add('hidden');
      }
    });
  }

  /**
   * Carga categorías dinámicamente en el dropdown de la navbar
   */
  async function loadCategoryDropdown() {
    try {
      const categories = await SheetsAPI.getCategories();
      const dropdownList = document.getElementById('categories-dropdown-list');
      const mobileList = document.getElementById('mobile-categories-list');

      if (dropdownList) {
        dropdownList.innerHTML = categories.map(cat => `
          <a href="productos.html?cat=${encodeURIComponent(cat.name)}"
            class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
            ${cat.name}
          </a>
        `).join('');
      }

      if (mobileList) {
        mobileList.innerHTML = categories.map(cat => `
          <a href="productos.html?cat=${encodeURIComponent(cat.name)}"
            class="block px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
            ${cat.name}
          </a>
        `).join('');
      }
    } catch (err) {
      console.warn('[app] No se pudieron cargar las categorías:', err.message);
    }
  }

  /**
   * Muestra un toast de notificación
   */
  function showToast(message, type = 'success') {
    // Eliminar toast existente
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const colors = {
      success: 'bg-teal-600',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${colors[type] || colors.success} text-white px-6 py-3 rounded-lg shadow-lg font-medium text-sm`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Formatea precio con símbolo de moneda
   */
  function formatPrice(amount) {
    return `${CONFIG.CURRENCY_SYMBOL}${parseFloat(amount).toFixed(2)} ${CONFIG.CURRENCY}`;
  }

  /**
   * Muestra estado de carga (skeleton)
   */
  function showLoading(container, count = 6) {
    if (!container) return;
    container.innerHTML = Array(count).fill('').map(() => `
      <div class="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div class="skeleton h-48 w-full"></div>
        <div class="p-4 space-y-3">
          <div class="skeleton h-4 w-3/4 rounded"></div>
          <div class="skeleton h-3 w-1/2 rounded"></div>
          <div class="skeleton h-8 w-1/3 rounded"></div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Muestra estado de error
   */
  function showError(container, message) {
    if (!container) return;
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-4"></i>
        <p class="text-gray-500 dark:text-gray-400 mb-4">${message || I18n.t('common.error')}</p>
        <button onclick="location.reload()" class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          ${I18n.t('common.retry')}
        </button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  return { init, showToast, formatPrice, showLoading, showError, updateCartBadge };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => App.init());
