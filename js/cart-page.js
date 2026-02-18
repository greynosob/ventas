// ============================================================
// cart-page.js — Lógica de carrito.html (WhatsApp, email)
// ============================================================

const CartPage = (() => {
  function init() {
    render();
    window.addEventListener('cart-updated', render);
  }

  /**
   * Renderiza el contenido del carrito
   */
  function render() {
    const container = document.getElementById('cart-content');
    if (!container) return;

    const items = Cart.getCart();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16">
          <i data-lucide="shopping-cart" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"></i>
          <h2 class="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">${I18n.t('cart.empty')}</h2>
          <p class="text-gray-400 dark:text-gray-500 mb-6">${I18n.t('cart.emptyMessage')}</p>
          <a href="productos.html"
            class="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            <span>${I18n.t('cart.goToProducts')}</span>
          </a>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const total = Cart.getTotal();

    container.innerHTML = `
      <!-- Desktop table -->
      <div class="hidden md:block table-responsive">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-slate-700">
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">${I18n.t('cart.product')}</th>
              <th class="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">${I18n.t('cart.price')}</th>
              <th class="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">${I18n.t('cart.quantity')}</th>
              <th class="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">${I18n.t('cart.subtotal')}</th>
              <th class="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">${I18n.t('cart.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr class="border-b border-gray-100 dark:border-slate-700/50">
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <img src="${item.image || 'https://placehold.co/80x80/e2e8f0/64748b?text=?'}" alt="${item.title}"
                      class="w-16 h-16 rounded-lg object-cover"
                      onerror="this.src='https://placehold.co/80x80/e2e8f0/64748b?text=?'">
                    <span class="font-medium text-gray-800 dark:text-gray-200">${item.title}</span>
                  </div>
                </td>
                <td class="py-4 px-4 text-center text-gray-600 dark:text-gray-400">${App.formatPrice(item.price)}</td>
                <td class="py-4 px-4">
                  <div class="flex items-center justify-center gap-2">
                    <button onclick="CartPage.changeQty('${item.id}', -1)"
                      class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors">
                      <i data-lucide="minus" class="w-4 h-4"></i>
                    </button>
                    <input type="number" value="${item.quantity}" min="1"
                      onchange="CartPage.setQty('${item.id}', this.value)"
                      class="qty-input w-12 text-center bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg py-1 text-sm">
                    <button onclick="CartPage.changeQty('${item.id}', 1)"
                      class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors">
                      <i data-lucide="plus" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
                <td class="py-4 px-4 text-center font-semibold text-teal-600 dark:text-teal-400">${App.formatPrice(item.price * item.quantity)}</td>
                <td class="py-4 px-4 text-center">
                  <button onclick="CartPage.removeItem('${item.id}')"
                    class="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="${I18n.t('cart.remove')}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden space-y-4">
        ${items.map(item => `
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div class="flex gap-3">
              <img src="${item.image || 'https://placehold.co/80x80/e2e8f0/64748b?text=?'}" alt="${item.title}"
                class="w-20 h-20 rounded-lg object-cover"
                onerror="this.src='https://placehold.co/80x80/e2e8f0/64748b?text=?'">
              <div class="flex-1">
                <h3 class="font-medium text-gray-800 dark:text-gray-200 text-sm">${item.title}</h3>
                <p class="text-teal-600 dark:text-teal-400 font-bold mt-1">${App.formatPrice(item.price)}</p>
                <div class="flex items-center justify-between mt-2">
                  <div class="flex items-center gap-2">
                    <button onclick="CartPage.changeQty('${item.id}', -1)"
                      class="w-7 h-7 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                      <i data-lucide="minus" class="w-3 h-3"></i>
                    </button>
                    <span class="text-sm font-medium w-6 text-center">${item.quantity}</span>
                    <button onclick="CartPage.changeQty('${item.id}', 1)"
                      class="w-7 h-7 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                      <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                  </div>
                  <button onclick="CartPage.removeItem('${item.id}')" class="text-red-400 p-1">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Total + Actions -->
      <div class="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <div class="flex items-center justify-between mb-6">
          <span class="text-lg font-semibold text-gray-800 dark:text-gray-200">${I18n.t('cart.total')}</span>
          <span class="text-2xl font-bold text-teal-600 dark:text-teal-400">${App.formatPrice(total)}</span>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button onclick="CartPage.sendWhatsApp()"
            class="flex-1 py-3 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
            <i data-lucide="message-circle" class="w-5 h-5"></i>
            <span>${I18n.t('cart.sendWhatsApp')}</span>
          </button>
          <button onclick="CartPage.confirmClear()"
            class="py-3 px-6 rounded-xl font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2">
            <i data-lucide="trash" class="w-5 h-5"></i>
            <span>${I18n.t('cart.clearCart')}</span>
          </button>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /**
   * Cambia la cantidad de un item (+1 o -1)
   */
  function changeQty(id, delta) {
    const items = Cart.getCart();
    const item = items.find(i => i.id === id);
    if (item) {
      const newQty = item.quantity + delta;
      if (newQty < 1) return;
      Cart.updateQuantity(id, newQty);
      render();
    }
  }

  /**
   * Establece la cantidad desde el input
   */
  function setQty(id, value) {
    Cart.updateQuantity(id, parseInt(value) || 1);
    render();
  }

  /**
   * Elimina un item
   */
  function removeItem(id) {
    Cart.removeFromCart(id);
    render();
  }

  /**
   * Confirmar vaciado del carrito
   */
  function confirmClear() {
    if (confirm(I18n.t('cart.confirmClear'))) {
      Cart.clearCart();
      render();
    }
  }

  /**
   * Envía el carrito por WhatsApp
   */
  function sendWhatsApp() {
    const items = Cart.getCart();
    if (items.length === 0) return;

    const total = Cart.getTotal();

    let message = I18n.t('cart.whatsappMessage') + '\n\n';

    items.forEach((item, i) => {
      message += `${i + 1}. ${item.title} x${item.quantity} — ${App.formatPrice(item.price * item.quantity)}\n`;
    });

    message += `\n*${I18n.t('cart.total')}: ${App.formatPrice(total)}*`;

    // Agregar link para que el vendedor registre la venta
    const ids = items.map(i => i.id).join(',');
    const adminLink = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}admin.html?registrar=true&ids=${ids}&total=${total}`;
    message += `\n\nRegistrar venta: ${adminLink}`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, '_blank');
  }

  return { init, render, changeQty, setQty, removeItem, confirmClear, sendWhatsApp };
})();

// Espera a que App.init() termine (i18n cargado) antes de renderizar
window.addEventListener('app-ready', () => {
  if (document.getElementById('cart-page')) {
    CartPage.init();
  }
});
