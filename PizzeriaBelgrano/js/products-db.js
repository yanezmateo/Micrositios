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
                supabaseUrl: '',
                supabaseKey: '',
                storageBucket: 'fotos-productos',
                lastSync: null,
                lastSyncStatus: 'local' // 'synced', 'local', 'syncing', 'error'
            };
            this.client = null;
            this.isInitialized = false;
        }

        /**
         * Inicializa la base de datos: lee caché local o defaults,
         * inicializa el cliente de Supabase y sincroniza en segundo plano.
         */
        async init() {
            this.loadConfig();
            this.loadFromStorage();
            this.initSupabaseClient();
            this.isInitialized = true;

            // Disparar evento para que la UI se renderice inmediatamente con datos locales
            this.notifyListeners('productsReady');

            // Si hay cliente de Supabase, sincronizar catálogo en segundo plano
            if (this.client) {
                this.fetchFromSupabase().catch(err => {
                    console.warn('[SupabaseDB] Sincronización inicial falló:', err);
                });
            }

            return this.products;
        }

        loadConfig() {
            try {
                // 1. Cargar desde config global (definida en js/config.js para producción en Vercel)
                if (window.PIZZERIA_CONFIG) {
                    if (window.PIZZERIA_CONFIG.supabaseUrl) {
                        this.config.supabaseUrl = window.PIZZERIA_CONFIG.supabaseUrl.trim();
                    }
                    if (window.PIZZERIA_CONFIG.supabaseKey) {
                        this.config.supabaseKey = window.PIZZERIA_CONFIG.supabaseKey.trim();
                    }
                    if (window.PIZZERIA_CONFIG.storageBucket) {
                        this.config.storageBucket = window.PIZZERIA_CONFIG.storageBucket.trim();
                    }
                }

                // 2. Si el admin guardó una URL/Key en este navegador, tiene prioridad
                const saved = localStorage.getItem(CONFIG_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.config = Object.assign(this.config, parsed);
                }
            } catch (e) {
                console.error('[SupabaseDB] Error cargando config:', e);
            }
        }

        initSupabaseClient() {
            try {
                if (window.supabase && typeof window.supabase.createClient === 'function') {
                    if (this.config.supabaseUrl && this.config.supabaseKey) {
                        this.client = window.supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey);
                        this.config.lastSyncStatus = 'synced';
                        return true;
                    }
                }
            } catch (e) {
                console.warn('[SupabaseDB] Error inicializando cliente de Supabase:', e);
            }
            this.client = null;
            return false;
        }

        saveConfig(supabaseUrl, supabaseKey, storageBucket = 'fotos-productos') {
            this.config.supabaseUrl = (supabaseUrl || '').trim();
            this.config.supabaseKey = (supabaseKey || '').trim();
            this.config.storageBucket = (storageBucket || 'fotos-productos').trim();
            try {
                localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
                this.initSupabaseClient();
                this.notifyListeners('configChanged');
            } catch (e) {
                console.error('[SupabaseDB] Error guardando config:', e);
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
                console.warn('[SupabaseDB] Error leyendo storage, usando defaults:', e);
            }
            this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
            this.saveToStorage();
        }

        saveToStorage() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products));
            } catch (e) {
                console.error('[SupabaseDB] Error escribiendo storage:', e);
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
         * Sube una imagen en base64 directamente al bucket de Supabase Storage
         * y retorna la URL pública permanente en CDN.
         */
        async uploadImageToSupabase(base64Data, filename) {
            if (!this.client) return null;
            try {
                let base64String = base64Data;
                let contentType = 'image/jpeg';

                if (base64Data.indexOf('data:') === 0) {
                    const parts = base64Data.split(',');
                    const meta = parts[0];
                    base64String = parts[1];
                    const match = meta.match(/data:([^;]+)/);
                    if (match) contentType = match[1];
                }

                const byteCharacters = atob(base64String);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: contentType });

                const extension = contentType.includes('png') ? 'png' : 'jpg';
                const cleanName = (filename || `foto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`).replace(/[^a-zA-Z0-9_-]/g, '_') + '.' + extension;
                const bucketName = this.config.storageBucket || 'fotos-productos';

                const { data, error } = await this.client.storage
                    .from(bucketName)
                    .upload(cleanName, blob, {
                        contentType: contentType,
                        upsert: true
                    });

                if (error) {
                    console.error('[SupabaseDB] Error subiendo imagen a Storage:', error);
                    return null;
                }

                const { data: publicUrlData } = this.client.storage
                    .from(bucketName)
                    .getPublicUrl(cleanName);

                return publicUrlData ? publicUrlData.publicUrl : null;
            } catch (err) {
                console.error('[SupabaseDB] Error procesando subida de imagen:', err);
                return null;
            }
        }

        /**
         * Actualizar un producto existente
         */
        async updateProduct(id, changes) {
            const index = this.products.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error(`Producto con ID ${id} no encontrado`);
            }

            // Si vino foto nueva en base64, subirla a Supabase Storage
            if (changes.imageBase64 && this.client) {
                const uploadedUrl = await this.uploadImageToSupabase(changes.imageBase64, id);
                if (uploadedUrl) {
                    changes.image = uploadedUrl;
                }
            }

            this.products[index] = Object.assign({}, this.products[index], changes);
            if (changes.price) this.products[index].price = Number(changes.price);
            if (changes.old_price) this.products[index].old_price = Number(changes.old_price);

            this.saveToStorage();
            this.notifyListeners('productsUpdated', { action: 'update', product: this.products[index] });

            // Enviar a Supabase PostgreSQL
            if (this.client) {
                try {
                    const row = {
                        nombre: this.products[index].name,
                        categoria: this.products[index].category,
                        precio: this.products[index].price,
                        precio_anterior: this.products[index].old_price || null,
                        descripcion: this.products[index].desc,
                        ingredientes: this.products[index].ingredients,
                        variantes: this.products[index].variants,
                        imagen: this.products[index].image,
                        etiqueta: this.products[index].badge,
                        activo: this.products[index].active !== false
                    };

                    const { error } = await this.client.from('productos').update(row).eq('id', id);
                    if (error) throw error;

                    this.config.lastSync = new Date().toISOString();
                    this.config.lastSyncStatus = 'synced';
                } catch (err) {
                    console.error('[SupabaseDB] Error actualizando producto en Supabase:', err);
                    this.config.lastSyncStatus = 'error';
                }
            }

            return this.products[index];
        }

        /**
         * Agregar un nuevo producto
         */
        async addProduct(productData) {
            const slug = (productData.name || 'producto')
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            const newId = productData.id || `${slug}-${Date.now().toString().slice(-4)}`;

            let imageUrl = productData.image || 'images/product-1.png';

            // Si vino foto en base64, subirla a Supabase Storage
            if (productData.imageBase64 && this.client) {
                const uploadedUrl = await this.uploadImageToSupabase(productData.imageBase64, newId);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            const newProduct = {
                id: newId,
                name: productData.name || 'Nuevo Producto',
                category: productData.category || 'pizzas',
                price: Number(productData.price) || 0,
                old_price: productData.old_price ? Number(productData.old_price) : null,
                image: imageUrl,
                badge: productData.badge || '',
                ingredients: productData.ingredients || '',
                variants: productData.variants || '',
                desc: productData.desc || '',
                active: true
            };

            this.products.push(newProduct);
            this.saveToStorage();
            this.notifyListeners('productsUpdated', { action: 'add', product: newProduct });

            // Enviar a Supabase PostgreSQL
            if (this.client) {
                try {
                    const row = {
                        id: newId,
                        nombre: newProduct.name,
                        categoria: newProduct.category,
                        precio: newProduct.price,
                        precio_anterior: newProduct.old_price,
                        descripcion: newProduct.desc,
                        ingredientes: newProduct.ingredients,
                        variantes: newProduct.variants,
                        imagen: newProduct.image,
                        etiqueta: newProduct.badge,
                        activo: true
                    };

                    const { error } = await this.client.from('productos').insert([row]);
                    if (error) throw error;

                    this.config.lastSync = new Date().toISOString();
                    this.config.lastSyncStatus = 'synced';
                } catch (err) {
                    console.error('[SupabaseDB] Error insertando producto en Supabase:', err);
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

            // Eliminar de Supabase PostgreSQL
            if (this.client) {
                try {
                    const { error } = await this.client.from('productos').delete().eq('id', id);
                    if (error) throw error;

                    this.config.lastSync = new Date().toISOString();
                    this.config.lastSyncStatus = 'synced';
                } catch (err) {
                    console.error('[SupabaseDB] Error eliminando producto en Supabase:', err);
                    this.config.lastSyncStatus = 'error';
                }
            }

            return deleted;
        }

        /**
         * Descargar catálogo completo desde Supabase PostgreSQL
         */
        async fetchFromSupabase() {
            if (!this.client) return null;

            this.config.lastSyncStatus = 'syncing';
            this.notifyListeners('syncStatusChanged', 'syncing');

            try {
                const { data, error } = await this.client
                    .from('productos')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (error) throw error;

                if (Array.isArray(data) && data.length > 0) {
                    this.products = data.map(row => ({
                        id: String(row.id),
                        name: String(row.nombre || ''),
                        category: String(row.categoria || 'pizzas'),
                        price: Number(row.precio) || 0,
                        old_price: row.precio_anterior ? Number(row.precio_anterior) : null,
                        desc: String(row.descripcion || ''),
                        ingredients: String(row.ingredientes || ''),
                        variants: String(row.variantes || ''),
                        image: String(row.imagen || 'images/product-1.png'),
                        badge: String(row.etiqueta || ''),
                        active: row.activo !== false
                    }));

                    this.saveToStorage();
                    this.config.lastSync = new Date().toISOString();
                    this.config.lastSyncStatus = 'synced';
                    this.notifyListeners('productsUpdated', { action: 'fetch', count: this.products.length });
                    this.notifyListeners('syncStatusChanged', 'synced');
                    return this.products;
                } else if (Array.isArray(data) && data.length === 0) {
                    // Si la tabla está vacía en Supabase, exportamos el catálogo inicial para poblarla automáticamente
                    await this.exportAllToSupabase();
                }
            } catch (err) {
                console.error('[SupabaseDB] Error al consultar Supabase:', err);
                this.config.lastSyncStatus = 'error';
                this.notifyListeners('syncStatusChanged', 'error');
                throw err;
            }
        }

        /**
         * Exportar todos los productos locales a Supabase (población inicial)
         */
        async exportAllToSupabase() {
            if (!this.client) {
                throw new Error('Primero debés configurar la conexión con Supabase.');
            }

            const rows = this.products.map(p => ({
                id: p.id,
                nombre: p.name,
                categoria: p.category,
                precio: Number(p.price) || 0,
                precio_anterior: p.old_price ? Number(p.old_price) : null,
                descripcion: p.desc || '',
                ingredientes: p.ingredients || '',
                variantes: p.variants || '',
                imagen: p.image || 'images/product-1.png',
                etiqueta: p.badge || '',
                activo: p.active !== false
            }));

            const { data, error } = await this.client
                .from('productos')
                .upsert(rows, { onConflict: 'id' });

            if (error) throw error;

            this.config.lastSync = new Date().toISOString();
            this.config.lastSyncStatus = 'synced';
            this.notifyListeners('syncCompleted', { count: rows.length });
            return { count: rows.length };
        }

        /**
         * Probar la conexión con Supabase
         */
        async testConnection() {
            if (!this.client) {
                this.initSupabaseClient();
            }
            if (!this.client) {
                throw new Error('Faltan URL o Key de Supabase en la configuración.');
            }

            const { count, error } = await this.client
                .from('productos')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;

            return {
                status: 'success',
                message: `¡Conexión exitosa con Supabase! (${count !== null ? count : 0} productos en la nube)`
            };
        }

        /**
         * Autenticación de Administrador (admin / 1111 o clave en tabla configuracion)
         */
        isAdmin() {
            return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
        }

        async login(username, password) {
            const u = String(username || '').trim().toLowerCase();
            const p = String(password || '').trim();

            if (!u || !p) return { success: false, message: 'Ingresá usuario y contraseña.' };

            const validUser = u === 'admin' || u.includes('admin');
            const localPass = localStorage.getItem('pizzeria_custom_pass') || '1111';

            // 1. Acceso instantáneo con clave local / por defecto
            if (validUser && (p === '1111' || p === localPass)) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
                this.notifyListeners('adminAuthChanged', { isAdmin: true });
                return { success: true };
            }

            // 2. Si no coincide, consultar tabla configuracion de Supabase
            if (this.client && validUser) {
                try {
                    const { data, error } = await this.client
                        .from('configuracion')
                        .select('valor')
                        .eq('clave', 'admin_password')
                        .maybeSingle();

                    if (!error && data && data.valor && p === String(data.valor).trim()) {
                        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
                        localStorage.setItem('pizzeria_custom_pass', p);
                        this.notifyListeners('adminAuthChanged', { isAdmin: true });
                        return { success: true };
                    }
                } catch (err) {
                    console.warn('[SupabaseDB] Error consultando credenciales:', err);
                }
            }

            return { success: false, message: 'Usuario o contraseña incorrectos.' };
        }

        async changePassword(currentPass, newPass) {
            if (!newPass || newPass.length < 3) {
                throw new Error('La nueva contraseña debe tener al menos 3 caracteres.');
            }

            // Validar clave actual
            const localPass = localStorage.getItem('pizzeria_custom_pass') || '1111';
            let cloudPass = localPass;

            if (this.client) {
                try {
                    const { data } = await this.client
                        .from('configuracion')
                        .select('valor')
                        .eq('clave', 'admin_password')
                        .maybeSingle();
                    if (data && data.valor) {
                        cloudPass = String(data.valor).trim();
                    }
                } catch (e) {}
            }

            if (currentPass !== localPass && currentPass !== cloudPass) {
                throw new Error('La contraseña actual ingresada no coincide.');
            }

            // Guardar local
            localStorage.setItem('pizzeria_custom_pass', newPass);

            // Guardar en Supabase PostgreSQL
            if (this.client) {
                const { error } = await this.client
                    .from('configuracion')
                    .upsert({ clave: 'admin_password', valor: newPass, updated_at: new Date().toISOString() });
                if (error) {
                    console.error('[SupabaseDB] Error guardando contraseña en Supabase:', error);
                }
            }

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
