# 🍕 Pizzería Belgrano — Web App & Menú Digital Interactivo

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://pizzeriabelgrano.vercel.app/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Mobile First](https://img.shields.io/badge/Design-Mobile%20First-orange?style=flat)](#características-destacadas)
[![Status](https://img.shields.io/badge/Status-Producción-success?style=flat)](#)

> Sitio web comercial y sistema de pedidos en línea diseñado para **Pizzería Belgrano** (Montevideo, Uruguay). Desarrollado con enfoque **Mobile-First**, arquitectura serverless en la nube y panel de administración en tiempo real para el comerciante.

🔗 **Sitio web en vivo:** [https://pizzeriabelgrano.vercel.app/](https://pizzeriabelgrano.vercel.app/)

---

## ✨ Características Destacadas

### 📱 Para los Clientes (Experiencia Móvil de Primera)
* **Diseño Mobile-First Optimizado:** Interfaz moderna, rápida e intuitiva, 100% adaptada para celulares con soporte para áreas seguras (`safe-area-inset`) en iOS Safari y Android.
* **Catálogo & Menú Digital Interactivo:** Filtro por categorías (Pizzas, Sándwiches, Fainá, Promos), personalización de ingredientes y visualización de precios claros.
* **Carrito de Pedidos en Vivo:** Selección rápida de productos con resumen dinámico de compra.
* **Envío Directo a WhatsApp:** Generación automática del mensaje con el detalle del pedido, dirección, método de pago y total para enviar al WhatsApp del local con un solo toque.
* **Información Comercial Completa:** Horarios de atención, zona de cobertura delivery interactiva y reseñas verificadas de Google Maps.

### 🛡️ Para el Dueño (Modo Administrador Integrado)
* **Acceso Seguro In-App:** Acceso mediante login integrado con contraseña modificable en la nube.
* **Gestión de Menú en Tiempo Real:** Creación, edición de precios y eliminación de platos con reflejo inmediato en el sitio sin necesidad de reprogramar.
* **Subida Directa de Fotos desde el Celular:** Carga de imágenes directo desde la cámara o galería al bucket de almacenamiento CDN en la nube (**Supabase Storage**).
* **Editor Tipo Planilla (Spreadsheet View):** Modal de edición masiva para cambiar rápidamente múltiples precios y datos en formato tabla, ideal para ajustes rápidos de carta.
* **Sincronización en la Nube:** Conexión directa a base de datos relacional PostgreSQL en Supabase con tolerancia a fallos y fallback en almacenamiento local.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | HTML5 semántico, CSS3 moderno (Variables CSS, Flexbox, Grid, Animaciones, Bottom Sheets táctiles), Vanilla JavaScript (ES6+ modular) |
| **Librerías UI** | [Swiper.js](https://swiperjs.com/) (Carruseles táctiles), [FontAwesome 6](https://fontawesome.com/) (Iconografía vectorial) |
| **Base de Datos & Storage** | [Supabase](https://supabase.com/) (PostgreSQL + CDN Cloud Storage para fotografías) |
| **Hosting & CI/CD** | [Vercel](https://vercel.com/) (Despliegues automáticos desde Git, Edge Network, soporte SSL y dominio personalizado `.uy`) |

---

## 📁 Estructura del Proyecto

```text
├── PizzeriaBelgrano/
│   ├── css/
│   │   ├── admin.css           # Estilos del panel de control y modales de gestión
│   │   ├── main.css            # Estilos principales de la web pública y diseño responsive
│   │   └── ...
│   ├── js/
│   │   ├── admin-panel.js      # Controlador de la barra de administración y modales
│   │   ├── config.js           # Configuración global y credenciales de conexión
│   │   ├── main.js             # Lógica de navegación, filtros y carrito WhatsApp
│   │   └── products-db.js      # Capa de datos, Supabase client y caché
│   ├── images/                 # Recursos gráficos, logotipos e imágenes estáticas
│   ├── webfonts/               # Fuentes vectoriales de FontAwesome
│   ├── GUIA_SUPABASE_VERCEL.md # Manual de usuario y administración para el cliente
│   ├── index.html              # Estructura principal de la aplicación web
│   └── vercel.json             # Reglas de seguridad y encabezados de caché en producción
├── .gitignore
└── README.md
```

---

## 🚀 Despliegue y Configuración

El proyecto está configurado para desplegarse automáticamente en **Vercel** ante cada `git push` a la rama `main`.

1. **Clonar repositorio:**
   ```bash
   git clone https://github.com/yanezmateo/PizzeriaBelgrano.git
   ```
2. **Entorno local:** Abrir `PizzeriaBelgrano/index.html` con cualquier servidor local (como Live Server en VS Code).

---

## 📄 Licencia y Créditos

Proyecto desarrollado por [Mateo Yáñez](https://github.com/yanezmateo) para **Pizzería Belgrano** (Montevideo, Uruguay).
