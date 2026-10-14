# 🍕 Guía Paso a Paso: Conexión de Pizzería Belgrano con Google Sheets

Esta guía te explica cómo conectar la página web a **Google Sheets** para que el dueño pueda editar precios, agregar nuevos platos, cambiar fotos y eliminarlos tanto desde la propia página web como directamente desde su planilla de Google (en la computadora o desde la app del celular).

---

## ⚡ ¿Cómo funciona?

1. **La web tiene un Modo Administrador:**
   - Hacés clic en el ícono de usuario (arriba a la derecha).
   - Ingresás con:
     - **Usuario:** `admin`
     - **Contraseña:** `1111`
   - Se activa la barra superior del dueño y sobre cada producto aparecen botones para **[✏️ Editar]** y **[🗑️ Eliminar]**, más un botón **[➕ Nuevo Producto]**.

2. **Google Sheets actúa como Base de Datos en la Nube:**
   - Cuando guardás un cambio o agregás un producto en la web, se actualiza automáticamente en Google Sheets.
   - Si cambiás un precio en Google Sheets directamente, la web lo descarga y actualiza los precios para todos los clientes en tiempo real.
   - Si aún no configuraste la planilla, la web funciona igual guardando todo en el navegador (`localStorage`) sin romperse.

---

## 🛠️ Paso 1: Crear la hoja de Google Sheets

