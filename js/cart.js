// ============================================================
// cart.js — Estado del carrito (localStorage) + eventos
// ============================================================

const Cart = (() => {
  const STORAGE_KEY = 'garage-sale-cart';

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function _save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    _notify();
  }

  function _notify() {
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart: _load() } }));
  }

  /**
   * Obtiene todos los items del carrito
   * @returns {Array<{id, title, price, quantity, image}>}
   */
  function getCart() {
    return _load();
  }

  /**
   * Agrega un producto al carrito (o incrementa cantidad si ya existe)
   */
  function addToCart(product) {
    const items = _load();
    const existing = items.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        id: product.id,
        title: product.title,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.image || ''
      });
    }
    _save(items);
  }

  /**
   * Elimina un producto del carrito por ID
   */
  function removeFromCart(productId) {
    const items = _load().filter(item => item.id !== productId);
    _save(items);
  }

  /**
   * Actualiza la cantidad de un producto
   */
  function updateQuantity(productId, quantity) {
    const items = _load();
    const item = items.find(i => i.id === productId);
    if (item) {
      item.quantity = Math.max(1, parseInt(quantity) || 1);
      _save(items);
    }
  }

  /**
   * Vacía el carrito
   */
  function clearCart() {
    _save([]);
  }

  /**
   * Obtiene el total del carrito
   */
  function getTotal() {
    return _load().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /**
   * Obtiene la cantidad total de items
   */
  function getCount() {
    return _load().reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Verifica si un producto está en el carrito
   */
  function isInCart(productId) {
    return _load().some(item => item.id === productId);
  }

  return { getCart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getCount, isInCart };
})();
