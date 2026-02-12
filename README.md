# Garage Sale

Sitio web de venta de garage construido con HTML, CSS (Tailwind) y JavaScript vanilla, usando **Google Sheets** como base de datos y **Google Apps Script** como backend de escritura.

## Stack Tecnológico

- **Frontend:** HTML5, JavaScript vanilla (ES6+), Tailwind CSS 3.4
- **Iconos:** Lucide Icons
- **Gráficas:** Chart.js (panel de administración)
- **Backend:** Google Sheets API (lectura) + Google Apps Script (escritura)
- **Hosting:** Cualquier servidor estático (GitHub Pages, Netlify, etc.)

## Prerrequisitos

- Cuenta de Google
- Proyecto en Google Cloud Console con la API de Google Sheets habilitada
- API Key de Google Cloud
- Google Apps Script desplegado como Web App

## Configuración

### 1. Crear la hoja de Google Sheets

Crea una nueva hoja de cálculo en [Google Sheets](https://sheets.google.com) con **3 pestañas**:

**Pestaña "Inventario"** (columnas A–K):

| ID | Título | DescripciónCorta | DescripciónLarga | Precio | PrecioAnterior | Categoría | Tags | Imágenes | Estado | FechaPublicación |
|----|--------|------------------|------------------|--------|----------------|-----------|------|----------|--------|------------------|

**Pestaña "Categorías"** (columnas A–D):

| ID | Nombre | Imagen | Descripción |
|----|--------|--------|-------------|

**Pestaña "Ventas"** (columnas A–I):

| ID | Fecha | ProductoIDs | Títulos | Total | Origen | MétodoPago | Notas | Comprador |
|----|-------|-------------|---------|-------|--------|------------|-------|-----------|

> Copia las cabeceras **tal cual** en la fila 1 de cada pestaña. Los acentos importan.

#### Datos de ejemplo

Para verificar que todo funciona, agrega estas filas de ejemplo debajo de las cabeceras:

**Inventario** (fila 2):

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| P001 | Silla de madera | Silla rústica en buen estado | Silla de madera de pino, estilo rústico. Tiene algunas marcas de uso pero está firme y funcional. | 150 | 300 | Muebles | silla,madera,rústico | | Disponible | 2026-01-15 |

**Categorías** (fila 2):

| A | B | C | D |
|---|---|---|---|
| C001 | Muebles | | Mesas, sillas, libreros y más |

**Ventas** (fila 2):

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| V001 | 2026-02-10 14:30:00 | P001 | Silla de madera | 150 | WhatsApp | Efectivo | | Juan |

> **Notas:** La columna **Imágenes** puede quedar vacía (se muestra un placeholder gris). La columna **Estado** puede quedar vacía (se asume "Disponible"). Lo importante es que la **Categoría** del producto coincida exactamente con el **Nombre** en la pestaña Categorías.

### 2. Obtener una API Key de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o usa uno existente)
3. Navega a **APIs y servicios → Biblioteca** y habilita **Google Sheets API**
4. Ve a **APIs y servicios → Credenciales → Crear credenciales → API Key**
5. (Opcional) Restringe la key a "Google Sheets API" y a tu dominio

### 3. Desplegar Google Apps Script

1. Abre [Google Apps Script](https://script.google.com) y crea un proyecto nuevo
2. Copia el contenido de `google-apps-script/Code.gs` en el editor
3. Reemplaza el `SPREADSHEET_ID` con el ID de tu Google Sheet
4. Ve a **Deploy → New deployment → Web app**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquiera**
5. Copia la URL del despliegue

### 4. Configurar `config.js`

Abre `config.js` y reemplaza los siguientes valores:

```js
SHEET_ID: 'TU_ID_DE_GOOGLE_SHEET',        // El ID está en la URL: /spreadsheets/d/[ID]/edit
API_KEY: 'TU_API_KEY_DE_GOOGLE_CLOUD',
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/.../exec',
WHATSAPP_NUMBER: '521234567890',            // Tu número con código de país, sin +
ADMIN_PASSWORD_HASH: '...',                 // Hash SHA-256 de tu contraseña
```

Para generar el hash de la contraseña, ejecuta esto en la consola del navegador:

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('tu_password'))
  .then(h => console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,'0')).join('')))
