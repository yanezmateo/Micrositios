/**
 * ==========================================================================
 * PIZZERÍA BELGRANO - GOOGLE APPS SCRIPT BACKEND
 * ==========================================================================
 * 
 * Este script se pega en Google Sheets (Extensiones > Apps Script)
 * y permite que la página web lea y actualice productos en tiempo real.
 * 
 * INSTRUCCIONES DE INSTALACIÓN RÁPIDA:
 * 1. En Google Sheets, crea una hoja de cálculo en blanco (ej: "Pizzería Belgrano - Productos").
 * 2. En el menú superior, ve a "Extensiones" > "Apps Script".
 * 3. Borra todo el código que aparezca y pega este archivo completo.
 * 4. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 5. Selecciona tipo: "Aplicación web".
 *    - Descripción: "API Pizzería Belgrano"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone) -> IMPORTANTE para que la web pueda conectarse.
 * 6. Haz clic en "Implementar" y copia la "URL de la aplicación web".
 * 7. Pega esa URL en el panel de administrador de la página web (o en el modal de configuración).
 * ==========================================================================
 */

const SHEET_NAME = 'Productos';
const CONFIG_SHEET_NAME = 'Configuracion';
const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_ADMIN_PASS = '1111';

/**
 * Obtiene o crea la pestaña de Configuración con usuario y contraseña del dueño
 */
function getOrCreateConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let cfgSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  
  if (!cfgSheet) {
    cfgSheet = ss.insertSheet(CONFIG_SHEET_NAME);
    const headers = ['Usuario', 'Contraseña', 'Nota', 'Ultima_Modificacion'];
    cfgSheet.appendRow(headers);
    cfgSheet.appendRow([DEFAULT_ADMIN_USER, DEFAULT_ADMIN_PASS, 'Podés cambiar la contraseña aquí en la celda B2', new Date().toISOString()]);
    
    const range = cfgSheet.getRange(1, 1, 1, headers.length);
    range.setBackground('#18181b');
    range.setFontColor('#ffffff');
    range.setFontWeight('bold');
    cfgSheet.setFrozenRows(1);
    cfgSheet.autoResizeColumns(1, headers.length);
  }
  
  return cfgSheet;
}

/**
 * Obtiene las credenciales vigentes desde la pestaña de Configuración
 */
function getAdminCredentials() {
  try {
    const cfgSheet = getOrCreateConfigSheet();
    const userVal = String(cfgSheet.getRange(2, 1).getValue() || DEFAULT_ADMIN_USER).trim();
    const passVal = String(cfgSheet.getRange(2, 2).getValue() || DEFAULT_ADMIN_PASS).trim();
    return {
      user: userVal || DEFAULT_ADMIN_USER,
      pass: passVal || DEFAULT_ADMIN_PASS
    };
  } catch (e) {
    return { user: DEFAULT_ADMIN_USER, pass: DEFAULT_ADMIN_PASS };
  }
}

// Nombres de columnas de la hoja en Español
const HEADERS = [
  'ID',
  'Nombre',
  'Categoria',
  'Precio',
  'Precio_Anterior',
  'Descripcion',
  'Ingredientes',
  'Variantes',
  'Imagen',
  'Etiqueta',
  'Activo'
];

/**
 * Obtiene o crea la hoja de Productos con encabezados en español y con estilo
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Eliminar hojas vacías por defecto si existen y no son la única
    const sheets = ss.getSheets();
    if (sheets.length > 1 && sheets[0].getName() === 'Hoja 1') {
      try { ss.deleteSheet(sheets[0]); } catch (e) {}
    }
  }

  // Verificar si tiene encabezados o si hay que actualizarlos a español
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#c2410c'); // Color terracota artesanal
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  } else {
    // Si ya existe la fila 1 pero estaba en inglés ('id', 'name', etc.), la actualizamos a español
    const firstCell = String(sheet.getRange(1, 1).getValue() || '').trim().toLowerCase();
    if (firstCell === 'id') {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground('#c2410c');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
    }
  }

  return sheet;
}

/**
 * Helper para responder en JSON con CORS habilitado
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Guarda una imagen en base64 directamente en la carpeta de Google Drive del dueño
 * y devuelve el enlace público directo a la imagen.
 */
