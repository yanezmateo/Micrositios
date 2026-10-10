# Plan de Proyecto: Sistema de Ventas Automatizado (IG + Micrositio Estático)

## 1. Objetivo del Proyecto
Crear un sistema híbrido que combine automatización en redes sociales y desarrollo web estático para eliminar cuellos de botella en la atención al cliente de negocios locales (ej. pizzerías, locales de comida, canchas). El sistema debe capturar leads desde comentarios/DMs en Instagram, derivarlos a un micrositio ultrarrápido de conversión y entregar el pedido procesado y estructurado directo al WhatsApp del local.

## 2. Arquitectura y Herramientas
*   **Automatización de DM (Trigger):** CreatorFlow, LinkDM o ManyChat (Capa gratuita para la demo).
*   **Frontend (Micrositio):** HTML5, CSS3 (o Tailwind CSS) y JavaScript (Vanilla).
*   **Procesamiento:** Lógica en el cliente (JS del navegador) para capturar datos y formatear el pedido.
*   **Cierre de Venta:** API pública de WhatsApp (`wa.me`).
*   **Hosting:** GitHub Pages, Netlify o Vercel (Gratuito, rápido, ideal para sitios estáticos).

## 3. Flujo del Usuario (User Journey)
1.  **Atracción:** El usuario comenta "Menú" o "Precio" en un Reel/Post de Instagram, o hace clic en el link de la bio.
2.  **Derivación:** El bot de IA responde al instante por DM enviando el enlace único del micrositio.
3.  **Selección:** El usuario entra al micrositio estático y selecciona los productos en un catálogo visual ligero.
4.  **Checkout Local:** El usuario completa un mini-formulario con Nombre, Dirección y Medio de Pago dentro de la misma web.
5.  **Conversión a Payload:** JavaScript toma el carrito y los datos, armando un texto estructurado.
6.  **Cierre (WhatsApp):** El usuario hace clic en "Enviar Pedido", abriendo su WhatsApp con el mensaje pre-redactado y dirigido al número del local.

## 4. Estructura de Archivos del Micrositio
Al ser estático, el proyecto se mantendrá lo más simple y modular posible (aunque programemos todo en un solo archivo final para Antigravity si es necesario):
*   `index.html`: Estructura del catálogo y modal del carrito/formulario.
*   `styles.css` (o clases utilitarias): Diseño *Mobile-First*, UI limpia con pocos clics (fricción cero).
*   `app.js`: 
    *   Lógica para agregar/quitar productos del carrito.
    *   Cálculo del total.
    *   Captura del formulario.
    *   Función `generarEnlaceWhatsApp()`.

## 5. Hoja de Ruta de Desarrollo (Siguientes Pasos)
*   [ ] **Fase 1: Maquetado del Micrositio (UI/UX)**
    *   Crear la estructura HTML base.
    *   Diseñar las tarjetas de productos y el botón flotante del carrito.
    *   Diseñar el formulario de checkout.
*   [ ] **Fase 2: Lógica de JavaScript (El Motor)**
    *   Programar el estado del carrito (arrays/objetos).
    *   Programar la función que formatea el texto para la URL de WhatsApp (`encodeURIComponent`).
*   [ ] **Fase 3: Pruebas y Deploy**
    *   Testear el botón final para asegurar que WhatsApp abre correctamente.
    *   Subir el código al hosting gratuito (Vercel/GitHub Pages).
*   [ ] **Fase 4: Configuración del Bot (Instagram)**
    *   Crear cuenta de prueba en Instagram.
    *   Vincular plataforma de automatización.
    *   Crear regla: Palabra clave -> Respuesta con el link del deploy.