```

## Desarrollo Local

Tres opciones para servir el sitio localmente:

```bash
# Opción 1: npm (requiere Node.js)
npm start

# Opción 2: Python
python -m http.server 3000

# Opción 3: VS Code
# Instalar la extensión "Live Server" y hacer clic en "Go Live"
```

## Despliegue en GitHub Pages

1. Crea un repositorio en GitHub
2. Sube el código:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```
3. Ve a **Settings → Pages** en tu repositorio
4. En **Source** selecciona la rama `main` y carpeta `/ (root)`
5. (Recomendado) En Google Cloud Console, restringe tu API Key al dominio `tu-usuario.github.io`

## Funcionalidad por Página

### Inicio (`index.html`)

- Hero section con gradiente y CTA
- Carrusel de ofertas destacadas (productos con descuento)
- Grid de categorías destacadas
- Toggle dark/light mode

### Productos (`productos.html`)

- Grid responsive de productos (2–5 columnas según pantalla)
- Filtrado por categoría y por ofertas
- Modal de detalle con galería de imágenes
- Botón de agregar al carrito

### Categorías (`categorias.html`)

- Cards de categorías con conteo de productos y ofertas
- Enlace directo a productos filtrados por categoría

### Carrito (`carrito.html`)

- Vista tabla en desktop, cards en móvil
- Gestión de cantidades (+/-)
- Checkout vía WhatsApp (genera mensaje con el resumen del pedido)
- Botón para vaciar carrito

### Admin (`admin.html`)

- Login con contraseña protegida por hash SHA-256
- Dashboard con KPIs (ventas totales, ingresos, ticket promedio, etc.)
- Gráficas de ventas con Chart.js (por día, por categoría, por método de pago)
- Registro manual de ventas con auto-completado desde WhatsApp
- Exportación de ventas a CSV

### Funcionalidad Global

- Navbar responsive con menú hamburguesa
- Búsqueda en tiempo real con resaltado de coincidencias
- Toggle dark/light mode (persiste en `localStorage`)
- Badge de carrito con conteo de items
- Notificaciones toast
- Sistema i18n (internacionalización)
- Caché de datos con TTL configurable

## Estructura del Proyecto

```
ventas/
├── index.html                    # Página de inicio
├── productos.html                # Catálogo de productos
├── categorias.html               # Vista de categorías
├── carrito.html                  # Carrito de compras
├── admin.html                    # Panel de administración
├── config.js                     # Configuración central (API keys, Sheet ID)
├── package.json                  # Metadata del proyecto y scripts
├── .gitignore                    # Archivos ignorados por git
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
│   └── productos/                # Imágenes de productos (opcional)
└── google-apps-script/
    └── Code.gs                   # Google Apps Script (backend de escritura)
```

## Nota de Seguridad

**No subas API keys reales a repositorios públicos.** Si tu repositorio es público:

- Usa restricciones de dominio en tu API Key de Google Cloud
- Considera usar variables de entorno o un archivo `config.local.js` excluido en `.gitignore`
- El hash de la contraseña de admin no reemplaza la autenticación real del lado del servidor — esta es una medida básica para un proyecto personal

---

<details>
<summary><strong>English Version</strong></summary>

# Garage Sale

A garage sale e-commerce website built with HTML, CSS (Tailwind), and vanilla JavaScript, using **Google Sheets** as its database and **Google Apps Script** as a write backend.

## Tech Stack

- **Frontend:** HTML5, vanilla JavaScript (ES6+), Tailwind CSS 3.4
- **Icons:** Lucide Icons
- **Charts:** Chart.js (admin panel)
- **Backend:** Google Sheets API (read) + Google Apps Script (write)
- **Hosting:** Any static server (GitHub Pages, Netlify, etc.)

## Prerequisites

- Google account
- Google Cloud Console project with Google Sheets API enabled
- Google Cloud API Key
- Google Apps Script deployed as a Web App

## Setup

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

> Copy the headers **exactly** as shown in row 1 of each tab. Accents matter.

#### Sample Data

To verify everything works, add these sample rows below the headers:

**Inventario** (row 2):

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| P001 | Silla de madera | Silla rústica en buen estado | Silla de madera de pino, estilo rústico. Tiene algunas marcas de uso pero está firme y funcional. | 150 | 300 | Muebles | silla,madera,rústico | | Disponible | 2026-01-15 |

