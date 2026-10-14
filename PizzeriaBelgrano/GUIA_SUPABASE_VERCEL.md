# 🍕 Pizzería Belgrano | Guía de Gestión (Supabase & Vercel)

Esta guía explica cómo funciona la nueva arquitectura en la nube de **Pizzería Belgrano**, conectada directamente a **Supabase (Base de datos PostgreSQL + Storage de Fotos)** y desplegada en **Vercel** con soporte para dominio propio (`labelgrano.uy`).

---

## 🚀 Ventajas de la Nueva Arquitectura

1. **Velocidad Instantánea (<50ms):** Las pizzas y productos cargan de inmediato para los clientes desde cualquier celular o PC.
2. **Fotos en CDN Global:** Al sacar una foto con el celular o subirla desde la computadora, se optimiza y se guarda en Supabase Storage (`fotos-productos`), quedando disponible al instante en internet.
3. **Editor Visual tipo Excel:** El dueño puede modificar precios, descripciones o fotos tanto desde la página web como desde el panel visual de Supabase.
4. **Despliegues Automáticos:** Cada cambio en el código se publica automáticamente en Vercel en segundos.

---

## 🔐 Modo Dueño / Administrador en la Web

### ¿Cómo ingresar al Panel de Administración?
1. Entrá a tu sitio web (ej: `https://pizzeriabelgrano.vercel.app/` o tu dominio `https://labelgrano.uy/`).
2. Hacé clic en el ícono de usuario 👤 arriba a la derecha.
3. Ingresá:
   - **Usuario:** `admin`
   - **Contraseña:** `1111` (o tu nueva clave si la cambiaste).
4. Se abrirá la **Barra Superior de Administrador (Modo Dueño)** en la parte superior de la pantalla.

### Acciones disponibles en la barra:
* **[➕ Nuevo Producto]:** Agrega una nueva pizza, sándwich, fainá, lemeyun o bebida a la carta.
* **[💾 Base de Datos]:** Muestra el estado de la conexión en vivo con Supabase, botón para refrescar catálogo y enlace directo al editor visual.
* **[🔑 Clave]:** Te permite cambiar la contraseña del administrador.
* **[🚪 Salir]:** Cierra la sesión del administrador y vuelve a la vista normal de cliente.
* **[✏️ Editar / 🗑️ Eliminar] en cada tarjeta:** Cada plato de la carta tiene botones directos para cambiar precios al instante o eliminarlo.

---

## 📸 ¿Cómo Subir Fotos de los Productos en 1 Clic?

1. En el modo administrador, tocá **[➕ Nuevo Producto]** o **[✏️ Editar]** en cualquier plato.
2. Tocá el botón naranja grande **📸 "Sacar Foto con el Celular / Elegir Archivo"**.
3. Sacás la foto en el momento con la cámara de tu celular o seleccionás una foto de tu galería / PC.
4. Tocás **"Guardar Producto"**:
   - La página comprime la foto en milisegundos para que no pese de más.
   - La sube directamente a tu almacenamiento en la nube de **Supabase Storage** (`fotos-productos`).
   - La vincula con el producto y queda visible al instante para todos los clientes en la carta.

---

## 📊 ¿Cómo Editar Productos desde el Editor Visual de Supabase (Estilo Excel)?

Si preferís editar varios precios o textos todos juntos en una planilla:

1. Entrá a tu panel de [supabase.com](https://supabase.com).
2. En el menú de la izquierda, hacé clic en **Table Editor** (el ícono de tabla ▦) y seleccioná la tabla **`productos`**.
3. Vas a ver todos los platos en filas y columnas exactamente igual que en Excel o Google Sheets:
   - Hacé doble clic en cualquier celda (ej: columna `precio`) para cambiar el valor.
   - Presioná Enter para guardar.
4. ¡El cambio impacta de inmediato en la página web para todos los visitantes!

---

## 🌐 Conectar tu Dominio Propio `labelgrano.uy` en Vercel

Cuando compres el dominio en Antel / NIC.uy:

1. Entrá a [vercel.com](https://vercel.com) y abrí el proyecto **`pizzeriabelgrano`**.
2. Andá a **Settings** > **Domains**.
3. Escribí `labelgrano.uy` y tocá **Add**.
4. Vercel te mostrará 2 registros:
   - Tipo **A** con una dirección IP (ej: `76.76.21.21`).
   - Tipo **CNAME** apuntando a `cname.vercel-dns.com`.
5. Entrás al panel donde compraste el dominio, agregás esos registros DNS y guardás.
6. En pocos minutos, tu pizzería estará funcionando en `https://labelgrano.uy` con candadito SSL de seguridad automático.