function saveImageToDrive(base64Data, filename) {
  try {
    if (!base64Data || typeof base64Data !== 'string') return null;

    let base64String = base64Data;
    let contentType = 'image/jpeg';
    
    if (base64Data.indexOf('data:') === 0) {
      const parts = base64Data.split(',');
      const meta = parts[0];
      base64String = parts[1];
      const match = meta.match(/data:([^;]+)/);
      if (match) contentType = match[1];
    }
    
    const bytes = Utilities.base64Decode(base64String);
    const blob = Utilities.newBlob(bytes, contentType, filename || ('producto_' + Date.now() + '.jpg'));
    
    const folderName = 'Pizzería Belgrano - Fotos';
    const folders = DriveApp.getFoldersByName(folderName);
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // lh3.googleusercontent.com/d/FILE_ID es el CDN directo y rápido de Google Drive
    return 'https://lh3.googleusercontent.com/d/' + file.getId();
  } catch (err) {
    Logger.log('Error guardando imagen en Google Drive: ' + err);
    return null;
  }
}

/**
 * GET: Obtener lista de todos los productos
 * URL: https://script.google.com/macros/s/.../exec
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createJsonResponse({
        status: 'success',
        count: 0,
        products: []
      });
    }

    const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const products = [];

    data.forEach(row => {
      const id = String(row[0] || '').trim();
      const active = row[10] === '' || row[10] === true || String(row[10]).toLowerCase() === 'true' || row[10] === 1;

      if (id && active) {
        products.push({
          id: id,
          name: String(row[1] || ''),
          category: String(row[2] || 'pizzas'),
          price: Number(row[3]) || 0,
          old_price: row[4] ? Number(row[4]) : null,
          desc: String(row[5] || ''),
          ingredients: String(row[6] || ''),
          variants: String(row[7] || ''),
          image: String(row[8] || 'images/product-1.png'),
          badge: String(row[9] || ''),
          active: active
        });
      }
    });

    return createJsonResponse({
      status: 'success',
      count: products.length,
      products: products
    });
  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * POST: Acciones de administración (syncAll, update, add, delete, login, test)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || 'test';
    const sheet = getOrCreateSheet();

    // 1. Probar conexión
    if (action === 'test') {
      return createJsonResponse({
        status: 'success',
        message: '¡Conexión establecida con Google Sheets correctamente!',
        sheetName: sheet.getName()
      });
    }

    // 2. Login de Administrador (valida contra la pestaña 'Configuracion' del Google Sheet)
    if (action === 'login') {
      const creds = getAdminCredentials();
      const user = String(payload.username || '').trim().toLowerCase();
      const pass = String(payload.password || '').trim();

      const validUser = user === creds.user.toLowerCase() || (creds.user.toLowerCase() === 'admin' && user.includes('admin'));
      const validPass = pass === creds.pass;

      if (validUser && validPass) {
        return createJsonResponse({
          status: 'success',
          authenticated: true,
          message: 'Autenticación exitosa como administrador'
        });
      } else {
        return createJsonResponse({
          status: 'error',
          authenticated: false,
          message: 'Usuario o contraseña incorrectos'
        });
      }
    }

    // 2.1 Cambiar Contraseña del Administrador
    if (action === 'changePassword') {
      const creds = getAdminCredentials();
      const currentPass = String(payload.currentPassword || '').trim();
      const newPass = String(payload.newPassword || '').trim();

      if (!newPass || newPass.length < 3) {
        return createJsonResponse({
          status: 'error',
          message: 'La nueva contraseña debe tener al menos 3 caracteres.'
        });
      }

      if (currentPass !== creds.pass) {
        return createJsonResponse({
          status: 'error',
          message: 'La contraseña actual ingresada no coincide.'
        });
      }

      const cfgSheet = getOrCreateConfigSheet();
      cfgSheet.getRange(2, 2).setValue(newPass);
      cfgSheet.getRange(2, 4).setValue(new Date().toISOString());

      return createJsonResponse({
        status: 'success',
        message: '¡Contraseña actualizada con éxito en Google Sheets!'
      });
    }

    // 3. Sincronización Inicial Masiva (SyncAll / Exportar todo a Sheets)
    if (action === 'syncAll') {
      // Aseguramos que la pestaña de Configuración también se inicialice
      getOrCreateConfigSheet();

      const products = payload.products || [];
      if (!Array.isArray(products) || products.length === 0) {
        return createJsonResponse({
          status: 'error',
          message: 'No se enviaron productos válidos para sincronizar'
        });
      }

      // Borrar filas existentes preservando encabezado
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }

      const rowsToAppend = products.map(p => [
        p.id || 'prod-' + Date.now(),
        p.name || '',
        p.category || 'pizzas',
        Number(p.price) || 0,
        p.old_price ? Number(p.old_price) : '',
        p.desc || '',
        p.ingredients || '',
        p.variants || '',
        p.image || 'images/product-1.png',
        p.badge || '',
        p.active !== false
      ]);

      if (rowsToAppend.length > 0) {
        sheet.getRange(2, 1, rowsToAppend.length, HEADERS.length).setValues(rowsToAppend);
        sheet.autoResizeColumns(1, HEADERS.length);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Catálogo sincronizado exitosamente en Google Sheets',
        count: rowsToAppend.length
      });
    }

    // 4. Agregar un nuevo producto
    if (action === 'add') {
      const p = payload.product;
      if (!p || !p.id || !p.name) {
        return createJsonResponse({
          status: 'error',
          message: 'Datos incompletos del producto'
        });
      }

      // Si enviaron una foto en base64 desde el celular o PC, la guardamos en Google Drive automáticamente
      if (p.imageBase64) {
        const driveUrl = saveImageToDrive(p.imageBase64, p.id + '.jpg');
        if (driveUrl) {
          p.image = driveUrl;
        }
      }

      sheet.appendRow([
        p.id,
        p.name,
        p.category || 'pizzas',
        Number(p.price) || 0,
        p.old_price ? Number(p.old_price) : '',
        p.desc || '',
        p.ingredients || '',
        p.variants || '',
        p.image || 'images/product-1.png',
        p.badge || '',
        true
      ]);

      return createJsonResponse({
        status: 'success',
        message: 'Producto agregado exitosamente a Google Sheets y Drive',
        product: p,
        imageUrl: p.image
      });
    }

    // 5. Actualizar un producto existente
    if (action === 'update') {
      const idToUpdate = String(payload.id || (payload.product && payload.product.id) || '').trim();
      const p = payload.product || payload.data || {};

      if (!idToUpdate) {
        return createJsonResponse({
          status: 'error',
          message: 'Se requiere ID del producto a actualizar'
        });
      }

      // Si enviaron una nueva foto en base64 desde el celular o PC, la guardamos en Google Drive automáticamente
      if (p.imageBase64) {
        const driveUrl = saveImageToDrive(p.imageBase64, idToUpdate + '.jpg');
        if (driveUrl) {
          p.image = driveUrl;
        }
      }

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({
          status: 'error',
          message: 'No hay productos en la hoja'
        });
      }

      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let rowIndex = -1;

      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === idToUpdate) {
          rowIndex = i + 2; // +2 porque empieza en fila 2 (después de headers)
          break;
        }
      }

      if (rowIndex === -1) {
        // Si no existe, lo agregamos
        sheet.appendRow([
          idToUpdate,
          p.name || '',
          p.category || 'pizzas',
          Number(p.price) || 0,
          p.old_price ? Number(p.old_price) : '',
          p.desc || '',
          p.ingredients || '',
          p.variants || '',
          p.image || 'images/product-1.png',
          p.badge || '',
          true
        ]);
        return createJsonResponse({
          status: 'success',
          message: 'Producto creado en Google Sheets y Drive (no existía previamente)',
          imageUrl: p.image
        });
      }

      // Leer fila actual para no sobreescribir valores no enviados
      const currentRow = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
      const updatedRow = [
        idToUpdate,
        p.name !== undefined ? p.name : currentRow[1],
        p.category !== undefined ? p.category : currentRow[2],
        p.price !== undefined ? Number(p.price) : currentRow[3],
        p.old_price !== undefined ? (p.old_price ? Number(p.old_price) : '') : currentRow[4],
        p.desc !== undefined ? p.desc : currentRow[5],
        p.ingredients !== undefined ? p.ingredients : currentRow[6],
        p.variants !== undefined ? p.variants : currentRow[7],
        p.image !== undefined ? p.image : currentRow[8],
        p.badge !== undefined ? p.badge : currentRow[9],
        p.active !== undefined ? p.active : currentRow[10]
      ];

      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([updatedRow]);

      return createJsonResponse({
        status: 'success',
        message: 'Producto actualizado exitosamente en Google Sheets y Drive',
        imageUrl: updatedRow[8]
      });
    }

    // 6. Eliminar un producto
    if (action === 'delete') {
      const idToDelete = String(payload.id || '').trim();
      if (!idToDelete) {
        return createJsonResponse({
          status: 'error',
          message: 'Se requiere ID del producto a eliminar'
        });
      }

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({
          status: 'error',
          message: 'No hay productos en la hoja'
        });
      }

      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let rowIndex = -1;

      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === idToDelete) {
          rowIndex = i + 2;
          break;
        }
      }

      if (rowIndex === -1) {
        return createJsonResponse({
          status: 'error',
          message: 'Producto no encontrado en Google Sheets'
        });
      }

      // Eliminar la fila física
      sheet.deleteRow(rowIndex);

      return createJsonResponse({
        status: 'success',
        message: 'Producto eliminado exitosamente de Google Sheets'
      });
    }

    return createJsonResponse({
      status: 'error',
      message: 'Acción no reconocida: ' + action
    });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}