1. Entrá a [sheets.new](https://sheets.new) (o abrí Google Drive y creá una hoja de cálculo en blanco).
2. Nombrá la hoja como quieras (por ejemplo: `Pizzería Belgrano - Productos`).

---

## 💻 Paso 2: Pegar el Script Backend

1. En el menú superior de Google Sheets, hacé clic en **Extensiones** > **Apps Script**.
2. Se abrirá una pestaña con un editor de código.
3. Borrá cualquier código que aparezca en pantalla.
4. Abrí el archivo [`google-sheets-backend.gs`](file:///c:/Users/Mateo/Desktop/Micrositios/pizzeriaBelgrano/google-sheets-backend.gs) que dejamos en esta carpeta, copialo todo y pegalo en el editor de Google.
5. Hacé clic en el ícono de **Guardar** (el disco 💾).

---

## 🚀 Paso 3: Publicar la Aplicación Web (Deploy)

1. Arriba a la derecha, hacé clic en el botón azul **Implementar** (o *Deploy*) > **Nueva implementación**.
2. En el engranaje ⚙️ (Seleccionar tipo), elegí **Aplicación web**.
3. Completá estos 3 campos:
   - **Descripción:** `PizzeríaBelgrano`
   - **Ejecutar como:** `Yo (tu correo de Google)`
   - **Quién tiene acceso:** ⚠️ **Cualquier usuario** *(Anyone)* — *¡Muy importante para que la web pueda conectarse sin pedir iniciar sesión de Google a los clientes!*
4. Hacé clic en **Implementar**.
5. Si te pide autorizar permisos, hacé clic en **Revisar permisos**, seleccioná tu cuenta de Google, hacé clic en *Avanzado* > *Ir a PizzeríaBelgrano (no seguro)* y **Permitir**.
6. Google te va a mostrar una ventana con la **URL de la aplicación web** (termina en `/exec`). Copiá esa URL.

---

## 🔗 Paso 4: Conectar y Cargar los Productos en 1 Clic

1. Abrí tu página web (`index.html`) en el navegador.
2. Hacé clic en el ícono de usuario arriba a la derecha y logueate con `admin` y `1111`.
3. En la barra superior negra de administrador, hacé clic en **Google Sheets**.
4. En el campo *"URL de tu Aplicación Web de Google Apps Script"*, pegá la URL que copiaste en el Paso 3.
5. Hacé clic en **Guardar URL**.
6. Hacé clic en el botón verde **"Exportar Todo a Sheets"**.
   - ¡Listo! En 2 segundos vas a ver cómo tu hoja de cálculo de Google se llena automáticamente con todas las pizzas, sándwiches, fainá, lemeyun, combos y bebidas organizados en español con colores y columnas.

---

## 📋 Encabezados en Español de tu Google Sheet

La hoja tendrá las columnas completamente en español:

| Columna | Encabezado | Descripción | Ejemplo |
|---|---|---|---|
| A | `ID` | Identificador único del producto | `pizza-margarita` |
| B | `Nombre` | Nombre del producto | `Pizza Margarita` |
| C | `Categoria` | Categoría (`pizzas`, `sandwiches`, `faina`, `lemeyun`, `bebidas`, `promos`) | `pizzas` |
| D | `Precio` | Precio actual en pesos uruguayos | `420` |
| E | `Precio_Anterior` | **Precio anterior tachado para ofertas** (opcional) | `490` |
| F | `Descripcion` | Descripción apetitosa para el cliente | `Salsa de tomate casera, mozzarella...` |
| G | `Ingredientes` | Ingredientes separados por coma (para personalización) | `Salsa, Mozzarella, Albahaca` |
| H | `Variantes` | Sabores para bebidas (separados por coma) | `Común, Zero, Light` |
| I | `Imagen` | Ruta local (`images/...`) o enlace web (`https://...`) | `images/product-1.png` |
| J | `Etiqueta` | Etiqueta destacada opcional | `Más Vendido`, `Favorito` |
| K | `Activo` | Si está visible en el menú | `TRUE` |

---

## 🔐 Pestaña "Configuracion" (Contraseña del Dueño)

En la parte inferior de tu hoja de Google Sheets vas a ver una segunda pestaña llamada **`Configuracion`**.

| Fila | Usuario | Contraseña | Nota |
|---|---|---|---|
| 2 | `admin` | `1111` | Podés cambiar la contraseña aquí en la celda B2 |

### ¿Es seguro guardarla en el Sheet?
**Sí, 100% seguro.** Tu hoja de cálculo de Google Drive es privada y solo vos (con tu correo de Google) podés abrirla. Además, el script de la web **nunca hace pública esta contraseña** a los clientes visitantes; solo la consulta internamente cuando alguien intenta iniciar sesión como administrador.

### ¿Cómo cambiar la contraseña?
Tenés 2 formas súper fáciles:
1. **Desde la misma página web:** Entrás con tu clave actual, tocás el botón amarillo **[🔑 Clave]** en la barra superior de administrador, escribís tu nueva contraseña y tocás *Guardar*. Se actualiza en la web y en tu Google Sheet automáticamente.
2. **Directamente en Google Sheets:** Abrís tu planilla, vas a la pestaña **`Configuracion`** y cambiás el texto de la celda **B2** por la contraseña que vos quieras (ejemplo: `BelgranoPizza2026`). ¡A partir de ese instante esa será tu nueva clave!

## ❓ ¿Por qué hay una columna "Precio_Anterior"?

Es para **promociones y descuentos tachados**:
* Si querés mostrar una oferta especial (ejemplo: un combo que antes salía $580 y ahora está a $490), en `Precio_Anterior` ponés `580` y en `Precio` ponés `490`. La web mostrará ~~$580~~ **$490** y un cartel verde que dice *"Ahorrá $90"*.
* **Si es un producto normal sin descuento:** simplemente dejás esa celda **vacía** y la web solo mostrará el precio regular.

---

## 📸 ¿Cómo subir fotos de las pizzas y dónde se guardan en Drive?

¡Ya no hace falta usar sitios externos como Imgur o Postimages ni copiar enlaces raros! El sistema ahora lo hace 100% automático y ordenado:

### 📁 Estructura ordenada en tu Google Drive:
Todas las fotos y tu planilla quedan impecablemente organizadas en tu Drive dentro de:
```text
Mi Unidad
 └── Micrositios
      └── LaBelgrano
           ├── 📊 Pizzería Belgrano - Productos (tu Google Sheet)
           └── 📁 imagenes/ (aquí se guardan todas las fotos de los productos)
```

> **¿Cómo ordenar tu Drive con 1 clic?**
> * **Desde la web:** En la barra de administrador tocá **[Google Sheets]** y hacé clic en **[📁 Organizar Drive: Micrositios / LaBelgrano]**.
> * **O desde Google Sheets:** En el menú superior de tu planilla vas a ver un nuevo menú **"🍕 Pizzería Belgrano"** > **"📁 Organizar Drive"**.
> * ¡Crea las carpetas y mueve el archivo automáticamente sin que tengas que hacer nada a mano!

---

### 🌟 Subir foto desde el celular o desde la PC en 1 Clic
1. Entrás a la web con tu contraseña de administrador (`1111`).
2. Tocás **[➕ Nuevo Producto]** o **[✏️ Editar]** en cualquier pizza o plato.
3. Tocás el botón naranja grande **📸 "Sacar Foto con el Celular / Elegir Archivo"**.
4. Sacás la foto en el momento con la cámara de tu celular o elegís una de tu galería / computadora.
5. Tocás **"Guardar Producto"**:
   - La web optimiza la imagen en milisegundos para que suba súper rápido.
   - La guarda automáticamente dentro de tu carpeta **`Micrositios / LaBelgrano / imagenes/`** en Google Drive.
   - Coloca el enlace directo de Google Drive en la columna `Imagen` de tu Google Sheet.
   - ¡Y listo! La foto queda visible inmediatamente para todos los clientes en la carta.

### Opción 2: Fotos prediseñadas del sistema
En el mismo formulario podés abrir el acordeón *"O elegir una foto prediseñada del sistema"* y seleccionar entre más de 15 fotos de pizzas, fainás y bebidas ya listas.

### Opción 3: Enlace web manual o imágenes de la carpeta local
Si tenés un enlace web directo (`https://...`) o querés usar un archivo de la carpeta `images/`, podés escribirlo en el campo de texto manual como antes.

---

## 🌐 ¿Si lo subís a Git/GitHub queda funcional y se actualiza siempre o se pierde?

### **¡Queda 100% funcional para siempre y NUNCA se pierde nada!**

* **¿Por qué?** Porque los datos (precios, descripciones, productos agregados o eliminados) **no se guardan en Git**, sino en la nube de tu **Google Drive (Google Sheets)**.
* Git solo almacena el diseño y el código de la página.
* Cada vez que un cliente entra a tu web en GitHub Pages o cualquier hosting, la página le pide los datos en vivo a tu Google Sheet.
* Si el dueño cambia un precio en Google Sheets desde el celular, **el cambio se refleja en la página web pública de inmediato para todos los clientes del mundo**, sin necesidad de volver a hacer `git push`.

### ⚠️ El único detalle para dejarlo listo en Git:
Para que cualquier persona que entre a la web en internet se conecte a tu Google Sheet automáticamente sin tener que configurar nada, abrí el archivo [`js/config.js`](file:///c:/Users/Mateo/Desktop/Micrositios/pizzeriaBelgrano/js/config.js) y pegá tu URL de Google Apps Script entre las comillas:

```javascript
window.PIZZERIA_CONFIG = {
    gasUrl: 'https://script.google.com/macros/s/TU_CODIGO_AQUI/exec'
};
```

Hacés `git commit` y `git push` con ese archivo, ¡y tu web quedará conectada de por vida a tu Google Sheets en producción!
