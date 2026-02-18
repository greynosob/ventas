// ============================================================
// admin.js — Lógica del panel de administración
// ============================================================

const Admin = (() => {
  let salesData = [];
  let productsData = [];
  let charts = {};

  async function init() {
    // Verificar si hay sesión activa
    if (!isLoggedIn()) {
      showLoginForm();
      return;
    }

    // Awaitar showDashboard para que loadProductChecklist() termine
    // antes de intentar pre-seleccionar checkboxes desde params de URL
    await showDashboard();

    // Verificar si viene con params de registro rápido (flow WhatsApp)
    const params = new URLSearchParams(window.location.search);
    if (params.get('registrar') === 'true') {
      switchTab('register');
      prefillFromParams(params);
    }
  }

  // ========================
  // Autenticación
  // ========================

  function isLoggedIn() {
    const token = sessionStorage.getItem('admin-session-token');
    const expiry = sessionStorage.getItem('admin-session-expiry');
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry, 10);
  }

  function showLoginForm() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    const lockoutUntil = parseInt(localStorage.getItem('admin-login-lockout') || '0', 10);
    const isLocked = Date.now() < lockoutUntil;
    const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
    const lockoutMsg = isLocked
      ? `<p class="text-red-500 text-sm mt-2">Demasiados intentos fallidos. Intenta de nuevo en ${minutesLeft} minuto(s).</p>`
      : '';

    container.innerHTML = `
      <div class="max-w-md mx-auto mt-20">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-slate-700">
          <div class="text-center mb-6">
            <i data-lucide="lock" class="w-12 h-12 text-teal-600 dark:text-teal-400 mx-auto mb-3"></i>
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">${I18n.t('admin.title')}</h2>
          </div>
          <form onsubmit="Admin.login(event)">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${I18n.t('admin.password')}</label>
            <input type="password" id="admin-password" ${isLocked ? 'disabled' : ''}
              class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              autofocus>
            <p id="login-error" class="text-red-500 text-sm mt-2 hidden">${I18n.t('admin.wrongPassword')}</p>
            ${lockoutMsg}
            <button type="submit" ${isLocked ? 'disabled' : ''}
              class="w-full mt-4 py-3 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors${isLocked ? ' opacity-50 cursor-not-allowed' : ''}">
              ${I18n.t('admin.enter')}
            </button>
          </form>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async function login(e) {
    e.preventDefault();

    // Rate limiting check
    const lockoutUntil = parseInt(localStorage.getItem('admin-login-lockout') || '0', 10);
    if (Date.now() < lockoutUntil) return;

    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      // PBKDF2: derivar hash de la contraseña con el salt del servidor
      const saltHex = CONFIG.ADMIN_PASSWORD_SALT;
      const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      const hashBuffer = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 },
        key,
        256
      );
      const passwordHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Enviar a Apps Script para validación server-side
      const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'adminLogin',
          token: CONFIG.API_TOKEN,
          passwordHash
        })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Credenciales inválidas');

      // Login exitoso: limpiar rate limiting y guardar sesión
      localStorage.removeItem('admin-login-attempts');
      localStorage.removeItem('admin-login-lockout');

      const { sessionToken, expiresAt } = result.data;
      sessionStorage.setItem('admin-session-token', sessionToken);
      sessionStorage.setItem('admin-session-expiry', String(new Date(expiresAt).getTime()));

      showDashboard();
    } catch (err) {
      // Incrementar contador de intentos fallidos
      const attempts = parseInt(localStorage.getItem('admin-login-attempts') || '0', 10) + 1;
      localStorage.setItem('admin-login-attempts', String(attempts));

      if (attempts >= 3) {
        localStorage.setItem('admin-login-lockout', String(Date.now() + 5 * 60 * 1000));
        localStorage.removeItem('admin-login-attempts');
        showLoginForm(); // refrescar para mostrar estado bloqueado
        return;
      }

      if (errorEl) errorEl.classList.remove('hidden');
    }
  }

  function logout() {
    const sessionToken = sessionStorage.getItem('admin-session-token');

    // Notificar a Apps Script para invalidar la sesión (best effort)
    if (sessionToken) {
      fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'adminLogout',
          token: CONFIG.API_TOKEN,
          sessionToken
        })
      }).catch(() => {});
    }

    sessionStorage.removeItem('admin-session-token');
    sessionStorage.removeItem('admin-session-expiry');
    showLoginForm();
  }

  // ========================
  // Dashboard
  // ========================

  async function showDashboard() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">${I18n.t('admin.dashboard')}</h2>
        <div class="flex items-center gap-3">
          <button onclick="Admin.exportCSV()"
            class="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>${I18n.t('admin.exportCsv')}</span>
          </button>
          <button onclick="Admin.logout()"
            class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>${I18n.t('admin.logout')}</span>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
        <button id="tab-dashboard" onclick="Admin.switchTab('dashboard')"
          class="px-4 py-2 text-sm font-medium border-b-2 border-teal-600 text-teal-600 dark:text-teal-400">
          ${I18n.t('admin.dashboard')}
        </button>
        <button id="tab-register" onclick="Admin.switchTab('register')"
          class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          ${I18n.t('admin.registerSale')}
        </button>
      </div>

      <div id="tab-content-dashboard">
        <!-- KPIs -->
        <div id="kpis" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">${I18n.t('admin.salesByCategory')}</h3>
            <canvas id="chart-category" height="200"></canvas>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">${I18n.t('admin.salesByOrigin')}</h3>
            <canvas id="chart-origin" height="200"></canvas>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">${I18n.t('admin.salesByPayment')}</h3>
            <canvas id="chart-payment" height="200"></canvas>
          </div>
        </div>

        <!-- Recent sales table -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 p-4 border-b border-gray-100 dark:border-slate-700">
            ${I18n.t('admin.recentSales')}
          </h3>
          <div id="sales-table" class="table-responsive">
            <div class="p-8 text-center text-gray-400">${I18n.t('common.loading')}</div>
          </div>
        </div>
      </div>

      <div id="tab-content-register" class="hidden">
        <!-- Register sale form -->
        <div class="max-w-2xl">
          <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">${I18n.t('admin.registerSale')}</h3>
            <form onsubmit="Admin.submitSale(event)" id="sale-form">
              <!-- Product selector -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${I18n.t('admin.selectProducts')}</label>
                <input type="text" id="product-search" placeholder="${I18n.t('admin.searchProducts')}"
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm mb-2 outline-none focus:ring-2 focus:ring-teal-500"
                  oninput="Admin.filterProductList()">
                <div id="product-checklist" class="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg p-2 space-y-1">
                  <p class="text-gray-400 text-sm text-center py-2">${I18n.t('common.loading')}</p>
                </div>
              </div>

              <div class="mb-4" id="selected-total-display"></div>

              <!-- Origin -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${I18n.t('admin.origin')}</label>
                <select id="sale-origin"
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="Facebook">${I18n.t('admin.originOptions.facebook')}</option>
                  <option value="WhatsApp">${I18n.t('admin.originOptions.whatsapp')}</option>
                  <option value="Grupo de mamás">${I18n.t('admin.originOptions.moms')}</option>
                  <option value="Instagram">${I18n.t('admin.originOptions.instagram')}</option>
                  <option value="Referido">${I18n.t('admin.originOptions.referral')}</option>
                  <option value="Otro">${I18n.t('admin.originOptions.other')}</option>
                </select>
              </div>

              <!-- Payment method -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${I18n.t('admin.paymentMethod')}</label>
                <select id="sale-payment"
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="Efectivo">${I18n.t('admin.paymentOptions.cash')}</option>
                  <option value="Transferencia">${I18n.t('admin.paymentOptions.transfer')}</option>
                </select>
              </div>

              <!-- Buyer -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${I18n.t('admin.buyer')}</label>
                <input type="text" id="sale-buyer"
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-teal-500">
              </div>

              <!-- Notes -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${I18n.t('admin.notes')}</label>
                <textarea id="sale-notes" rows="3"
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none"></textarea>
              </div>

              <button type="submit" id="submit-sale-btn"
                class="w-full py-3 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
                <span>${I18n.t('admin.confirm')}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Cargar datos
    await loadDashboardData();
    await loadProductChecklist();
  }

  /**
   * Cambia entre tabs
   */
  function switchTab(tab) {
    const dashboardTab = document.getElementById('tab-dashboard');
    const registerTab = document.getElementById('tab-register');
    const dashboardContent = document.getElementById('tab-content-dashboard');
    const registerContent = document.getElementById('tab-content-register');

    if (!dashboardTab || !registerTab || !dashboardContent || !registerContent) return;

    if (tab === 'dashboard') {
      dashboardTab.classList.add('border-teal-600', 'text-teal-600', 'dark:text-teal-400');
      dashboardTab.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
      registerTab.classList.remove('border-teal-600', 'text-teal-600', 'dark:text-teal-400');
      registerTab.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
      dashboardContent.classList.remove('hidden');
      registerContent.classList.add('hidden');
    } else {
      registerTab.classList.add('border-teal-600', 'text-teal-600', 'dark:text-teal-400');
      registerTab.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
      dashboardTab.classList.remove('border-teal-600', 'text-teal-600', 'dark:text-teal-400');
      dashboardTab.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
      registerContent.classList.remove('hidden');
      dashboardContent.classList.add('hidden');
    }
  }

  /**
   * Carga datos del dashboard
   */
  async function loadDashboardData() {
    try {
      [salesData, productsData] = await Promise.all([
        SheetsAPI.getSales(),
        SheetsAPI.getProducts()
      ]);

      renderKPIs();
      renderCharts();
      renderSalesTable();
    } catch (err) {
      console.error('[admin] Error cargando datos:', err);
      const kpis = document.getElementById('kpis');
      if (kpis) kpis.innerHTML = '<p class="col-span-full text-red-400 text-center">' + I18n.t('common.error') + '</p>';
    }
  }

  /**
   * Renderiza KPIs
   */
  function renderKPIs() {
    const kpis = document.getElementById('kpis');
    if (!kpis) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const salesToday = salesData.filter(s => s.date.startsWith(today)).reduce((sum, s) => sum + s.total, 0);
    const salesWeek = salesData.filter(s => s.date >= weekAgo).reduce((sum, s) => sum + s.total, 0);
    const salesMonth = salesData.filter(s => s.date >= monthAgo).reduce((sum, s) => sum + s.total, 0);
    const salesTotal = salesData.reduce((sum, s) => sum + s.total, 0);

    const kpiData = [
      { label: I18n.t('admin.salesToday'), value: salesToday, icon: 'calendar', color: 'teal' },
      { label: I18n.t('admin.salesWeek'), value: salesWeek, icon: 'trending-up', color: 'blue' },
      { label: I18n.t('admin.salesMonth'), value: salesMonth, icon: 'bar-chart-3', color: 'purple' },
      { label: I18n.t('admin.totalSales'), value: salesTotal, icon: 'wallet', color: 'orange' }
    ];

    const colorMap = {
      teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
    };

    kpis.innerHTML = kpiData.map(kpi => `
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg ${colorMap[kpi.color]}">
            <i data-lucide="${kpi.icon}" class="w-5 h-5"></i>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">${kpi.label}</p>
            <p class="text-lg font-bold text-gray-800 dark:text-gray-200">${App.formatPrice(kpi.value)}</p>
          </div>
        </div>
      </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /**
   * Renderiza gráficos con Chart.js
   */
  function renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('[admin] Chart.js no disponible');
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = isDark ? '#334155' : '#e2e8f0';

    // Destruir charts existentes
    Object.values(charts).forEach(c => c.destroy());
    charts = {};

    // Ventas por categoría (barras)
    const catCounts = {};
    salesData.forEach(sale => {
      const titles = sale.titles.split(',');
      titles.forEach(title => {
        const product = productsData.find(p => p.title.trim() === title.trim());
        const cat = product ? product.category : 'Otro';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
    });

    const catCtx = document.getElementById('chart-category');
    if (catCtx) {
      charts.category = new Chart(catCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(catCounts),
          datasets: [{
            data: Object.values(catCounts),
            backgroundColor: ['#0d9488', '#f97316', '#8b5cf6', '#3b82f6', '#ef4444', '#22c55e', '#eab308'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    // Ventas por origen (pie)
    const originCounts = {};
    salesData.forEach(s => {
      const o = s.origin || 'Otro';
      originCounts[o] = (originCounts[o] || 0) + 1;
    });

    const originCtx = document.getElementById('chart-origin');
    if (originCtx) {
      charts.origin = new Chart(originCtx, {
        type: 'pie',
        data: {
          labels: Object.keys(originCounts),
          datasets: [{
            data: Object.values(originCounts),
            backgroundColor: ['#0d9488', '#f97316', '#8b5cf6', '#3b82f6', '#ef4444', '#22c55e']
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } } }
        }
      });
    }

    // Ventas por método de pago (pie)
    const paymentCounts = {};
    salesData.forEach(s => {
      const p = s.paymentMethod || 'Otro';
      paymentCounts[p] = (paymentCounts[p] || 0) + 1;
    });

    const paymentCtx = document.getElementById('chart-payment');
    if (paymentCtx) {
      charts.payment = new Chart(paymentCtx, {
        type: 'pie',
        data: {
          labels: Object.keys(paymentCounts),
          datasets: [{
            data: Object.values(paymentCounts),
            backgroundColor: ['#0d9488', '#f97316', '#8b5cf6']
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } } }
        }
      });
    }
  }

  /**
   * Renderiza tabla de últimas ventas
   */
  function renderSalesTable() {
    const container = document.getElementById('sales-table');
    if (!container) return;

    if (salesData.length === 0) {
      container.innerHTML = `<p class="text-center text-gray-400 py-8">${I18n.t('admin.noSales')}</p>`;
      return;
    }

    const recent = [...salesData].reverse().slice(0, 20);

    container.innerHTML = `
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 dark:border-slate-700">
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">ID</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">${I18n.t('admin.date')}</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">${I18n.t('admin.titles')}</th>
            <th class="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">${I18n.t('admin.totalAmount')}</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">${I18n.t('admin.origin')}</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">${I18n.t('admin.paymentMethod')}</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">${I18n.t('admin.buyer')}</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map(sale => `
            <tr class="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
              <td class="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">${sale.id}</td>
              <td class="py-3 px-4 text-gray-600 dark:text-gray-400">${sale.date}</td>
              <td class="py-3 px-4 text-gray-800 dark:text-gray-200 max-w-xs truncate">${sale.titles}</td>
              <td class="py-3 px-4 text-right font-semibold text-teal-600 dark:text-teal-400">${App.formatPrice(sale.total)}</td>
              <td class="py-3 px-4">
                <span class="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">${sale.origin}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">${sale.paymentMethod}</span>
              </td>
              <td class="py-3 px-4 text-gray-600 dark:text-gray-400">${sale.buyer}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ========================
  // Product Checklist
  // ========================

  async function loadProductChecklist() {
    const container = document.getElementById('product-checklist');
    if (!container) return;

    try {
      if (productsData.length === 0) {
        productsData = await SheetsAPI.getProducts();
      }

      const available = productsData.filter(p => p.status !== 'Vendido');

      container.innerHTML = available.map(p => `
        <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer product-check-item"
          data-search="${p.title.toLowerCase()} ${p.category.toLowerCase()}">
          <input type="checkbox" value="${p.id}" data-title="${p.title}" data-price="${p.price}"
            class="product-checkbox rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            onchange="Admin.updateSelectedTotal()">
          <span class="text-sm text-gray-800 dark:text-gray-200 flex-1">${p.title}</span>
          <span class="text-xs font-medium text-teal-600 dark:text-teal-400">${App.formatPrice(p.price)}</span>
        </label>
      `).join('');
    } catch (err) {
      container.innerHTML = '<p class="text-red-400 text-sm text-center py-2">Error cargando productos</p>';
    }
  }

  function filterProductList() {
    const query = document.getElementById('product-search')?.value.toLowerCase() || '';
    document.querySelectorAll('.product-check-item').forEach(item => {
      const text = item.dataset.search || '';
      item.style.display = text.includes(query) ? '' : 'none';
    });
  }

  function updateSelectedTotal() {
    const checked = document.querySelectorAll('.product-checkbox:checked');
    const display = document.getElementById('selected-total-display');
    if (!display) return;

    if (checked.length === 0) {
      display.innerHTML = '';
      return;
    }

    let total = 0;
    checked.forEach(cb => { total += parseFloat(cb.dataset.price) || 0; });

    display.innerHTML = `
      <div class="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 flex items-center justify-between">
        <span class="text-sm text-teal-700 dark:text-teal-300">${checked.length} producto(s) seleccionado(s)</span>
        <span class="font-bold text-teal-600 dark:text-teal-400">${App.formatPrice(total)}</span>
      </div>
    `;
  }

  /**
   * Pre-llena el formulario desde params de URL (flow WhatsApp)
   */
  function prefillFromParams(params) {
    const ids = params.get('ids');
    const total = params.get('total');

    if (ids) {
      const idList = ids.split(',');
      document.querySelectorAll('.product-checkbox').forEach(cb => {
        if (idList.includes(cb.value)) {
          cb.checked = true;
        }
      });
      updateSelectedTotal();
    }

    // Set origin to WhatsApp by default for this flow
    const originSelect = document.getElementById('sale-origin');
    if (originSelect) originSelect.value = 'WhatsApp';
  }

  // ========================
  // Submit sale
  // ========================

  async function submitSale(e) {
    e.preventDefault();

    const checked = document.querySelectorAll('.product-checkbox:checked');
    if (checked.length === 0) {
      App.showToast('Selecciona al menos un producto', 'error');
      return;
    }

    const btn = document.getElementById('submit-sale-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin">⏳</span> Registrando...';
    }

    const ids = [];
    const titles = [];
    let total = 0;

    checked.forEach(cb => {
      ids.push(cb.value);
      titles.push(cb.dataset.title);
      total += parseFloat(cb.dataset.price) || 0;
    });

    const saleData = {
      productIds: ids.join(','),
      titles: titles.join(','),
      total: total,
      origin: document.getElementById('sale-origin')?.value || '',
      paymentMethod: document.getElementById('sale-payment')?.value || '',
      notes: document.getElementById('sale-notes')?.value || '',
      buyer: document.getElementById('sale-buyer')?.value || ''
    };

    try {
      await SheetsWriter.registerSale(saleData);
      App.showToast(I18n.t('admin.saleRegistered'));

      // Reset form
      document.getElementById('sale-form')?.reset();
      checked.forEach(cb => { cb.checked = false; });
      updateSelectedTotal();

      // Recargar datos del dashboard
      await loadDashboardData();
      await loadProductChecklist();
    } catch (err) {
      console.error('[admin] Error registrando venta:', err);
      App.showToast(I18n.t('admin.saleError') + ': ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5"></i><span>${I18n.t('admin.confirm')}</span>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }

  // ========================
  // Export CSV
  // ========================

  function exportCSV() {
    if (salesData.length === 0) {
      App.showToast('No hay ventas para exportar', 'info');
      return;
    }

    const headers = ['ID', 'Fecha', 'ProductoIDs', 'Títulos', 'Total', 'Origen', 'MétodoPago', 'Notas', 'Comprador'];
    const rows = salesData.map(s => [
      s.id, s.date, s.productIds, `"${s.titles}"`, s.total, s.origin, s.paymentMethod, `"${s.notes}"`, s.buyer
    ]);

    let csv = headers.join(',') + '\n';
    csv += rows.map(r => r.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    App.showToast('CSV exportado');
  }

  return {
    init, login, logout, switchTab, filterProductList, updateSelectedTotal,
    submitSale, exportCSV
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('admin-page')) {
    Admin.init();
  }
});