**Categorías** (row 2):

| A | B | C | D |
|---|---|---|---|
| C001 | Muebles | | Mesas, sillas, libreros y más |

**Ventas** (row 2):

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| V001 | 2026-02-10 14:30:00 | P001 | Silla de madera | 150 | WhatsApp | Efectivo | | Juan |

> **Notes:** The **Imágenes** column can be left empty (a gray placeholder is shown). The **Estado** column can be left empty (defaults to "Disponible"). The **Categoría** value in Inventario must match a **Nombre** in the Categorías tab exactly.

### 2. Get a Google Cloud API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Library** and enable **Google Sheets API**
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**
5. (Optional) Restrict the key to "Google Sheets API" and your domain

### 3. Deploy Google Apps Script

1. Open [Google Apps Script](https://script.google.com) and create a new project
2. Copy the contents of `google-apps-script/Code.gs` into the editor
3. Replace `SPREADSHEET_ID` with your Google Sheet ID
4. Go to **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployment URL

### 4. Configure `config.js`

Open `config.js` and replace the following values:

```js
SHEET_ID: 'YOUR_GOOGLE_SHEET_ID',           // The ID is in the URL: /spreadsheets/d/[ID]/edit
API_KEY: 'YOUR_GOOGLE_CLOUD_API_KEY',
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/.../exec',
WHATSAPP_NUMBER: '521234567890',             // Your number with country code, no +
ADMIN_PASSWORD_HASH: '...',                  // SHA-256 hash of your password
```

To generate the password hash, run this in your browser console:

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('your_password'))
  .then(h => console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,'0')).join('')))
```

## Local Development

Three options to serve the site locally:

```bash
# Option 1: npm (requires Node.js)
npm start

# Option 2: Python
python -m http.server 3000

# Option 3: VS Code
# Install the "Live Server" extension and click "Go Live"
```

## GitHub Pages Deployment

1. Create a repository on GitHub
2. Push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-user/your-repo.git
   git push -u origin main
   ```
3. Go to **Settings → Pages** in your repository
4. Under **Source**, select the `main` branch and `/ (root)` folder
5. (Recommended) In Google Cloud Console, restrict your API Key to the domain `your-user.github.io`

## Page Functionality

### Home (`index.html`)

- Hero section with gradient and CTA
- Featured offers carousel (discounted products)
- Featured categories grid
- Dark/light mode toggle

### Products (`productos.html`)

- Responsive product grid (2–5 columns based on screen size)
- Category and offer filtering
- Detail modal with image gallery
- Add to cart button

### Categories (`categorias.html`)

- Category cards with product and offer counts
- Direct link to category-filtered products

### Cart (`carrito.html`)

- Table view on desktop, cards on mobile
- Quantity management (+/-)
- WhatsApp checkout (generates message with order summary)
- Clear cart button

### Admin (`admin.html`)

- SHA-256 hash-protected password login
- Dashboard with KPIs (total sales, revenue, average ticket, etc.)
- Sales charts with Chart.js (by day, category, payment method)
- Manual sale registration with WhatsApp auto-fill
- CSV export of sales data

### Global Features

- Responsive navbar with hamburger menu
- Real-time search with match highlighting
- Dark/light mode toggle (persisted in `localStorage`)
- Cart badge with item count
- Toast notifications
- i18n (internationalization) system
- Data cache with configurable TTL

## Project Structure

```
ventas/
├── index.html                    # Home page
├── productos.html                # Product catalog
├── categorias.html               # Categories view
├── carrito.html                  # Shopping cart
├── admin.html                    # Admin panel
├── config.js                     # Central config (API keys, Sheet ID)
├── package.json                  # Project metadata and scripts
├── .gitignore                    # Git-ignored files
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
│   └── productos/                # Product images (optional)
└── google-apps-script/
    └── Code.gs                   # Google Apps Script (write backend)
```

## Security Note

**Do not commit real API keys to public repositories.** If your repository is public:

- Use domain restrictions on your Google Cloud API Key
- Consider using environment variables or a `config.local.js` file excluded in `.gitignore`
- The admin password hash does not replace real server-side authentication — this is a basic measure for a personal project

</details>
