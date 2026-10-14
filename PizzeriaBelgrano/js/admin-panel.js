/**
 * ==========================================================================
 * PIZZERÍA BELGRANO - ADMIN PANEL CONTROLLER
 * ==========================================================================
 * Controla la barra superior de administrador, formularios de edición/creación,
 * eliminación de productos, planilla en vivo y sincronización con Supabase (PostgreSQL & Storage).
 */

(function(window, document) {
    'use strict';

    // Lista de imágenes locales comunes para selección rápida
    const QUICK_IMAGE_LIST = [
        'images/product-1.png',
        'images/product-2.png',
        'images/cat-fugazzeta.jpg',
        'images/cat-1.png',
        'images/product-fugazza.jpg',
        'images/product-sandwich-clasico.jpg',
        'images/product-sandwich-napolitano.jpg',
        'images/product-faina.jpg',
        'images/product-faina-rellena.jpg',
        'images/product-lemeyun.jpg',
        'images/promo-metro-pizza.jpg',
        'images/product-gaseosa.jpg',
        'images/product-sprite.jpg',
        'images/product-pomelo.jpg',
        'images/product-cerveza.jpg'
    ];

    class AdminPanel {
        constructor() {
            this.db = window.productsDb;
            this.currentEditProductId = null;
            this.productToDeleteId = null;
            this.currentUploadedBase64 = null;
        }

        /**
         * Comprime y optimiza imágenes de celular/cámara mediante HTML5 Canvas.
         * Reduce fotos pesadas (5MB-15MB) a ~100KB JPEG en milisegundos sin perder nitidez.
         */
        compressImage(file, maxWidth = 1080, maxHeight = 1080, quality = 0.82) {
            return new Promise((resolve, reject) => {
                if (!file || !file.type.startsWith('image/')) {
                    return reject(new Error('El archivo seleccionado no es una imagen válida.'));
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > maxWidth) {
                                height = Math.round((height * maxWidth) / width);
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = Math.round((width * maxHeight) / height);
                                height = maxHeight;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    };
                    img.onerror = () => reject(new Error('No se pudo decodificar la imagen seleccionada.'));
                    img.src = e.target.result;
                };
                reader.onerror = () => reject(new Error('Error al leer el archivo del dispositivo.'));
                reader.readAsDataURL(file);
            });
        }

        init() {
            this.injectAdminHtml();
            this.bindEvents();
            this.checkAuthState();
            this.updateSyncStatusBadge();
        }

        /**
         * Inyecta el Topbar de Admin y los modales en el DOM
         */
        injectAdminHtml() {
            // 1. Admin Topbar (Unificado y limpio)
            const topbar = document.createElement('div');
            topbar.className = 'admin-topbar';
            topbar.id = 'admin-topbar';
            topbar.innerHTML = `
                <div class="admin-topbar-left">
                    <span class="admin-brand-tag"><i class="fas fa-shield-alt"></i> Modo Dueño</span>
                    <button class="btn-admin-action btn-admin-logout btn-admin-logout-mobile" id="btn-admin-logout-m" title="Cerrar sesión">
                        <i class="fas fa-sign-out-alt"></i> <span>Salir</span>
                    </button>
                </div>
                <div class="admin-topbar-right">
                    <button class="btn-admin-action btn-admin-add" id="btn-admin-add-product" title="Agregar nuevo producto">
                        <i class="fas fa-plus"></i> <span class="txt-desktop">Nuevo Producto</span><span class="txt-mobile">Nuevo</span>
                    </button>
                    <button class="btn-admin-action btn-admin-table" id="btn-admin-table-view" title="Ver y editar todo en formato planilla">
                        <i class="fas fa-table"></i> <span>Planilla</span>
                    </button>
                    <button class="btn-admin-action btn-admin-db" id="btn-admin-db-cfg" title="Estado de la Nube y Conexión">
                        <span class="admin-status-dot" id="topbar-status-dot"></span>
                        <i class="fas fa-database topbar-db-icon"></i>
                        <span class="txt-desktop" id="topbar-db-text">Supabase Conectado</span>
                        <span class="txt-mobile" id="topbar-db-text-mobile">Supabase</span>
                    </button>
                    <button class="btn-admin-action btn-admin-pass" id="btn-admin-change-pass" title="Cambiar Contraseña">
                        <i class="fas fa-key"></i> <span>Clave</span>
                    </button>
                    <button class="btn-admin-action btn-admin-logout btn-admin-logout-desktop" id="btn-admin-logout" title="Cerrar sesión de administrador">
                        <i class="fas fa-sign-out-alt"></i> <span>Salir</span>
                    </button>
                </div>
            `;
            document.body.prepend(topbar);

            // 2. Modals Container
            const modalsWrapper = document.createElement('div');
            modalsWrapper.innerHTML = `
                <!-- Overlay -->
                <div class="admin-modal-overlay" id="admin-modal-overlay"></div>

                <!-- Product Edit / Create Modal -->
                <div class="admin-modal" id="admin-product-modal" role="dialog" aria-modal="true">
                    <div class="admin-modal-header">
                        <h3 class="admin-modal-title" id="admin-modal-title"><i class="fas fa-edit"></i> <span>Editar Producto</span></h3>
                        <button class="admin-modal-close" id="admin-product-close"><i class="fas fa-times"></i></button>
                    </div>
                    <form id="admin-product-form" onsubmit="event.preventDefault();">
                        <div class="admin-modal-body">
                            <input type="hidden" id="field-product-id">

                            <div class="admin-form-row">
                                <div class="admin-field-group">
                                    <label class="admin-field-label" for="field-product-name">Nombre del Producto *</label>
                                    <input type="text" id="field-product-name" class="admin-input" placeholder="Ej: Pizza Cuatro Quesos" required>
                                </div>
                                <div class="admin-field-group">
                                    <label class="admin-field-label" for="field-product-category">Categoría *</label>
                                    <select id="field-product-category" class="admin-select" required>
                                        <option value="pizzas">Pizzas Artesanales</option>
                                        <option value="sandwiches">Sándwiches Calientes</option>
                                        <option value="faina">Fainá a la Leña</option>
                                        <option value="lemeyun">Lemeyun Armenio</option>
                                        <option value="bebidas">Bebidas & Cervezas</option>
                                        <option value="promos">Promociones & Combos</option>
                                    </select>
                                </div>
                            </div>

                            <div class="admin-form-row">
                                <div class="admin-field-group">
                                    <label class="admin-field-label" for="field-product-price">Precio Actual ($ UYU) *</label>
                                    <input type="number" id="field-product-price" class="admin-input" placeholder="Ej: 490" min="0" required>
                                </div>
                                <div class="admin-field-group">
                                    <label class="admin-field-label" for="field-product-old-price">Precio Anterior <small>(Opcional, para tachado)</small></label>
                                    <input type="number" id="field-product-old-price" class="admin-input" placeholder="Ej: 580" min="0">
                                </div>
                            </div>

                            <div class="admin-field-group">
                                <label class="admin-field-label" for="field-product-desc">Descripción</label>
                                <textarea id="field-product-desc" class="admin-textarea" placeholder="Descripción apetitosa con ingredientes y detalles horneados..."></textarea>
                            </div>

                            <div class="admin-field-group">
                                <label class="admin-field-label" for="field-product-ingredients">Ingredientes <small>(Separados por coma para personalización)</small></label>
                                <input type="text" id="field-product-ingredients" class="admin-input" placeholder="Ej: Salsa de tomate, Mozzarella, Albahaca, Aceite de oliva">
                            </div>

                            <div class="admin-field-group" id="field-group-variants" style="display: none;">
                                <label class="admin-field-label" for="field-product-variants">Variantes de Sabor <small>(Para bebidas, separadas por coma)</small></label>
                                <input type="text" id="field-product-variants" class="admin-input" placeholder="Ej: Común, Zero, Light">
                            </div>

                            <div class="admin-field-group">
                                <label class="admin-field-label" for="field-product-badge">Etiqueta Destacada <small>(Opcional)</small></label>
                                <input type="text" id="field-product-badge" class="admin-input" placeholder="Ej: Más Vendido, Favorito, Promo Amigos">
                            </div>

                            <!-- Image Selector -->
                            <div class="admin-image-picker">
                                <label class="admin-field-label"><i class="fas fa-camera"></i> Foto del Producto</label>
                                
                                <!-- 1-Click Upload desde Celular o PC -->
                                <div class="admin-upload-device-box">
                                    <input type="file" id="field-product-file" accept="image/*" style="display: none;">
                                    <button type="button" class="btn-upload-device" id="btn-trigger-file-upload">
                                        <i class="fas fa-camera"></i> <span>Sacar Foto con el Celular / Elegir Archivo</span>
                                    </button>
                                    <div class="upload-file-status" id="upload-file-status">
                                        <i class="fas fa-cloud-upload-alt"></i> Se guardará automáticamente en Supabase Storage (CDN)
                                    </div>
                                </div>

                                <div class="admin-image-preview-wrapper">
                                    <img src="images/product-1.png" alt="Preview" class="admin-image-preview" id="product-img-preview">
                                    <div style="flex: 1;">
                                        <label class="admin-subfield-label" for="field-product-image">O ingresá un enlace manual si preferís:</label>
                                        <input type="text" id="field-product-image" class="admin-input" placeholder="images/product-1.png o enlace web https://...">
                                    </div>
                                </div>

                                <details class="admin-quick-images-details">
                                    <summary class="quick-images-summary"><i class="fas fa-images"></i> O elegir una foto prediseñada del sistema</summary>
                                    <div class="admin-quick-images" id="admin-quick-images"></div>
                                </details>
                            </div>
                        </div>

                        <div class="admin-modal-footer">
                            <button type="button" class="btn-admin-cancel" id="btn-product-cancel">Cancelar</button>
                            <button type="submit" class="btn-admin-save" id="btn-product-save">
                                <i class="fas fa-save"></i> <span>Guardar Producto</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Delete Confirm Modal -->
                <div class="admin-modal" id="admin-delete-modal" role="dialog" aria-modal="true" style="max-width: 440px;">
                    <div class="delete-confirm-body">
                        <div class="delete-confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <h4 class="delete-confirm-title">¿Eliminar este producto?</h4>
                        <p class="delete-confirm-text" id="delete-confirm-msg">El producto se eliminará de la carta y de la base de datos de Supabase.</p>
                    </div>
                    <div class="admin-modal-footer" style="justify-content: center;">
                        <button type="button" class="btn-admin-cancel" id="btn-delete-cancel">Cancelar</button>
                        <button type="button" class="btn-admin-save" id="btn-delete-confirm" style="background: #dc2626;">
                            <i class="fas fa-trash"></i> <span>Sí, Eliminar</span>
                        </button>
                    </div>
                </div>

                <!-- Supabase Cloud Database Modal -->
                <div class="admin-modal" id="admin-db-modal" role="dialog" aria-modal="true" style="max-width: 580px;">
                    <div class="admin-modal-header">
                        <h3 class="admin-modal-title"><i class="fas fa-database" style="color: #38bdf8;"></i> <span>Base de Datos & Nube (Supabase)</span></h3>
                        <button class="admin-modal-close" id="admin-db-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="admin-modal-body">
                        <!-- Cloud Info Card -->
                        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 1.4rem; margin-bottom: 1.5rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                                <strong style="color: #ffffff; font-size: 1.35rem;"><i class="fas fa-server" style="color: #38bdf8;"></i> Estado del Sistema</strong>
                                <span style="background: #065f46; color: #34d399; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 1.15rem; font-weight: 600;">
                                    <i class="fas fa-check-circle"></i> Conectado a Supabase
                                </span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; font-size: 1.2rem; color: #d4d4d8;">
                                <div><strong>Base de Datos:</strong> PostgreSQL</div>
                                <div><strong>Storage:</strong> fotos-productos (CDN)</div>
                                <div><strong>Hosting:</strong> Vercel (Producción)</div>
                                <div><strong>Dominio:</strong> pizzeriabelgrano.vercel.app</div>
                            </div>
                        </div>

                        <!-- 1-Click Cloud Actions -->
                        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                            <button type="button" class="btn-sheets-action" id="btn-db-open-table" style="background: #0284c7; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 0.8rem; padding: 1.1rem; border-radius: 8px; font-weight: 600; font-size: 1.35rem; border: none; cursor: pointer; transition: background 0.2s;">
                                <i class="fas fa-table"></i> <span>Abrir Planilla de Productos (Estilo Excel)</span>
                            </button>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <button type="button" class="btn-sheets-action btn-sheets-import" id="btn-db-refresh-all" style="background: #27272a; border: 1px solid #3f3f46; color: #ffffff; padding: 0.9rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem;">
                                    <i class="fas fa-sync-alt"></i> <span>Refrescar Catálogo</span>
                                </button>
                                <button type="button" class="btn-sheets-action btn-sheets-export" id="btn-db-test-conn" style="background: #059669; border: 1px solid #10b981; color: #ffffff; padding: 0.9rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem;">
                                    <i class="fas fa-plug"></i> <span>Probar Conexión</span>
                                </button>
                            </div>
                        </div>

                        <div style="font-size: 1.2rem; color: #a1a1aa; line-height: 1.5; background: #18181b; padding: 1rem 1.2rem; border-radius: 8px; border: 1px solid #27272a;">
                            <i class="fas fa-lightbulb" style="color: #facc15;"></i> <strong>Sincronización Automática:</strong> Cualquier cambio que hagas en las pizzas o en la planilla se guarda al instante en la base de datos de la nube.
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                        <button type="button" class="btn-admin-cancel" id="btn-db-modal-close">Cerrar</button>
                        <a href="https://supabase.com/dashboard/project/rsuubjaeglnfxiprvqim/editor" target="_blank" style="font-size: 1.15rem; color: #38bdf8; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;" title="Solo para el desarrollador">
                            <i class="fas fa-external-link-alt"></i> Consola Técnica Supabase
                        </a>
                    </div>
                </div>

                <!-- In-Page Spreadsheet / Table Modal -->
                <div class="admin-modal" id="admin-table-modal" role="dialog" aria-modal="true" style="max-width: 960px; width: 95vw;">
                    <div class="admin-modal-header">
                        <h3 class="admin-modal-title"><i class="fas fa-table" style="color: #38bdf8;"></i> <span>Planilla de Productos (Edición Rápida)</span></h3>
                        <button class="admin-modal-close" id="admin-table-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="admin-modal-body" style="max-height: 70vh; overflow-y: auto; padding: 1.2rem 1.5rem;">
                        <p style="color: #a1a1aa; font-size: 1.25rem; margin-bottom: 1rem;">
                            Podés cambiar nombres, categorías y precios directamente en la tabla. Al terminar, tocá <strong>"Guardar Cambios en la Nube"</strong>.
                        </p>
                        <div class="table-responsive-wrapper" style="overflow-x: auto;">
                            <table class="admin-spreadsheet-table" id="admin-spreadsheet-table" style="width: 100%; border-collapse: collapse; font-size: 1.25rem;">
                                <thead>
                                    <tr style="background: #27272a; color: #ffffff; text-align: left;">
                                        <th style="padding: 0.8rem; border-bottom: 2px solid #3f3f46;">Foto</th>
                                        <th style="padding: 0.8rem; border-bottom: 2px solid #3f3f46;">Nombre</th>
                                        <th style="padding: 0.8rem; border-bottom: 2px solid #3f3f46;">Categoría</th>
                                        <th style="padding: 0.8rem; border-bottom: 2px solid #3f3f46; width: 110px;">Precio ($)</th>
                                        <th style="padding: 0.8rem; border-bottom: 2px solid #3f3f46; width: 110px;">Oferta ($)</th>
                                        <th style="padding: 0.8rem; border-bottom: 2px solid #3f3f46; text-align: center; width: 80px;">Visible</th>
                                        <th style="padding: 0.8rem; border-bottom: 2px solid #3f3f46; text-align: center; width: 90px;">Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="spreadsheet-table-body">
                                    <!-- Rendered dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="justify-content: space-between;">
                        <button type="button" class="btn-admin-cancel" id="btn-table-modal-close">Cerrar</button>
                        <button type="button" class="btn-admin-save" id="btn-table-save-all" style="background: #059669;">
                            <i class="fas fa-cloud-upload-alt"></i> <span>Guardar Cambios en la Nube</span>
                        </button>
                    </div>
                </div>

                <!-- Change Password Modal -->
                <div class="admin-modal" id="admin-password-modal" role="dialog" aria-modal="true" style="max-width: 480px;">
                    <div class="admin-modal-header">
                        <h3 class="admin-modal-title"><i class="fas fa-key" style="color: #facc15;"></i> <span>Cambiar Contraseña</span></h3>
                        <button class="admin-modal-close" id="admin-password-close"><i class="fas fa-times"></i></button>
                    </div>
                    <form id="admin-password-form" onsubmit="event.preventDefault();">
                        <div class="admin-modal-body">
                            <div style="background: rgba(250, 204, 21, 0.08); border: 1px dashed rgba(250, 204, 21, 0.3); padding: 1.2rem 1.4rem; border-radius: 10px; font-size: 1.25rem; color: #fde047; line-height: 1.5;">
                                <i class="fas fa-shield-alt"></i> La contraseña se guardará de forma segura en tu base de datos de <strong>Supabase</strong> en la nube. Solo vos tenés acceso a ella.
                            </div>
                            <div class="admin-field-group">
                                <label class="admin-field-label" for="pass-current">Contraseña Actual *</label>
                                <input type="password" id="pass-current" class="admin-input" placeholder="Tu clave actual (ej: 1111)" required>
                            </div>
                            <div class="admin-field-group">
                                <label class="admin-field-label" for="pass-new">Nueva Contraseña *</label>
                                <input type="password" id="pass-new" class="admin-input" placeholder="Mínimo 3 caracteres" required minlength="3">
                            </div>
                            <div class="admin-field-group">
                                <label class="admin-field-label" for="pass-confirm">Repetir Nueva Contraseña *</label>
                                <input type="password" id="pass-confirm" class="admin-input" placeholder="Confirmá la nueva clave" required minlength="3">
                            </div>
                        </div>
                        <div class="admin-modal-footer">
                            <button type="button" class="btn-admin-cancel" id="btn-password-cancel">Cancelar</button>
                            <button type="submit" class="btn-admin-save" id="btn-password-save" style="background: linear-gradient(135deg, #ca8a04, #eab308);">
                                <i class="fas fa-save"></i> <span>Actualizar Clave</span>
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modalsWrapper);

            // Ensure toast notification container exists
            if (!document.getElementById('toast-notice')) {
                const toast = document.createElement('div');
                toast.id = 'toast-notice';
                toast.className = 'toast-notice';
                document.body.appendChild(toast);
            }

            // Populate quick image selectors
            const quickImgsContainer = document.getElementById('admin-quick-images');
            if (quickImgsContainer) {
                quickImgsContainer.innerHTML = '';
                QUICK_IMAGE_LIST.forEach(imgPath => {
                    const img = document.createElement('img');
                    img.src = imgPath;
                    img.alt = 'Opción';
                    img.className = 'quick-img-thumb';
                    img.addEventListener('click', () => {
                        const inputImg = document.getElementById('field-product-image');
                        const preview = document.getElementById('product-img-preview');
                        const fileStatus = document.getElementById('upload-file-status');
                        const fileInput = document.getElementById('field-product-file');
                        if (inputImg) inputImg.value = imgPath;
                        if (preview) preview.src = imgPath;
                        if (fileInput) fileInput.value = '';
                        this.currentUploadedBase64 = null;
                        if (fileStatus) {
                            fileStatus.innerHTML = '<i class="fas fa-check-circle" style="color: #38bdf8;"></i> Usando foto predeterminada del sistema';
                        }
                        quickImgsContainer.querySelectorAll('.quick-img-thumb').forEach(el => el.classList.remove('selected'));
                        img.classList.add('selected');
                    });
                    quickImgsContainer.appendChild(img);
                });
            }
        }

        bindEvents() {
            // 1. Escuchar submit del login en header
            const loginForm = document.querySelector('.login-form');
            if (loginForm) {
                const handleLoginSubmit = async (e) => {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    const userInput = loginForm.querySelector('#login-username') || loginForm.querySelector('input[type="text"], input[type="email"]');
                    const passInput = loginForm.querySelector('#login-password') || loginForm.querySelector('input[type="password"]');
                    const submitBtn = loginForm.querySelector('#btn-login-submit') || loginForm.querySelector('button[type="submit"]');

                    const userVal = userInput ? userInput.value : '';
                    const passVal = passInput ? passInput.value : '';

                    if (!userVal || !passVal) {
                        alert('Por favor ingresá tu usuario y contraseña.');
                        return;
                    }

                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
                    }

                    try {
                        const res = await this.db.login(userVal, passVal);
                        if (res && res.success) {
                            loginForm.classList.remove('show-log');
                            this.checkAuthState();
                            this.showToast('¡Bienvenido Dueño! Modo Administrador activado 🍕');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                            alert(res.message || 'Usuario o contraseña incorrectos.');
                        }
                    } catch (err) {
                        alert('Error al iniciar sesión: ' + err.message);
                    } finally {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = 'Ingresar';
                        }
                    }
                };

                loginForm.addEventListener('submit', handleLoginSubmit);
                const submitBtn = loginForm.querySelector('#btn-login-submit') || loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.addEventListener('click', handleLoginSubmit);
                }
            }

            // 2. Auth State listener
            window.addEventListener('adminAuthChanged', () => {
                this.checkAuthState();
            });

            // 3. Sync Status listener
            window.addEventListener('syncStatusChanged', () => {
                this.updateSyncStatusBadge();
            });

            window.addEventListener('configChanged', () => {
                this.updateSyncStatusBadge();
            });

            // 4. Topbar buttons
            const handleLogout = () => {
                this.db.logout();
                this.showToast('Sesión de administrador cerrada.');
            };
            const btnLogout = document.getElementById('btn-admin-logout');
            const btnLogoutM = document.getElementById('btn-admin-logout-m');
            if (btnLogout) btnLogout.addEventListener('click', handleLogout);
            if (btnLogoutM) btnLogoutM.addEventListener('click', handleLogout);

            const btnAdd = document.getElementById('btn-admin-add-product');
            if (btnAdd) {
                btnAdd.addEventListener('click', () => {
                    this.openProductModal(null); // null = nuevo
                });
            }

            // 5. Product Form Modal Controls
            const modalOverlay = document.getElementById('admin-modal-overlay');
            const productModalClose = document.getElementById('admin-product-close');
            const productCancel = document.getElementById('btn-product-cancel');
            const productForm = document.getElementById('admin-product-form');

            const closeModal = () => this.closeAllModals();
            if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
            if (productModalClose) productModalClose.addEventListener('click', closeModal);
            if (productCancel) productCancel.addEventListener('click', closeModal);

            // Device file upload triggers & image compression
            const btnTriggerUpload = document.getElementById('btn-trigger-file-upload');
            const fileInput = document.getElementById('field-product-file');
            const fileStatus = document.getElementById('upload-file-status');
            const inputImg = document.getElementById('field-product-image');
            const preview = document.getElementById('product-img-preview');

            if (btnTriggerUpload && fileInput) {
                btnTriggerUpload.addEventListener('click', () => {
                    fileInput.click();
                });
            }

            if (fileInput) {
                fileInput.addEventListener('change', async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;

                    if (fileStatus) {
                        fileStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizando imagen para la nube...';
                    }

                    try {
                        const compressedBase64 = await this.compressImage(file);
                        this.currentUploadedBase64 = compressedBase64;
                        if (preview) preview.src = compressedBase64;
                        if (inputImg) inputImg.value = ''; // Se usará la foto cargada
                        if (fileStatus) {
                            fileStatus.innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e;"></i> Foto lista (${file.name || 'celular'}) - Se subirá a Supabase al guardar`;
                        }
                    } catch (err) {
                        alert('Error al procesar la imagen: ' + err.message);
                        if (fileStatus) {
                            fileStatus.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> Error al cargar la imagen';
                        }
                    }
                });
            }

            // Change image preview on manual input
            if (inputImg && preview) {
                inputImg.addEventListener('input', () => {
                    if (inputImg.value.trim()) {
                        preview.src = inputImg.value.trim();
                        this.currentUploadedBase64 = null;
                        if (fileStatus) {
                            fileStatus.innerHTML = '<i class="fas fa-link"></i> Usando enlace manual';
                        }
                    } else if (!this.currentUploadedBase64) {
                        preview.src = 'images/product-1.png';
                    }
                });
            }

            // Show variants input if category is 'bebidas'
            const catSelect = document.getElementById('field-product-category');
            const variantsGroup = document.getElementById('field-group-variants');
            if (catSelect && variantsGroup) {
                catSelect.addEventListener('change', () => {
                    variantsGroup.style.display = catSelect.value === 'bebidas' ? 'flex' : 'none';
                });
            }

            if (productForm) {
                productForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.saveProductFromModal();
                });
            }

            // 6. Delete modal controls
            const btnDeleteCancel = document.getElementById('btn-delete-cancel');
            const btnDeleteConfirm = document.getElementById('btn-delete-confirm');
            if (btnDeleteCancel) btnDeleteCancel.addEventListener('click', closeModal);
            if (btnDeleteConfirm) {
                btnDeleteConfirm.addEventListener('click', async () => {
                    if (this.productToDeleteId) {
                        try {
                            await this.db.deleteProduct(this.productToDeleteId);
                            this.showToast('Producto eliminado exitosamente.');
                            this.closeAllModals();
                        } catch (err) {
                            alert('Error al eliminar: ' + err.message);
                        }
                    }
                });
            }

            // 7. Supabase Database & Table Modal Controls
            const btnDbCfg = document.getElementById('btn-admin-db-cfg');
            const dbModalClose = document.getElementById('admin-db-close');
            const dbModalCloseBtn = document.getElementById('btn-db-modal-close');
            const btnDbTestConn = document.getElementById('btn-db-test-conn');
            const btnDbRefresh = document.getElementById('btn-db-refresh-all');
            const btnDbOpenTable = document.getElementById('btn-db-open-table');

            // Botón en topbar para abrir modal de Base de Datos
            if (btnDbCfg) btnDbCfg.addEventListener('click', () => this.openDbModal());

            // Cerrar modal de DB
            if (dbModalClose) dbModalClose.addEventListener('click', closeModal);
            if (dbModalCloseBtn) dbModalCloseBtn.addEventListener('click', closeModal);

            // Probar conexión con Supabase
            if (btnDbTestConn) {
                btnDbTestConn.addEventListener('click', async () => {
                    btnDbTestConn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando...';
                    try {
                        const res = await this.db.testConnection();
                        btnDbTestConn.innerHTML = '<i class="fas fa-check"></i> ¡Conectado!';
                        setTimeout(() => { btnDbTestConn.innerHTML = '<i class="fas fa-plug"></i> <span>Probar Conexión</span>'; }, 3000);
                        alert('✅ ' + (res.message || '¡Conexión con Supabase verificada con éxito!'));
                    } catch (err) {
                        btnDbTestConn.innerHTML = '<i class="fas fa-times"></i> Error';
                        setTimeout(() => { btnDbTestConn.innerHTML = '<i class="fas fa-plug"></i> <span>Probar Conexión</span>'; }, 3000);
                        alert('❌ Error al conectar con Supabase: ' + err.message);
                    }
                });
            }

            // Refrescar catálogo desde Supabase
            if (btnDbRefresh) {
                btnDbRefresh.addEventListener('click', async () => {
                    btnDbRefresh.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refrescando...';
                    try {
                        const prods = await this.db.fetchFromSupabase();
                        btnDbRefresh.innerHTML = '<i class="fas fa-check"></i> ¡Actualizado!';
                        setTimeout(() => { btnDbRefresh.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Refrescar Catálogo</span>'; }, 3000);
                        this.showToast(`¡Catálogo actualizado desde Supabase (${prods ? prods.length : 0} productos)!`);
                        this.updateSyncStatusBadge();
                    } catch (err) {
                        btnDbRefresh.innerHTML = '<i class="fas fa-times"></i> Error';
                        setTimeout(() => { btnDbRefresh.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Refrescar Catálogo</span>'; }, 3000);
                        alert('Error al traer datos desde Supabase: ' + err.message);
                    }
                });
            }

            // Abrir planilla desde el modal de DB
            if (btnDbOpenTable) {
                btnDbOpenTable.addEventListener('click', () => {
                    this.closeAllModals();
                    this.openTableModal();
                });
            }

            // 7.1 Planilla Modal Controls
            const btnTableView = document.getElementById('btn-admin-table-view');
            const tableModalClose = document.getElementById('admin-table-close');
            const tableModalCloseBtn = document.getElementById('btn-table-modal-close');
            const btnTableSaveAll = document.getElementById('btn-table-save-all');

            if (btnTableView) btnTableView.addEventListener('click', () => this.openTableModal());
            if (tableModalClose) tableModalClose.addEventListener('click', closeModal);
            if (tableModalCloseBtn) tableModalCloseBtn.addEventListener('click', closeModal);
            if (btnTableSaveAll) btnTableSaveAll.addEventListener('click', () => this.saveTableChanges());

            // Delegación de clics dentro de la tabla de la planilla
            document.addEventListener('click', (e) => {
                const editRowBtn = e.target.closest('.btn-table-row-edit');
                if (editRowBtn) {
                    const prodId = editRowBtn.getAttribute('data-id');
                    this.closeAllModals();
                    this.openProductModal(prodId);
                }
            });

            // 7.1 Change Password Modal events
            const btnChangePass = document.getElementById('btn-admin-change-pass');
            const passModal = document.getElementById('admin-password-modal');
            const passModalClose = document.getElementById('admin-password-close');
            const passModalCancel = document.getElementById('btn-password-cancel');
            const passForm = document.getElementById('admin-password-form');

            if (btnChangePass) {
                btnChangePass.addEventListener('click', () => {
                    if (passForm) passForm.reset();
                    const overlay = document.getElementById('admin-modal-overlay');
                    if (overlay) overlay.classList.add('active');
                    if (passModal) passModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            }

            if (passModalClose) passModalClose.addEventListener('click', closeModal);
            if (passModalCancel) passModalCancel.addEventListener('click', closeModal);

            if (passForm) {
                passForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const cur = document.getElementById('pass-current').value;
                    const n1 = document.getElementById('pass-new').value;
                    const n2 = document.getElementById('pass-confirm').value;
                    const btnSavePass = document.getElementById('btn-password-save');

                    if (n1 !== n2) {
                        alert('Las contraseñas nuevas no coinciden. Por favor verificalas.');
                        return;
                    }

                    if (n1.length < 3) {
                        alert('La nueva contraseña debe tener al menos 3 caracteres.');
                        return;
                    }

                    btnSavePass.disabled = true;
                    btnSavePass.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                    try {
                        await this.db.changePassword(cur, n1);
                        this.showToast('¡Contraseña actualizada con éxito en Supabase!');
                        this.closeAllModals();
                    } catch (err) {
                        alert('Error: ' + err.message);
                    } finally {
                        btnSavePass.disabled = false;
                        btnSavePass.innerHTML = '<i class="fas fa-save"></i> <span>Actualizar Clave</span>';
                    }
                });
            }

            // 8. Delegación de clics en botones de edición/eliminación de tarjetas
            document.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.btn-card-edit');
                if (editBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const prodId = editBtn.getAttribute('data-id');
                    this.openProductModal(prodId);
                    return;
                }

                const deleteBtn = e.target.closest('.btn-card-delete');
                if (deleteBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const prodId = deleteBtn.getAttribute('data-id');
                    this.openDeleteModal(prodId);
                    return;
                }
            });
        }

        checkAuthState() {
            const isAdmin = this.db.isAdmin();
            const topbar = document.getElementById('admin-topbar');

            if (isAdmin) {
                document.body.classList.add('admin-mode-active');
                if (topbar) topbar.classList.add('active');
            } else {
                document.body.classList.remove('admin-mode-active');
                if (topbar) topbar.classList.remove('active');
            }
        }

        openDbModal() {
            const modal = document.getElementById('admin-db-modal');
            const overlay = document.getElementById('admin-modal-overlay');
            if (overlay) overlay.classList.add('active');
            if (modal) modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        openTableModal() {
            const modal = document.getElementById('admin-table-modal');
            const overlay = document.getElementById('admin-modal-overlay');
            const tbody = document.getElementById('spreadsheet-table-body');
            if (!modal || !tbody) return;

            const prods = this.db.products || [];
            tbody.innerHTML = prods.map(p => `
                <tr data-id="${p.id}" style="border-bottom: 1px solid #3f3f46;">
                    <td style="padding: 0.6rem;">
                        <img src="${p.image || 'images/product-1.png'}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #52525b;">
                    </td>
                    <td style="padding: 0.6rem;">
                        <input type="text" class="table-input-name" value="${(p.name || '').replace(/"/g, '&quot;')}" style="width: 100%; min-width: 180px; background: #18181b; border: 1px solid #3f3f46; color: #fff; padding: 0.5rem 0.7rem; border-radius: 6px; font-size: 1.25rem;">
                    </td>
                    <td style="padding: 0.6rem;">
                        <select class="table-input-cat" style="background: #18181b; border: 1px solid #3f3f46; color: #fff; padding: 0.5rem 0.7rem; border-radius: 6px; font-size: 1.25rem;">
                            <option value="pizzas" ${p.category === 'pizzas' ? 'selected' : ''}>Pizzas</option>
                            <option value="sandwiches" ${p.category === 'sandwiches' ? 'selected' : ''}>Sándwiches</option>
                            <option value="faina" ${p.category === 'faina' ? 'selected' : ''}>Fainá</option>
                            <option value="lemeyun" ${p.category === 'lemeyun' ? 'selected' : ''}>Lemeyun</option>
                            <option value="bebidas" ${p.category === 'bebidas' ? 'selected' : ''}>Bebidas</option>
                            <option value="promos" ${p.category === 'promos' ? 'selected' : ''}>Promos</option>
                        </select>
                    </td>
                    <td style="padding: 0.6rem;">
                        <input type="number" class="table-input-price" value="${p.price || 0}" min="0" style="width: 100px; background: #18181b; border: 1px solid #3f3f46; color: #fff; padding: 0.5rem 0.7rem; border-radius: 6px; font-size: 1.25rem; font-weight: bold;">
                    </td>
                    <td style="padding: 0.6rem;">
                        <input type="number" class="table-input-oldprice" value="${p.old_price || ''}" min="0" placeholder="-" style="width: 100px; background: #18181b; border: 1px solid #3f3f46; color: #a1a1aa; padding: 0.5rem 0.7rem; border-radius: 6px; font-size: 1.25rem;">
                    </td>
                    <td style="padding: 0.6rem; text-align: center;">
                        <input type="checkbox" class="table-input-active" ${p.active !== false ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer; accent-color: #22c55e;">
                    </td>
                    <td style="padding: 0.6rem; text-align: center;">
                        <button type="button" class="btn-table-row-edit" data-id="${p.id}" style="background: #2563eb; color: #fff; border: none; padding: 0.5rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 1.2rem;" title="Editar foto y descripción completa">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            if (overlay) overlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        async saveTableChanges() {
            const btnSave = document.getElementById('btn-table-save-all');
            const tbody = document.getElementById('spreadsheet-table-body');
            if (!tbody || !btnSave) return;

            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando cambios...';

            const rows = tbody.querySelectorAll('tr[data-id]');
            let changedCount = 0;

            try {
                for (const tr of rows) {
                    const id = tr.getAttribute('data-id');
                    const name = tr.querySelector('.table-input-name').value.trim();
                    const category = tr.querySelector('.table-input-cat').value;
                    const price = Number(tr.querySelector('.table-input-price').value);
                    const oldPriceVal = tr.querySelector('.table-input-oldprice').value;
                    const old_price = oldPriceVal ? Number(oldPriceVal) : null;
                    const active = tr.querySelector('.table-input-active').checked;

                    const current = this.db.getProductById(id);
                    if (current) {
                        const hasChanged = current.name !== name || 
                                           current.category !== category || 
                                           current.price !== price || 
                                           current.old_price !== old_price || 
                                           current.active !== active;

                        if (hasChanged) {
                            await this.db.updateProduct(id, { name, category, price, old_price, active });
                            changedCount++;
                        }
                    }
                }

                this.closeAllModals();
                this.showToast(changedCount > 0 ? `¡${changedCount} productos actualizados con éxito en Supabase!` : 'No se detectaron cambios.');
            } catch (err) {
                alert('Error al guardar cambios: ' + err.message);
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> <span>Guardar Cambios en la Nube</span>';
            }
        }

        updateSyncStatusBadge() {
            const dot = document.getElementById('topbar-status-dot');
            const textEl = document.getElementById('topbar-db-text');
            const textM = document.getElementById('topbar-db-text-mobile');
            if (!dot) return;

            const cfg = this.db.config;
            if (!cfg.supabaseUrl || !cfg.supabaseKey) {
                dot.style.background = '#eab308';
                if (textEl) textEl.innerText = 'Modo Local';
                if (textM) textM.innerText = 'Local';
            } else if (cfg.lastSyncStatus === 'syncing') {
                dot.style.background = '#38bdf8';
                if (textEl) textEl.innerText = 'Sincronizando...';
                if (textM) textM.innerText = 'Sinc...';
            } else if (cfg.lastSyncStatus === 'error') {
                dot.style.background = '#ef4444';
                if (textEl) textEl.innerText = 'Error Supabase';
                if (textM) textM.innerText = 'Error';
            } else {
                dot.style.background = '#22c55e';
                if (textEl) textEl.innerText = 'Supabase Conectado';
                if (textM) textM.innerText = 'Supabase';
            }
        }

        openProductModal(productId = null) {
            this.currentEditProductId = productId;
            const modal = document.getElementById('admin-product-modal');
            const overlay = document.getElementById('admin-modal-overlay');
            const titleEl = document.getElementById('admin-modal-title');
            const form = document.getElementById('admin-product-form');

            const idField = document.getElementById('field-product-id');
            const nameField = document.getElementById('field-product-name');
            const catField = document.getElementById('field-product-category');
            const priceField = document.getElementById('field-product-price');
            const oldPriceField = document.getElementById('field-product-old-price');
            const descField = document.getElementById('field-product-desc');
            const ingrField = document.getElementById('field-product-ingredients');
            const varField = document.getElementById('field-product-variants');
            const badgeField = document.getElementById('field-product-badge');
            const imgField = document.getElementById('field-product-image');
            const imgPreview = document.getElementById('product-img-preview');
            const variantsGroup = document.getElementById('field-group-variants');

            this.currentUploadedBase64 = null;
            const fileInput = document.getElementById('field-product-file');
            const fileStatus = document.getElementById('upload-file-status');
            if (fileInput) fileInput.value = '';
            if (fileStatus) {
                fileStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Se guardará automáticamente en Supabase Storage (CDN)';
            }

            if (productId) {
                // Modo Edición
                const product = this.db.getProductById(productId);
                if (!product) return;

                titleEl.innerHTML = `<i class="fas fa-edit" style="color: #ea580c;"></i> <span>Editar: ${product.name}</span>`;
                idField.value = product.id;
                nameField.value = product.name;
                catField.value = product.category || 'pizzas';
                priceField.value = product.price || '';
                oldPriceField.value = product.old_price || '';
                descField.value = product.desc || '';
                ingrField.value = product.ingredients || '';
                varField.value = product.variants || '';
                badgeField.value = product.badge || '';
                imgField.value = product.image || 'images/product-1.png';
                imgPreview.src = product.image || 'images/product-1.png';
                variantsGroup.style.display = product.category === 'bebidas' ? 'flex' : 'none';
            } else {
                // Modo Nuevo Producto
                titleEl.innerHTML = `<i class="fas fa-plus-circle" style="color: #ea580c;"></i> <span>Agregar Nuevo Producto</span>`;
                form.reset();
                idField.value = '';
                imgField.value = 'images/product-1.png';
                imgPreview.src = 'images/product-1.png';
                variantsGroup.style.display = 'none';
            }

            overlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            nameField.focus();
        }

        openDeleteModal(productId) {
            this.productToDeleteId = productId;
            const product = this.db.getProductById(productId);
            if (!product) return;

            const modal = document.getElementById('admin-delete-modal');
            const overlay = document.getElementById('admin-modal-overlay');
            const msgEl = document.getElementById('delete-confirm-msg');

            msgEl.innerHTML = `¿Estás seguro de que querés eliminar <strong>"${product.name}"</strong> ($${product.price})?<br>Se eliminará de la carta y de la base de datos de Supabase.`;

            overlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        closeAllModals() {
            document.querySelectorAll('.admin-modal').forEach(m => m.classList.remove('active'));
            const overlay = document.getElementById('admin-modal-overlay');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
            this.currentEditProductId = null;
            this.productToDeleteId = null;
        }

        async saveProductFromModal() {
            const btnSave = document.getElementById('btn-product-save');
            const id = document.getElementById('field-product-id').value;
            const name = document.getElementById('field-product-name').value.trim();
            const category = document.getElementById('field-product-category').value;
            const price = Number(document.getElementById('field-product-price').value);
            const old_price = document.getElementById('field-product-old-price').value ? Number(document.getElementById('field-product-old-price').value) : null;
            const desc = document.getElementById('field-product-desc').value.trim();
            const ingredients = document.getElementById('field-product-ingredients').value.trim();
            const variants = document.getElementById('field-product-variants').value.trim();
            const badge = document.getElementById('field-product-badge').value.trim();
            const image = document.getElementById('field-product-image').value.trim() || 'images/product-1.png';

            btnSave.disabled = true;
            btnSave.innerHTML = this.currentUploadedBase64 
                ? '<i class="fas fa-spinner fa-spin"></i> <span>Subiendo foto a Supabase...</span>' 
                : '<i class="fas fa-spinner fa-spin"></i> <span>Guardando...</span>';

            try {
                if (id) {
                    // Actualización
                    await this.db.updateProduct(id, {
                        name,
                        category,
                        price,
                        old_price,
                        desc,
                        ingredients,
                        variants,
                        badge,
                        image,
                        imageBase64: this.currentUploadedBase64 || null
                    });
                    this.showToast(`¡"${name}" actualizado con éxito!`);
                } else {
                    // Nuevo Producto
                    await this.db.addProduct({
                        name,
                        category,
                        price,
                        old_price,
                        desc,
                        ingredients,
                        variants,
                        badge,
                        image,
                        imageBase64: this.currentUploadedBase64 || null
                    });
                    this.showToast(`¡"${name}" agregado al menú con éxito!`);
                }
                this.closeAllModals();
            } catch (err) {
                alert('Error al guardar el producto: ' + err.message);
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i class="fas fa-save"></i> <span>Guardar Producto</span>';
            }
        }

        showToast(message) {
            const toastEl = document.getElementById('toast-notice');
            if (toastEl) {
                toastEl.innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e;"></i> <span>${message}</span>`;
                toastEl.classList.add('show');
                setTimeout(() => {
                    toastEl.classList.remove('show');
                }, 3200);
            } else {
                alert(message);
            }
        }
    }

    // Inicialización a prueba de fallos (funciona antes o después de DOMContentLoaded)
    function initAdminPanel() {
        if (!window.adminPanel) {
            window.adminPanel = new AdminPanel();
            window.adminPanel.init();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminPanel);
    } else {
        initAdminPanel();
    }
})(window, document);
