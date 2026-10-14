/**
 * ==========================================================================
 * PIZZERÍA BELGRANO - PRODUCTS DATABASE & GOOGLE SHEETS CONNECTOR
 * ==========================================================================
 * Maneja el catálogo completo, sincronización en tiempo real con Google Sheets
 * y persistencia en caché local (localStorage).
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'pizzeria_belgrano_products_v2';
    const CONFIG_KEY = 'pizzeria_belgrano_sheets_config';
    const ADMIN_SESSION_KEY = 'pizzeria_admin_session';

    // Catálogo base original de Pizzería Belgrano
    const DEFAULT_PRODUCTS = [
        // --- PROMOCIONES ---
        {
            id: 'promo-metro-pizza',
            name: '1 Metro de Pizza + 2 Refrescos 1.5L',
            category: 'promos',
            price: 1190,
            old_price: 1390,
            image: 'images/promo-metro-pizza.jpg',
            badge: 'Más Elegido • 4 a 5 Personas',
            ingredients: 'Mitad Muzzarella, Mitad Jamón cocido y morrones, 2 Refrescos 1.5L',
            variants: '',
            desc: '1 metro completo de masa a la leña con 2 refrescos grandes a elección. Ideal para reuniones y familias.',
            active: true
        },
        {
            id: 'promo-tradicional',
            name: 'Combo Tradicional: Pizza + 2 Fainá + Refresco',
            category: 'promos',
            price: 690,
            old_price: 790,
            image: 'images/product-faina.jpg',
            badge: '¡Clásico de Viernes!',
            ingredients: 'Pizza Grande Muzzarella, 2 Porciones de Fainá, 1 Refresco 1.5L',
            variants: '',
            desc: 'La combinación clásica uruguaya: pizza a la leña con doble fainá crocante y refresco.',
            active: true
        },
        {
            id: 'promo-fusion',
            name: 'Combo Amigos: Pizza + 4 Lemeyun + Cerveza',
            category: 'promos',
            price: 890,
            old_price: 990,
            image: 'images/product-lemeyun.jpg',
            badge: 'Combo Especial Amigos',
            ingredients: 'Pizza Grande Muzzarella, 4 Lemeyun, 1 Cerveza 500ml',
            variants: '',
            desc: 'Fusión perfecta de pizza artesanal con 4 auténticos lemeyun y cerveza artesanal fría.',
            active: true
        },
        {
            id: 'promo-pareja',
            name: 'Promo Pareja: 2 Pizzetas + 2 Bebidas',
            category: 'promos',
            price: 490,
            old_price: 580,
            image: 'images/product-fugazza.jpg',
            badge: 'Ideal Pareja',
            ingredients: '2 Pizzetas individuales, 2 Bebidas',
            variants: '',
            desc: 'El combo perfecto para dos personas con sabor artesanal.',
            active: true
        },

        // --- PIZZAS ARTESANALES ---
        {
            id: 'pizza-margarita',
            name: 'Pizza Margarita',
            category: 'pizzas',
            price: 420,
            old_price: null,
            image: 'images/product-1.png',
            badge: '',
            ingredients: 'Salsa de tomate, Mozzarella, Albahaca, Aceite de oliva',
            variants: '',
            desc: 'Salsa de tomate casera San Marzano, mozzarella fior di latte, albahaca fresca y oliva virgen extra.',
            active: true
        },
        {
            id: 'pizza-pepperoni',
            name: 'Pizza Pepperoni',
            category: 'pizzas',
            price: 490,
            old_price: null,
            image: 'images/product-2.png',
            badge: 'Favorito',
            ingredients: 'Salsa de tomate, Mozzarella, Pepperoni, Orégano',
            variants: '',
            desc: 'Generosa capa de mozzarella fundida, rodajas de pepperoni crocante y toque de orégano.',
            active: true
        },
        {
            id: 'pizza-fugazzeta',
            name: 'Fugazzeta Especial',
            category: 'pizzas',
            price: 540,
            old_price: null,
            image: 'images/cat-fugazzeta.jpg',
            badge: 'Rellena',
            ingredients: 'Mozzarella, Cebolla caramelizada, Orégano, Aceite de oliva',
            variants: '',
            desc: 'Rellena de abundante mozzarella con cebolla caramelizada dulce dorada al horno.',
            active: true
        },
        {
            id: 'pizza-napolitana',
            name: 'Pizza Napolitana',
            category: 'pizzas',
            price: 470,
            old_price: null,
            image: 'images/cat-1.png',
            badge: '',
            ingredients: 'Salsa de tomate, Mozzarella, Rodajas de tomate, Ajo, Provolone, Albahaca',
            variants: '',
            desc: 'Mozzarella fundida, tomate fresco, provolone rallado, ajo y albahaca fresca.',
            active: true
        },
        {
            id: 'pizza-figazza',
            name: 'Pizza Figazza Tradicional',
            category: 'pizzas',
            price: 390,
            old_price: null,
            image: 'images/product-fugazza.jpg',
            badge: '',
            ingredients: 'Cebolla, Orégano, Aceite de oliva',
            variants: '',
            desc: 'Masa crocante dorada a la leña con colchón de cebollas dulces confitadas y oliva.',
            active: true
        },

        // --- SÁNDWICHES CALIENTES ---
        {
            id: 'sandwich-clasico',
            name: 'Sándwich Caliente Clásico',
            category: 'sandwiches',
            price: 280,
            old_price: null,
            image: 'images/product-sandwich-clasico.jpg',
            badge: '',
            ingredients: 'Jamón cocido, Muzzarella derretida, Manteca dorada',
            variants: '',
            desc: 'Pan de miga crocante al horno a leña con doble jamón cocido y abundante muzzarella fundida.',
            active: true
        },
        {
            id: 'sandwich-napolitano',
            name: 'Sándwich Caliente Napolitano',
            category: 'sandwiches',
            price: 320,
            old_price: null,
            image: 'images/product-sandwich-napolitano.jpg',
            badge: '',
            ingredients: 'Jamón cocido, Muzzarella, Rodajas de tomate, Orégano, Aceite de oliva',
            variants: '',
            desc: 'Especial napolitano con jamón, muzzarella fundida, tomate fresco y orégano al horno.',
            active: true
        },
        {
            id: 'sandwich-especial',
            name: 'Sándwich Caliente Especial',
            category: 'sandwiches',
            price: 370,
            old_price: null,
            image: 'images/product-sandwich-napolitano.jpg',
            badge: 'Completo',
            ingredients: 'Jamón cocido, Muzzarella, Huevo, Panceta crocante, Morrones asados',
            variants: '',
            desc: 'Super completo con jamón, queso derretido, huevo, panceta y morrones asados al horno de leña.',
            active: true
        },
        {
            id: 'chivito-al-pan',
            name: 'Chivito al Pan Clásico',
            category: 'sandwiches',
            price: 450,
            old_price: null,
            image: 'images/product-sandwich-clasico.jpg',
            badge: 'Uruguayo 100%',
            ingredients: 'Lomo vacuno, Jamón cocido, Muzzarella, Lechuga, Tomate, Mayonesa',
            variants: '',
            desc: 'Auténtico chivito uruguayo al pan con lomo tierno, muzzarella, jamón, lechuga y tomate fresco.',
            active: true
        },

        // --- FAINÁ ---
        {
            id: 'faina-clasica',
            name: 'Fainá Clásica a la Leña',
            category: 'faina',
            price: 110,
            old_price: null,
            image: 'images/product-faina.jpg',
            badge: '',
            ingredients: 'Pimienta negra, Orégano',
            variants: '',
            desc: 'Porción tradicional dorada a la leña con pimienta negra recién molida y orégano.',
            active: true
        },
        {
            id: 'faina-rellena',
            name: 'Fainá Rellena Jamón & Queso',
            category: 'faina',
            price: 190,
            old_price: null,
            image: 'images/product-faina-rellena.jpg',
            badge: 'Especialidad',
            ingredients: 'Mozzarella, Jamón cocido, Pimienta negra, Orégano',
            variants: '',
            desc: 'Doble capa crujiente con abundante mozzarella hilada y jamón cocido.',
            active: true
        },

        // --- LEMEYUN ---
        {
            id: 'lemeyun-tradicional',
            name: 'Lemeyun Tradicional',
            category: 'lemeyun',
            price: 130,
            old_price: null,
            image: 'images/product-lemeyun.jpg',
            badge: '',
            ingredients: 'Carne vacuna, Tomate, Cebolla, Perejil, Especias, Limón',
            variants: '',
            desc: 'Auténtico lemeyun armenio horneado a la leña, servido con limón fresco.',
            active: true
        },
        {
            id: 'lemeyun-queso',
            name: 'Lemeyun Especial con Queso',
            category: 'lemeyun',
            price: 160,
            old_price: null,
            image: 'images/product-lemeyun.jpg',
            badge: 'Gratinado',
            ingredients: 'Carne vacuna, Mozzarella, Tomate, Cebolla, Perejil, Limón',
            variants: '',
            desc: 'Lemeyun a la leña gratinado con mozzarella suave derretida y limón.',
            active: true
        },

        // --- BEBIDAS ---
        {
            id: 'gaseosa-cola',
            name: 'Coca-Cola 1.5L',
            category: 'bebidas',
            price: 170,
            old_price: null,
            image: 'images/product-gaseosa.jpg',
            badge: '',
            ingredients: '',
            variants: 'Común, Zero, Light',
            desc: 'Botella plástica sellada de 1.5L bien fría. Elegí tu variante preferida.',
            active: true
        },
        {
            id: 'gaseosa-sprite',
            name: 'Sprite Lima-Limón 1.5L',
            category: 'bebidas',
            price: 170,
            old_price: null,
            image: 'images/product-sprite.jpg',
            badge: '',
            ingredients: '',
            variants: 'Común, Zero',
            desc: 'Botella de 1.5L bien fría con intenso sabor lima-limón.',
            active: true
        },
        {
            id: 'gaseosa-pomelo',
            name: 'Pomelo 1.5L',
            category: 'bebidas',
            price: 170,
            old_price: null,
            image: 'images/product-pomelo.jpg',
            badge: '',
            ingredients: '',
            variants: 'Común, Zero',
            desc: 'Botella de 1.5L bien fría con sabor cítrico de pomelo.',
            active: true
        },
        {
            id: 'cerveza-artesanal',
            name: 'Cerveza Artesanal 500ml',
            category: 'bebidas',
            price: 210,
            old_price: null,
            image: 'images/product-cerveza.jpg',
            badge: 'Artesanal',
            ingredients: '',
            variants: 'Golden Ale, IPA, Scottish',
            desc: 'Botellón artesanal de 500ml servido a temperatura óptima.',
            active: true
        }
    ];

    class ProductsDatabase {
        constructor() {
            this.products = [];
            this.config = {
                gasUrl: '',
                sheetId: '',
                lastSync: null,
                lastSyncStatus: 'local' // 'synced', 'local', 'syncing', 'error'
            };
            this.isInitialized = false;
        }

        /**
         * Inicializa la base de datos: lee caché local o defaults,
         * y lanza la sincronización con Google Sheets si hay URL configurada.
         */
        async init() {
            this.loadConfig();
            this.loadFromStorage();
            this.isInitialized = true;

            // Disparar evento para que la UI se renderice inmediatamente con datos locales
            this.notifyListeners('productsReady');

            // Si hay URL de Google Sheets configurada, sincronizar en segundo plano
            if (this.config.gasUrl) {
                this.fetchFromSheets().catch(err => {
                    console.warn('[SheetsDB] Sincronización inicial falló:', err);
                });
            }

            return this.products;
        }

        loadConfig() {
            try {
                // 1. Cargar desde config global (definida en js/config.js para producción en Git)
                if (window.PIZZERIA_CONFIG && window.PIZZERIA_CONFIG.gasUrl) {
                    this.config.gasUrl = window.PIZZERIA_CONFIG.gasUrl.trim();
                }

                // 2. Si el admin guardó una URL en este navegador, tiene prioridad
                const saved = localStorage.getItem(CONFIG_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.gasUrl) {
                        this.config.gasUrl = parsed.gasUrl.trim();
                    }
                    this.config = Object.assign(this.config, parsed);
                }
            } catch (e) {
                console.error('[SheetsDB] Error cargando config:', e);
            }
        }

        saveConfig(gasUrl, sheetId = '') {
            this.config.gasUrl = (gasUrl || '').trim();
            this.config.sheetId = (sheetId || '').trim();
            try {
                localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
                this.notifyListeners('configChanged');
            } catch (e) {
                console.error('[SheetsDB] Error guardando config:', e);
            }
        }

        loadFromStorage() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.products = parsed;
                        return;
                    }
                }
            } catch (e) {
                console.warn('[SheetsDB] Error leyendo storage, usando defaults:', e);
            }
            this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
            this.saveToStorage();
        }

        saveToStorage() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products));
            } catch (e) {
                console.error('[SheetsDB] Error escribiendo storage:', e);
            }
        }

        getAllProducts() {
            return this.products.filter(p => p.active !== false);
        }

        getProductsByCategory(category) {
            return this.getAllProducts().filter(p => p.category === category);
        }

        getProductById(id) {
            return this.products.find(p => p.id === id);
        }

        /**
         * Actualizar un producto existente
         */
        async updateProduct(id, changes) {
            const index = this.products.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error(`Producto con ID ${id} no encontrado`);
            }

            // Aplicar cambios
            if (changes.imageBase64) {
                changes.image = changes.imageBase64;
            }
            this.products[index] = Object.assign({}, this.products[index], changes);
            if (changes.price) this.products[index].price = Number(changes.price);
            if (changes.old_price) this.products[index].old_price = Number(changes.old_price);

            this.saveToStorage();
            this.notifyListeners('productsUpdated', { action: 'update', product: this.products[index] });

            // Enviar a Google Sheets si hay URL
            if (this.config.gasUrl) {
                try {
                    const res = await this.sendPostRequest({
                        action: 'update',
                        id: id,
                        product: Object.assign({}, this.products[index], {
                            imageBase64: changes.imageBase64 || null
                        })
                    });
                    if (res && res.imageUrl) {
                        this.products[index].image = res.imageUrl;
                        this.saveToStorage();
                        this.notifyListeners('productsUpdated', { action: 'update', product: this.products[index] });
                    }
                    this.config.lastSync = new Date().toISOString();
                    this.config.lastSyncStatus = 'synced';
                    this.saveConfig(this.config.gasUrl, this.config.sheetId);
                } catch (err) {
                    console.error('[SheetsDB] Error al sincronizar actualización con Google Sheets:', err);
                    this.config.lastSyncStatus = 'error';
                }
            }

            return this.products[index];
        }

        /**
         * Agregar un nuevo producto
         */
        async addProduct(productData) {
            // Generar ID único
            const slug = (productData.name || 'producto')
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            const newId = productData.id || `${slug}-${Date.now().toString().slice(-4)}`;

            const newProduct = {
                id: newId,
                name: productData.name || 'Nuevo Producto',
                category: productData.category || 'pizzas',
                price: Number(productData.price) || 0,
                old_price: productData.old_price ? Number(productData.old_price) : null,
                image: productData.imageBase64 || productData.image || 'images/product-1.png',
                badge: productData.badge || '',
                ingredients: productData.ingredients || '',
                variants: productData.variants || '',
                desc: productData.desc || '',
                active: true
            };

            this.products.push(newProduct);
            this.saveToStorage();
            this.notifyListeners('productsUpdated', { action: 'add', product: newProduct });

            // Enviar a Google Sheets
            if (this.config.gasUrl) {
                try {
                    const res = await this.sendPostRequest({
                        action: 'add',
                        product: Object.assign({}, newProduct, {
                            imageBase64: productData.imageBase64 || null
                        })
                    });
                    if (res && res.imageUrl) {
                        newProduct.image = res.imageUrl;
                        this.saveToStorage();
                        this.notifyListeners('productsUpdated', { action: 'update', product: newProduct });
                    }
                    this.config.lastSync = new Date().toISOString();
                    this.config.lastSyncStatus = 'synced';
                    this.saveConfig(this.config.gasUrl, this.config.sheetId);
                } catch (err) {
                    console.error('[SheetsDB] Error agregando producto a Google Sheets:', err);
                    this.config.lastSyncStatus = 'error';
                }
            }

            return newProduct;
        }

        /**
         * Eliminar un producto
         */
        async deleteProduct(id) {
            const index = this.products.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error(`Producto ${id} no encontrado`);
            }

            const deleted = this.products.splice(index, 1)[0];
            this.saveToStorage();
            this.notifyListeners('productsUpdated', { action: 'delete', id: id });

            // Enviar a Google Sheets
            if (this.config.gasUrl) {
                try {
                    await this.sendPostRequest({
                        action: 'delete',
                        id: id
                    });
                    this.config.lastSync = new Date().toISOString();
                    this.config.lastSyncStatus = 'synced';
                    this.saveConfig(this.config.gasUrl, this.config.sheetId);
                } catch (err) {
                    console.error('[SheetsDB] Error eliminando producto en Google Sheets:', err);
                    this.config.lastSyncStatus = 'error';
                }
            }

            return deleted;
        }

        /**
         * Exportar TODOS los productos locales a Google Sheets (SyncAll / Carga Inicial)
         */
        async exportAllToSheets() {
            if (!this.config.gasUrl) {
                throw new Error('Primero debes configurar la URL de Google Sheets en la configuración.');
            }

            const response = await this.sendPostRequest({
                action: 'syncAll',
                products: this.products
            });

            this.config.lastSync = new Date().toISOString();
            this.config.lastSyncStatus = 'synced';
            this.saveConfig(this.config.gasUrl, this.config.sheetId);
            this.notifyListeners('syncCompleted', { count: this.products.length });
            return response;
        }

        /**
         * Descargar productos desde Google Sheets y actualizar el sitio
         */
        async fetchFromSheets() {
            if (!this.config.gasUrl) return;

            this.config.lastSyncStatus = 'syncing';
            this.notifyListeners('syncStatusChanged', 'syncing');

            try {
                const res = await fetch(this.config.gasUrl, {
                    method: 'GET',
                    cache: 'no-cache'
                });

                if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                const data = await res.json();

                if (data && data.status === 'success' && Array.isArray(data.products) && data.products.length > 0) {
                    this.products = data.products;
                    this.saveToStorage();
                    this.config.lastSync = new Date().toISOString();
                    this.config.lastSyncStatus = 'synced';
                    this.saveConfig(this.config.gasUrl, this.config.sheetId);
                    this.notifyListeners('productsUpdated', { action: 'fetch', count: this.products.length });
                    this.notifyListeners('syncStatusChanged', 'synced');
                    return data.products;
                } else if (data && data.count === 0) {
                    // Si la hoja está vacía, no borramos los locales; invitamos a exportar
                    this.config.lastSyncStatus = 'local';
                    this.notifyListeners('syncStatusChanged', 'empty_sheet');
                }
            } catch (err) {
                console.error('[SheetsDB] Error al obtener datos de Google Sheets:', err);
                this.config.lastSyncStatus = 'error';
                this.notifyListeners('syncStatusChanged', 'error');
                throw err;
            }
        }

        /**
         * Probar la conexión con una URL de Google Apps Script
         */
        async testConnection(testUrl) {
            const url = (testUrl || this.config.gasUrl || '').trim();
            if (!url) throw new Error('Por favor ingresá la URL del Web App de Google Apps Script.');

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'test' })
            });

            if (!res.ok) throw new Error(`Respuesta HTTP no válida: ${res.status}`);
            const data = await res.json();
            return data;
        }

        /**
         * Helper para llamadas POST a Google Apps Script evitando bloqueos CORS
         */
        async sendPostRequest(payload) {
            const url = this.config.gasUrl;
            if (!url) throw new Error('No hay URL de Google Apps Script configurada');

            // Usar 'text/plain' para evitar preflight OPTIONS bloqueado por CORS en Apps Script
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error(`Error en la solicitud a Google Sheets: ${res.status}`);
            }

            return await res.json();
        }

        /**
         * Autenticación de Administrador (admin / 1111)
         */
        isAdmin() {
            return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
        }

        async login(username, password) {
            const u = String(username || '').trim().toLowerCase();
            const p = String(password || '').trim();

            if (!u || !p) return { success: false, message: 'Ingresá usuario y contraseña.' };

            // 1. Si hay Google Sheets conectado, validar en la nube
            if (this.config.gasUrl) {
                try {
                    const res = await this.sendPostRequest({
                        action: 'login',
                        username: u,
                        password: p
                    });
                    if (res && res.authenticated) {
                        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
                        localStorage.setItem('pizzeria_custom_pass', p);
                        this.notifyListeners('adminAuthChanged', { isAdmin: true });
                        return { success: true };
                    } else {
                        return { success: false, message: res.message || 'Usuario o contraseña incorrectos.' };
                    }
                } catch (err) {
                    console.warn('[SheetsDB] Error validando online, usando verificación local:', err);
                }
            }

            // 2. Verificación local (si está offline o no se conectó a Sheets aún)
            const localPass = localStorage.getItem('pizzeria_custom_pass') || '1111';
            const validUser = u === 'admin' || u.includes('admin');
            const validPass = p === localPass;

            if (validUser && validPass) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
                this.notifyListeners('adminAuthChanged', { isAdmin: true });
                return { success: true };
            }

            return { success: false, message: 'Usuario o contraseña incorrectos.' };
        }

        async changePassword(currentPass, newPass) {
            if (!newPass || newPass.length < 3) {
                throw new Error('La nueva contraseña debe tener al menos 3 caracteres.');
            }

            if (this.config.gasUrl) {
                const res = await this.sendPostRequest({
                    action: 'changePassword',
                    currentPassword: currentPass,
                    newPassword: newPass
                });

                if (res.status === 'error') {
                    throw new Error(res.message || 'No se pudo cambiar la contraseña');
                }
            } else {
                const localPass = localStorage.getItem('pizzeria_custom_pass') || '1111';
                if (currentPass !== localPass) {
                    throw new Error('La contraseña actual ingresada no coincide.');
                }
            }

            localStorage.setItem('pizzeria_custom_pass', newPass);
            this.notifyListeners('passwordChanged', { newPass });
            return true;
        }

        logout() {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            this.notifyListeners('adminAuthChanged', { isAdmin: false });
        }

        notifyListeners(eventName, detail = {}) {
            const evt = new CustomEvent(eventName, { detail });
            window.dispatchEvent(evt);
        }
    }

    // Instancia global disponible en window.productsDb
    window.productsDb = new ProductsDatabase();

})(window);
