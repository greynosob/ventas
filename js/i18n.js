// ============================================================
// i18n.js — Sistema de internacionalización
// ============================================================

const I18n = (() => {
  let translations = {};
  let currentLang = localStorage.getItem('lang') || CONFIG.DEFAULT_LANG;

  /**
   * Carga el archivo de traducciones para el idioma dado
   */
  async function load(lang) {
    try {
      const res = await fetch(`i18n/${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      translations = await res.json();
      currentLang = lang;
      localStorage.setItem('lang', lang);
      applyAll();
    } catch (err) {
      console.error(`[i18n] Error cargando idioma "${lang}":`, err);
    }
  }

  /**
   * Obtiene una traducción por clave con dot notation
   * Ejemplo: t('nav.home') → "Inicio"
   */
  function t(key, fallback) {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      if (value == null || typeof value !== 'object') return fallback || key;
      value = value[k];
    }
    return value != null ? value : (fallback || key);
  }

  /**
   * Aplica traducciones a todos los elementos con data-i18n
   */
  function applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key);
      if (translated !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translated;
        } else {
          el.textContent = translated;
        }
      }
    });

    // También aplica a atributos data-i18n-*
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translated = t(key);
      if (translated !== key) el.title = translated;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const translated = t(key);
      if (translated !== key) el.setAttribute('aria-label', translated);
    });
  }

  function getLang() {
    return currentLang;
  }

  return { load, t, applyAll, getLang };
})();
