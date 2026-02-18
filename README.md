# Garage Sale

Sitio web de venta de garage construido con HTML, CSS (Tailwind) y JavaScript vanilla, usando **Google Sheets** como base de datos y **Google Apps Script** como backend de escritura. Se despliega automáticamente en **GitHub Pages** vía CI/CD.

## Stack Tecnológico

- **Frontend:** HTML5, JavaScript vanilla (ES6+), Tailwind CSS 3.4
- **Iconos:** Lucide Icons
- **Gráficas:** Chart.js (panel de administración)
- **Backend:** Google Sheets API (lectura pública) + Google Apps Script (escritura autenticada)
- **Hosting:** GitHub Pages (deploy automático con GitHub Actions)

---

## Configuración Inicial

### 1. Crear la hoja de Google Sheets

Crea una nueva hoja en [Google Sheets](https://sheets.google.com) con **3 pestañas**:

**Pestaña "Inventario"** (columnas A–K):

| ID | Título | DescripciónCorta | DescripciónLarga | Precio | PrecioAnterior | Categoría | Tags | Imágenes | Estado | FechaPublicación |
|----|--------|------------------|------------------|--------|----------------|-----------|------|----------|--------|------------------|

**Pestaña "Categorías"** (columnas A–D):

| ID | Nombre | Imagen | Descripción |
|----|--------|--------|-------------|

**Pestaña "Ventas"** (columnas A–I):

| ID | Fecha | ProductoIDs | Títulos | Total | Origen | MétodoPago | Notas | Comprador |
|----|-------|-------------|---------|-------|--------|------------|-------|-----------|

> Copia las cabeceras **tal cual** en la fila 1. Los acentos importan.

<details>
<summary>Datos de ejemplo para verificar</summary>

**Inventario** (fila 2):

| P001 | Silla de madera | Silla rústica en buen estado | Silla de madera de pino, estilo rústico. | 150 | 300 | Muebles | silla,madera | | Disponible | 2026-01-15 |

**Categorías** (fila 2):

| C001 | Muebles | | Mesas, sillas, libreros y más |

> La columna **Imágenes** puede quedar vacía (muestra placeholder). La columna **Estado** vacía equivale a "Disponible". El valor de **Categoría** en Inventario debe coincidir exactamente con **Nombre** en Categorías.
</details>

---

### 2. Obtener API Key de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o usa uno existente)
3. **APIs y servicios → Biblioteca** → habilitar **Google Sheets API**
4. **APIs y servicios → Credenciales → Crear credenciales → API Key**
5. Guarda la key — la necesitarás en el Paso 5

> **Restricción recomendada:** Una vez desplegado el sitio, regresa a esta key y restringe:
> - *Application restrictions* → Websites → `https://tu-usuario.github.io/*`
> - *API restrictions* → Restrict key → solo "Google Sheets API"

---

### 3. Generar las credenciales de seguridad

Necesitas generar dos valores antes de continuar. Guárdalos en un lugar seguro.

#### API Token (secreto compartido frontend ↔ Apps Script)

Ejecuta en una terminal con Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guarda el resultado (64 caracteres hex). Este valor va tanto en GitHub Secrets como en Apps Script Properties.

#### Hash PBKDF2 de la contraseña admin

Abre la consola del navegador (`F12`) y ejecuta:

```js
const password = 'TuContraseñaReal123!';  // ← cambia esto
const salt = crypto.getRandomValues(new Uint8Array(16));
const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2,'0')).join('');
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
const hash = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt, iterations:100000}, key, 256);
const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
console.log('SALT:', saltHex);
console.log('HASH:', hashHex);
```

- **SALT** → va a GitHub Secrets (`ADMIN_PASSWORD_SALT`) y a Apps Script Properties
- **HASH** → va **solo** a Apps Script Properties (nunca a git)

> Usa una contraseña fuerte: mínimo 16 caracteres, mayúsculas, números y símbolos.

---

### 4. Desplegar Google Apps Script

1. Abre [Google Apps Script](https://script.google.com) y crea un proyecto nuevo
2. Copia el contenido de `google-apps-script/Code.gs` en el editor
3. Ve a **Configuración del proyecto (⚙️) → Propiedades del script** y agrega:

| Propiedad | Valor |
|---|---|
| `API_TOKEN` | El token generado en el Paso 3 |
| `SHEET_ID` | El ID de tu Google Sheet (está en la URL: `/spreadsheets/d/[ID]/edit`) |
| `ADMIN_PASSWORD_HASH` | El HASH generado en el Paso 3 |
| `ADMIN_PASSWORD_SALT` | El SALT generado en el Paso 3 |

4. Ve a **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquiera**
5. Copia la URL de la implementación

> **Trigger de limpieza:** Ve a **Activadores → Añadir activador** y configura:
> - Función: `cleanupExpiredSessions` | Basado en tiempo | Cada 6 horas

---

### 5. Configurar GitHub Secrets

En tu repositorio de GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|---|---|
| `SHEET_ID` | ID del Google Sheet |
| `API_KEY` | API Key de Google Cloud |
| `APPS_SCRIPT_URL` | URL del Apps Script desplegado |
| `API_TOKEN` | El token generado en el Paso 3 |
| `ADMIN_PASSWORD_SALT` | El SALT generado en el Paso 3 |
| `WHATSAPP_NUMBER` | Tu número de WhatsApp con código de país, sin `+` (ej: `521234567890`) |

---

### 6. Habilitar GitHub Pages

1. En tu repositorio: **Settings → Pages**
2. En **Source** selecciona: **GitHub Actions**
3. Haz push a `main` — el workflow generará `config.js` automáticamente desde los Secrets y desplegará el sitio

> `config.js` nunca se commitea al repositorio. Se genera en cada deploy. Para desarrollo local, crea `config.js` manualmente copiando `config.template.js` y reemplazando los `%%PLACEHOLDERS%%`.

---

## Panel de Administración

### Acceso

La URL del panel es:

```
https://tu-usuario.github.io/tu-repo/_panel/
```

> `admin.html` también funciona como punto de entrada: redirige automáticamente a `_panel/` preservando los parámetros de URL. El enlace no aparece en el footer público del sitio.

---

### Login

Al ingresar a `_panel/` se muestra el formulario de contraseña.

**Cómo funciona la autenticación:**
1. Ingresas tu contraseña
2. El navegador calcula un hash PBKDF2 (100,000 iteraciones, SHA-256) usando el salt de configuración
3. El hash se envía a Apps Script para validación — la contraseña nunca viaja en texto plano
4. Si es correcto, Apps Script crea una sesión con token único válido por **8 horas**
5. El token se guarda en `sessionStorage` (se elimina al cerrar el tab)

**Rate limiting:** 3 intentos fallidos bloquean el formulario por 5 minutos.

---

### Dashboard — Pestaña "Dashboard"

Muestra un resumen completo de las ventas:

**KPIs (tarjetas superiores):**
- Ventas de hoy
- Ventas de los últimos 7 días
- Ventas del mes actual
- Total acumulado

**Gráficas:**
- Ventas por categoría (barras)
- Ventas por origen (pastel): Facebook, WhatsApp, Instagram, etc.
- Ventas por método de pago (pastel): Efectivo, Transferencia

**Tabla de últimas ventas:** las 20 ventas más recientes con todos los campos.

**Exportar CSV:** botón en la esquina superior derecha. Descarga todas las ventas en formato CSV con BOM (compatible con Excel).

---

### Dashboard — Pestaña "Registrar Venta"

Permite registrar manualmente una venta.

**Campos del formulario:**

| Campo | Descripción |
|---|---|
| Buscar / seleccionar productos | Lista de todos los productos disponibles con checkboxes. Puedes filtrar por nombre. Al seleccionar, muestra el total acumulado. |
| Origen | De dónde viene el comprador: Facebook, WhatsApp, Grupo de mamás, Instagram, Referido, Otro |
| Método de pago | Efectivo o Transferencia |
| Comprador | Nombre del comprador (opcional) |
| Notas | Observaciones adicionales (opcional) |

Al confirmar:
1. Se registra la venta en la hoja "Ventas" con ID automático y fecha
2. Los productos seleccionados se marcan como "Vendido" en la hoja "Inventario"
3. El dashboard se recarga con los datos actualizados

---

### Flujo WhatsApp → Registrar Venta

Este flujo permite registrar una venta directamente desde el mensaje de WhatsApp que envía un comprador:

1. **El comprador** agrega productos al carrito y hace clic en **"Enviar por WhatsApp"**
2. Se abre WhatsApp con un mensaje que incluye el resumen del pedido y un **link de registro**
3. **El vendedor** hace clic en ese link
4. Se abre `_panel/` con la pestaña "Registrar venta" activa y los productos del pedido **ya seleccionados**
5. El vendedor solo elige el método de pago, agrega el nombre del comprador (si desea) y confirma

> El link tiene la forma: `_panel/?registrar=true&ids=P001,P002&total=300`

---

### Cerrar Sesión

Botón **"Cerrar sesión"** en la esquina superior del dashboard. Al hacer clic:
- La sesión se invalida en el servidor (Apps Script elimina el token)
- Se limpia `sessionStorage`
- Se regresa al formulario de login

Las sesiones también expiran automáticamente después de 8 horas aunque no se cierre sesión explícitamente.

---

## Desarrollo Local

```bash
# Opción 1: npm
npm start

# Opción 2: Python
python -m http.server 3000

# Opción 3: VS Code — extensión "Live Server" → "Go Live"
```

Para desarrollo local necesitas crear `config.js` manualmente:

```bash
cp config.template.js config.js
# Editar config.js y reemplazar los %%PLACEHOLDERS%% con valores reales
```

`config.js` está en `.gitignore` — nunca se commitea.

---

## Funcionalidad por Página

### Inicio (`index.html`)
- Hero section con gradiente y CTA
- Carrusel de ofertas destacadas (productos con `PrecioAnterior > Precio`)
- Grid de categorías destacadas
- Toggle dark/light mode

### Productos (`productos.html`)
- Grid responsive (2–5 columnas)
- Filtrado por categoría y por ofertas via URL params
- Modal de detalle con galería de imágenes navegable (teclado y click)
- Botón de agregar al carrito

### Categorías (`categorias.html`)
- Cards con conteo de productos disponibles y en oferta
- Enlace directo a productos filtrados

### Carrito (`carrito.html`)
- Tabla en desktop, cards en móvil
- Gestión de cantidades (+/−)
- Checkout vía WhatsApp con resumen del pedido y link de registro
- Vaciado de carrito con confirmación

### Panel Admin (`_panel/index.html`)
- Autenticación PBKDF2 + sesión server-side (8h)
- Rate limiting: 3 intentos fallidos → bloqueo 5 min
- Dashboard: KPIs, 3 gráficas Chart.js, tabla de últimas ventas
- Registro de ventas con checklist de productos y filtro de búsqueda
- Flujo rápido desde link de WhatsApp (productos pre-seleccionados)
- Exportación CSV con BOM

### Funcionalidad Global
- Navbar responsive con menú hamburguesa y dropdown de categorías
- Búsqueda en tiempo real con resaltado de coincidencias
- Toggle dark/light mode (persiste en `localStorage`)
- Badge de carrito con conteo
- Notificaciones toast
- Sistema i18n (`i18n/es.json`)
- Caché de datos con TTL configurable (5 min por defecto)

---

## Estructura del Proyecto

```
ventas/
├── index.html                    # Página de inicio
├── productos.html                # Catálogo de productos
├── categorias.html               # Vista de categorías
├── carrito.html                  # Carrito de compras
├── admin.html                    # Redirect a _panel/ (preserva query string)
├── config.template.js            # Template de configuración con placeholders
├── .nojekyll                     # Habilita directorios _ en GitHub Pages
├── package.json                  # Metadata y scripts del proyecto
├── .gitignore                    # config.js y otros archivos ignorados
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD: genera config.js desde Secrets y despliega
├── _panel/
│   └── index.html                # Panel de administración (ruta no obvia)
├── css/
│   └── styles.css                # Estilos personalizados y animaciones
├── js/
│   ├── app.js                    # Inicializador global (navbar, theme, cart badge)
│   ├── home.js                   # Lógica de la página de inicio
│   ├── products.js               # Lógica del catálogo de productos
│   ├── categories.js             # Lógica de la vista de categorías
│   ├── cart.js                   # Gestión del carrito (localStorage)
│   ├── cart-page.js              # Renderizado de la página del carrito
│   ├── admin.js                  # Panel de administración y gráficas
│   ├── sheets-api.js             # Cliente de Google Sheets API (lectura)
│   ├── sheets-writer.js          # Cliente de Apps Script (escritura)
│   ├── search.js                 # Búsqueda global en tiempo real
│   └── i18n.js                   # Sistema de internacionalización
├── i18n/
│   └── es.json                   # Traducciones en español
├── images/
│   └── productos/                # Imágenes locales de productos (opcional)
└── google-apps-script/
    └── Code.gs                   # Backend: validación de token + sesiones + escritura
```

> `config.js` no aparece en el árbol porque está en `.gitignore`. Se genera automáticamente en cada deploy.

---

## Seguridad

| Medida | Implementación |
|---|---|
| Credenciales fuera de git | `config.js` generado en CI/CD desde GitHub Secrets |
| Apps Script autenticado | Token compartido validado en tiempo constante (anti-timing attack) |
| Contraseña admin | Hash PBKDF2 (100k iteraciones) — nunca va al repositorio |
| Sesiones server-side | Token UUID en Apps Script Properties, TTL 8h |
| Rate limiting | 3 intentos fallidos → bloqueo 5 min (localStorage) |
| Panel en ruta no obvia | `_panel/` — sin enlace público en el sitio |
| Content Security Policy | Meta tag CSP en todas las páginas |
| Subresource Integrity | `integrity` + `crossorigin` en Lucide y Chart.js |
| API Key restringida | Solo Sheets API + dominio de GitHub Pages |

---

<details>
<summary><strong>English Version</strong></summary>

# Garage Sale

A garage sale e-commerce website built with HTML, CSS (Tailwind), and vanilla JavaScript, using **Google Sheets** as its database and **Google Apps Script** as a write backend. Automatically deployed to **GitHub Pages** via CI/CD.

## Tech Stack

- **Frontend:** HTML5, vanilla JavaScript (ES6+), Tailwind CSS 3.4
- **Icons:** Lucide Icons
- **Charts:** Chart.js (admin panel)
- **Backend:** Google Sheets API (public read) + Google Apps Script (authenticated write)
- **Hosting:** GitHub Pages (automatic deploy via GitHub Actions)

---

## Initial Setup

### 1. Create the Google Sheet

Create a new spreadsheet in [Google Sheets](https://sheets.google.com) with **3 tabs**:

**"Inventario" tab** (columns A–K):

| ID | Título | DescripciónCorta | DescripciónLarga | Precio | PrecioAnterior | Categoría | Tags | Imágenes | Estado | FechaPublicación |
|----|--------|------------------|------------------|--------|----------------|-----------|------|----------|--------|------------------|

**"Categorías" tab** (columns A–D):

| ID | Nombre | Imagen | Descripción |
|----|--------|--------|-------------|

**"Ventas" tab** (columns A–I):

| ID | Fecha | ProductoIDs | Títulos | Total | Origen | MétodoPago | Notas | Comprador |
|----|-------|-------------|---------|-------|--------|------------|-------|-----------|

> Copy headers **exactly** as shown in row 1. Accented characters matter.

---

### 2. Get a Google Cloud API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. **APIs & Services → Library** → enable **Google Sheets API**
4. **APIs & Services → Credentials → Create Credentials → API Key**
5. Save the key for Step 5

> **Recommended restriction:** Once deployed, restrict the key to your GitHub Pages domain and to the Sheets API only.

---

### 3. Generate Security Credentials

#### API Token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the 64-char hex result. Goes to both GitHub Secrets and Apps Script Properties.

#### Admin Password PBKDF2 Hash

Run in the browser console:

```js
const password = 'YourRealPassword123!';
const salt = crypto.getRandomValues(new Uint8Array(16));
const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2,'0')).join('');
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
const hash = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt, iterations:100000}, key, 256);
const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
console.log('SALT:', saltHex);
console.log('HASH:', hashHex);
```

- **SALT** → GitHub Secrets (`ADMIN_PASSWORD_SALT`) and Apps Script Properties
- **HASH** → Apps Script Properties **only** (never committed to git)

---

### 4. Deploy Google Apps Script

1. Open [Google Apps Script](https://script.google.com) and create a new project
2. Paste the contents of `google-apps-script/Code.gs`
3. Go to **Project Settings (⚙️) → Script Properties** and add:

| Property | Value |
|---|---|
| `API_TOKEN` | Token from Step 3 |
| `SHEET_ID` | Your Google Sheet ID |
| `ADMIN_PASSWORD_HASH` | HASH from Step 3 |
| `ADMIN_PASSWORD_SALT` | SALT from Step 3 |

4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployment URL

> **Cleanup trigger:** Triggers → Add Trigger → `cleanupExpiredSessions` → Time-driven → Every 6 hours

---

### 5. Configure GitHub Secrets

Repository **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `SHEET_ID` | Google Sheet ID |
| `API_KEY` | Google Cloud API Key |
| `APPS_SCRIPT_URL` | Apps Script deployment URL |
| `API_TOKEN` | Token from Step 3 |
| `ADMIN_PASSWORD_SALT` | SALT from Step 3 |
| `WHATSAPP_NUMBER` | WhatsApp number with country code, no `+` (e.g. `521234567890`) |

---

### 6. Enable GitHub Pages

1. Repository **Settings → Pages**
2. **Source** → **GitHub Actions**
3. Push to `main` — the workflow generates `config.js` from Secrets and deploys automatically

> For local development: `cp config.template.js config.js` and replace `%%PLACEHOLDERS%%` manually. `config.js` is in `.gitignore` and is never committed.

---

## Admin Panel

### Access

```
https://your-user.github.io/your-repo/_panel/
```

> `admin.html` also works as an entry point — it redirects to `_panel/` preserving URL parameters. There is no public link to the admin panel in the site footer.

---

### Login

**How authentication works:**
1. You enter your password
2. The browser computes a PBKDF2 hash (100,000 iterations, SHA-256) using the configured salt
3. The hash is sent to Apps Script for server-side validation — the password never travels in plain text
4. On success, Apps Script creates a session with a unique token valid for **8 hours**
5. The token is stored in `sessionStorage` (cleared when the tab is closed)

**Rate limiting:** 3 failed attempts lock the form for 5 minutes.

---

### Dashboard Tab

**KPI cards:**
- Sales today
- Sales last 7 days
- Sales this month
- All-time total

**Charts:**
- Sales by category (bar)
- Sales by origin (pie): Facebook, WhatsApp, Instagram, etc.
- Sales by payment method (pie)

**Recent sales table:** last 20 sales with all fields.

**Export CSV:** top-right button. Downloads all sales as a BOM-encoded CSV (Excel-compatible).

---

### Register Sale Tab

| Field | Description |
|---|---|
| Product checklist | All available products with checkboxes. Type to filter. Running total shown when items are selected. |
| Origin | Where the buyer came from: Facebook, WhatsApp, Moms group, Instagram, Referral, Other |
| Payment method | Cash or Transfer |
| Buyer | Buyer name (optional) |
| Notes | Additional notes (optional) |

On confirm:
1. Sale is recorded in the "Ventas" sheet with auto-generated ID and timestamp
2. Selected products are marked "Vendido" in the "Inventario" sheet
3. Dashboard reloads with updated data

---

### WhatsApp → Register Sale Flow

1. **Buyer** adds items to cart and clicks **"Send via WhatsApp"**
2. WhatsApp opens with an order summary and a **registration link**
3. **Seller** taps that link
4. `_panel/` opens with the "Register sale" tab active and the buyer's products **pre-selected**
5. Seller selects payment method, optionally adds buyer name, and confirms

> The link looks like: `_panel/?registrar=true&ids=P001,P002&total=300`

---

### Logout

The **"Cerrar sesión"** (Logout) button is in the top-right of the dashboard. On click:
- The session is invalidated on the server (Apps Script deletes the token)
- `sessionStorage` is cleared
- Returns to the login form

Sessions also expire automatically after 8 hours.

---

## Local Development

```bash
# Option 1: npm
npm start

# Option 2: Python
python -m http.server 3000

# Option 3: VS Code — install "Live Server" extension → "Go Live"
```

For local dev, create `config.js` manually:

```bash
cp config.template.js config.js
# Edit config.js and replace %%PLACEHOLDERS%% with real values
```

---

## Project Structure

```
ventas/
├── index.html                    # Home page
├── productos.html                # Product catalog
├── categorias.html               # Categories view
├── carrito.html                  # Shopping cart
├── admin.html                    # Redirect to _panel/ (preserves query string)
├── config.template.js            # Config template with placeholders
├── .nojekyll                     # Enables _ directories on GitHub Pages
├── package.json                  # Project metadata and scripts
├── .gitignore                    # config.js and other ignored files
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD: generates config.js from Secrets and deploys
├── _panel/
│   └── index.html                # Admin panel (non-obvious URL)
├── css/
│   └── styles.css                # Custom styles and animations
├── js/
│   ├── app.js                    # Global initializer (navbar, theme, cart badge)
│   ├── home.js                   # Home page logic
│   ├── products.js               # Product catalog logic
│   ├── categories.js             # Categories view logic
│   ├── cart.js                   # Cart management (localStorage)
│   ├── cart-page.js              # Cart page rendering
│   ├── admin.js                  # Admin panel and charts
│   ├── sheets-api.js             # Google Sheets API client (read)
│   ├── sheets-writer.js          # Apps Script client (write)
│   ├── search.js                 # Global real-time search
│   └── i18n.js                   # Internationalization system
├── i18n/
│   └── es.json                   # Spanish translations
├── images/
│   └── productos/                # Local product images (optional)
└── google-apps-script/
    └── Code.gs                   # Backend: token validation + sessions + write ops
```

> `config.js` is not in the tree because it is in `.gitignore`. It is generated automatically on every deploy.

---

## Security

| Measure | Implementation |
|---|---|
| Credentials out of git | `config.js` generated at deploy time from GitHub Secrets |
| Authenticated Apps Script | Shared token validated with constant-time comparison (anti-timing attack) |
| Admin password | PBKDF2 hash (100k iterations) — never stored in the repository |
| Server-side sessions | UUID token in Apps Script Properties, 8h TTL |
| Rate limiting | 3 failed attempts → 5-minute lockout (localStorage) |
| Admin at non-obvious URL | `_panel/` — no public link in the site |
| Content Security Policy | CSP meta tag on all pages |
| Subresource Integrity | `integrity` + `crossorigin` on Lucide and Chart.js CDN scripts |
| Restricted API Key | Sheets API only + GitHub Pages domain |

</details>
