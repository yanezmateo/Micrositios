# Arquitectura del Sistema - Pizzería Belgrano

> Este documento se actualiza automáticamente cada vez que se realice una modificación en la arquitectura, base de datos, flujos de datos o componentes clave del sistema.

---

## 1. Diagrama General de Arquitectura

```mermaid
flowchart TB
    %% Estilos de Nodos
    classDef client fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef admin fill:#3b0764,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef cloud fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef db fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef ext fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#fff;
    classDef host fill:#111827,stroke:#64748b,stroke-width:2px,color:#fff;

    subgraph HOSTING["☁️ Hosting & Despliegue (Vercel)"]
        direction TB

        subgraph FRONTEND["🌐 Frontend Web (HTML5 / Vanilla JS / CSS3)"]
            direction TB
            INDEX["📄 index.html<br/>(Hero, Promos, Menú, Cobertura)"]:::client
            MAIN_JS["⚙️ main.js<br/>(Lógica de Carrito, Modales, Swiper)"]:::client

            subgraph CLIENT_MODULES["Módulos de Cliente"]
                CART["🛒 Carrito & Totales<br/>(localStorage)"]:::client
                MODAL_PIZZA["🍕 Modal Personalización<br/>(Masa, Quesos, Gustos)"]:::client
                DISTANCE["📍 Calculador de Envíos<br/>(Distancia y Cobertura)"]:::client
            end

            subgraph ADMIN_MODULES["Panel de Administración"]
                ADMIN_JS["🛠️ admin-panel.js<br/>(Topbar, Formularios, Planilla)"]:::admin
                IMG_COMPRESS["🖼️ Compresión de Fotos<br/>(Canvas en el Navegador)"]:::admin
                PLANILLA["📊 Planilla Modal<br/>(Edición masiva)"]:::admin
            end

            CONFIG_JS["🔑 config.js<br/>(Credenciales Supabase Online)"]:::client
            PRODUCTS_DB["📦 products-db.js<br/>(Caché Local + Sincronizador)"]:::client
        end
    end

    subgraph BACKEND["⚡ Backend & Base de Datos (Supabase Cloud)"]
        direction TB
        SUBA_API["🔌 Supabase Client API<br/>(REST & Realtime)"]:::cloud
        SUBA_AUTH["🔐 Auth Configuración<br/>(Tabla de Claves)"]:::db
        POSTGRES[("🗄️ PostgreSQL Database<br/>- Tabla 'productos'<br/>- Tabla 'configuracion'")]:::db
        STORAGE[("🪣 Supabase Storage<br/>Bucket: 'fotos-productos'")]:::db
    end

    subgraph EXTERNAL["📲 Servicios Externos"]
        WHATSAPP["💬 WhatsApp API<br/>(wa.me / 092 884 951)"]:::ext
        LEAFLET["🗺️ OpenStreetMap / Geocoding<br/>(Validación de direcciones)"]:::ext
    end

    %% Relaciones y Flujos de Datos
    INDEX --> MAIN_JS
    MAIN_JS --> CART
    MAIN_JS --> MODAL_PIZZA
    MAIN_JS --> DISTANCE

    INDEX --> ADMIN_JS
    ADMIN_JS --> IMG_COMPRESS
    ADMIN_JS --> PLANILLA

    MAIN_JS <--> PRODUCTS_DB
    ADMIN_JS <--> PRODUCTS_DB
    CONFIG_JS --> PRODUCTS_DB

    CART -- "Genera pedido formateado" --> WHATSAPP
    DISTANCE -- "Consulta coordenadas" --> LEAFLET

    PRODUCTS_DB <-->|"Sincronización CRUD"| SUBA_API
    SUBA_API <--> POSTGRES
    SUBA_API <--> STORAGE
    ADMIN_JS -- "Subida directa de fotos optimizadas" --> STORAGE
    ADMIN_JS -- "Validación de contraseña" --> SUBA_AUTH
```

---

## 2. Mapa de Capas del Proyecto

### A. Capa de Presentación (Frontend)
* **Archivo base:** `PizzeriaBelgrano/index.html`
* **Estilos:** `PizzeriaBelgrano/css/main.css` (estética oscura con detalles dorados artesanales) y `admin.css`.
* **Interactividad y Menú:** `PizzeriaBelgrano/js/main.js`
  * Control del carrito lateral (`cart-drawer`).
  * Modal de personalización de pizzas (tipo de masa, quesos, ingredientes adicionales).
  * Carruseles táctiles por categoría (Pizzas, Promos, Sándwiches, Fainá, Lehmeyun, Bebidas) mediante Swiper.js.
  * Validador de cobertura y cálculo de costo de envío según distancia.

### B. Capa de Administración & Edición
* **Archivo:** `PizzeriaBelgrano/js/admin-panel.js`
* **Acceso:** Login discreto desde el header con validación híbrida (local instantánea + consulta a tabla `configuracion` en Supabase).
* **Gestión:** 
  * Edición en tarjeta directa o a través de la **Planilla** de carga masiva.
  * Compresor de imágenes en el cliente mediante HTML5 Canvas (reduce fotos pesadas antes de enviarlas).

### C. Capa de Datos y Persistencia
* **Caché y fallback local:** `PizzeriaBelgrano/js/products-db.js`
  * Carga instantánea del catálogo base en memoria y `localStorage` para velocidad de 0ms sin esperas de red.
* **Base de datos remota:** **Supabase PostgreSQL**
  * Tabla `productos`: id, nombre, descripción, precio, categoría, imagen_url, variantes, activo.
  * Tabla `configuracion`: claves de administración y parámetros globales.
* **Almacenamiento de multimedia:** **Supabase Storage**
  * Bucket público: `fotos-productos` con CDN global de alta velocidad.

### D. Hosting y Conexiones Externas
* **Hosting:** **Vercel** (`PizzeriaBelgrano/vercel.json`), despliegue automático desde GitHub.
* **Checkout:** **WhatsApp Web / App** (`wa.me/59892884951`) con mensaje estructurado (artículos, gustos seleccionados, total y dirección).
