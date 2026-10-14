/**
 * ==========================================================================
 * PIZZERÍA BELGRANO - ADMIN PANEL CONTROLLER
 * ==========================================================================
 * Controla la barra superior de administrador, formularios de edición/creación,
 * eliminación de productos y sincronización con Google Sheets.
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
            // 1. Admin Topbar
            const topbar = document.createElement('div');
            topbar.className = 'admin-topbar';
            topbar.id = 'admin-topbar';
            topbar.innerHTML = `
                <div class="admin-topbar-left">
                    <span class="admin-brand-tag"><i class="fas fa-shield-alt"></i> Modo Dueño</span>
                    <div class="admin-status-pill local" id="admin-status-pill" title="Clic para configurar Google Sheets">
                        <span class="admin-status-dot"></span>
                        <span class="admin-status-text">Guardando Localmente</span>
                    </div>
                </div>
                <div class="admin-topbar-right">
                    <button class="btn-admin-action btn-admin-add" id="btn-admin-add-product">
                        <i class="fas fa-plus-circle"></i> <span>Nuevo Producto</span>
                    </button>
                    <button class="btn-admin-action btn-admin-sheets" id="btn-admin-sheets-cfg">
                        <i class="fas fa-file-excel"></i> <span>Google Sheets</span>
                    </button>
                    <button class="btn-admin-action btn-admin-pass" id="btn-admin-change-pass" title="Cambiar Contraseña">
                        <i class="fas fa-key"></i> <span>Clave</span>
                    </button>
                    <button class="btn-admin-action btn-admin-logout" id="btn-admin-logout" title="Cerrar sesión de administrador">
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
                                        <i class="fas fa-cloud-upload-alt"></i> Se guardará automáticamente en tu Google Drive
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
                        <p class="delete-confirm-text" id="delete-confirm-msg">El producto se eliminará de la carta y de la hoja de Google Sheets.</p>
                    </div>
                    <div class="admin-modal-footer" style="justify-content: center;">
                        <button type="button" class="btn-admin-cancel" id="btn-delete-cancel">Cancelar</button>
                        <button type="button" class="btn-admin-save" id="btn-delete-confirm" style="background: #dc2626;">
                            <i class="fas fa-trash"></i> <span>Sí, Eliminar</span>
                        </button>
                    </div>
                </div>

                <!-- Google Sheets Settings & Sync Modal -->
                <div class="admin-modal" id="admin-sheets-modal" role="dialog" aria-modal="true">
                    <div class="admin-modal-header">
                        <h3 class="admin-modal-title"><i class="fas fa-file-excel" style="color: #22c55e;"></i> <span>Conexión con Google Sheets</span></h3>
                        <button class="admin-modal-close" id="admin-sheets-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-field-group">
                            <label class="admin-field-label" for="sheets-web-app-url">
                                URL de tu Aplicación Web de Google Apps Script:
                            </label>
                            <div style="display: flex; gap: 0.8rem;">
                                <input type="url" id="sheets-web-app-url" class="admin-input" placeholder="https://script.google.com/macros/s/AKfycb.../exec">
                                <button type="button" class="btn-admin-action" id="btn-test-sheets-conn" style="background: #2563eb; color: #fff; flex-shrink: 0;">
                                    <i class="fas fa-plug"></i> Probar
                                </button>
                            </div>
                            <small style="color: #a1a1aa;">Pegá el enlace obtenido al "Implementar como Aplicación Web" en Google Sheets.</small>
                        </div>

                        <!-- 1-Click Sync Actions -->
                        <div class="sheets-actions-grid">
                            <button type="button" class="btn-sheets-action btn-sheets-export" id="btn-sheets-export-all">
                                <i class="fas fa-cloud-upload-alt"></i> <span>Exportar Todo a Sheets</span>
                            </button>
                            <button type="button" class="btn-sheets-action btn-sheets-import" id="btn-sheets-import-all">
                                <i class="fas fa-cloud-download-alt"></i> <span>Descargar desde Sheets</span>
                            </button>
                        </div>

                        <!-- Step-by-step Setup Guide -->
                        <div class="sheets-setup-card">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong style="color: #ffffff; font-size: 1.35rem;"><i class="fas fa-book-open"></i> Guía rápida de conexión (1 minuto):</strong>
                            </div>
                            <ol class="sheets-steps-list">
                                <li>Abrí una hoja en blanco en <a href="https://sheets.new" target="_blank" style="color: #38bdf8; text-decoration: underline;">Google Sheets</a>.</li>
                                <li>En el menú superior, andá a <strong>Extensiones &gt; Apps Script</strong>.</li>
                                <li>Pegá el script que creamos en el proyecto (<code>google-sheets-backend.gs</code>).</li>
                                <li>Hacé clic en <strong>Implementar &gt; Nueva implementación</strong>, elegí <strong>Aplicación web</strong>, poné acceso para <em>"Cualquier usuario"</em> y copiá la URL.</li>
                                <li>Pegá la URL arriba y hacé clic en <strong>"Exportar Todo a Sheets"</strong> para cargar automáticamente todas las pizzas y productos en tu planilla.</li>
                            </ol>
                            <div class="sheets-copy-code-box">
                                <span style="font-size: 1.2rem; color: #a1a1aa;"><i class="fas fa-code"></i> Código backend listo para copiar:</span>
                                <button type="button" class="btn-copy-code" id="btn-copy-script-code">
                                    <i class="fas fa-copy"></i> Copiar Código Apps Script
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="admin-modal-footer">
                        <button type="button" class="btn-admin-cancel" id="btn-sheets-modal-close">Cerrar</button>
                        <button type="button" class="btn-admin-save" id="btn-sheets-save-url">
                            <i class="fas fa-check"></i> <span>Guardar URL</span>
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
                                <i class="fas fa-shield-alt"></i> La contraseña se guardará en la pestaña <strong>Configuracion</strong> de tu Google Sheet. Solo vos tenés acceso a ella.
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
            // 1. Escuchar submit del login en header (admin / 1111)
            const loginForm = document.querySelector('.login-form');
            if (loginForm) {
                // Agregar sugerencia visual si no existe
                if (!loginForm.querySelector('.login-hint-box')) {
                    const hint = document.createElement('div');
                    hint.className = 'login-hint-box';
                    hint.innerHTML = '<i class="fas fa-user-shield"></i> Acceso Dueño: <strong>admin</strong> | Clave: <strong>1111</strong>';
                    loginForm.appendChild(hint);
                }

                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const userInput = loginForm.querySelector('input[type="text"], input[type="email"]');
                    const passInput = loginForm.querySelector('input[type="password"]');
                    const submitBtn = loginForm.querySelector('button[type="submit"]');

                    const userVal = userInput ? userInput.value : '';
                    const passVal = passInput ? passInput.value : '';

                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
                    }

                    try {
                        const res = await this.db.login(userVal, passVal);
                        if (res && res.success) {
                            loginForm.classList.remove('show-log');
                            this.showToast('¡Bienvenido Dueño! Modo Administrador activado 🍕');
                        } else {
                            alert(res.message || 'Usuario o contraseña incorrectos.');
                        }
                    } catch (err) {
                        alert('Error al iniciar sesión: ' + err.message);
                    } finally {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = 'Iniciar Sesión';
                        }
                    }
                });
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
            const btnLogout = document.getElementById('btn-admin-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', () => {
                    this.db.logout();
                    this.showToast('Sesión de administrador cerrada.');
                });
            }

            const btnAdd = document.getElementById('btn-admin-add-product');
            if (btnAdd) {
                btnAdd.addEventListener('click', () => {
                    this.openProductModal(null); // null = nuevo
                });
            }

            const btnSheetsCfg = document.getElementById('btn-admin-sheets-cfg');
            const pillStatus = document.getElementById('admin-status-pill');
            if (btnSheetsCfg) btnSheetsCfg.addEventListener('click', () => this.openSheetsModal());
            if (pillStatus) pillStatus.addEventListener('click', () => this.openSheetsModal());

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
                        fileStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizando imagen para Google Drive...';
                    }

                    try {
                        const compressedBase64 = await this.compressImage(file);
                        this.currentUploadedBase64 = compressedBase64;
                        if (preview) preview.src = compressedBase64;
                        if (inputImg) inputImg.value = ''; // Se usará la foto cargada
                        if (fileStatus) {
                            fileStatus.innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e;"></i> Foto lista (${file.name || 'celular'}) - Se subirá a Drive al guardar`;
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

            // 7. Sheets Settings Modal Controls
            const sheetsModalClose = document.getElementById('admin-sheets-close');
            const sheetsModalCloseBtn = document.getElementById('btn-sheets-modal-close');
            const btnSaveSheetsUrl = document.getElementById('btn-sheets-save-url');
            const btnTestConn = document.getElementById('btn-test-sheets-conn');
            const btnExportAll = document.getElementById('btn-sheets-export-all');
            const btnImportAll = document.getElementById('btn-sheets-import-all');
            const btnCopyCode = document.getElementById('btn-copy-script-code');

            if (sheetsModalClose) sheetsModalClose.addEventListener('click', closeModal);
            if (sheetsModalCloseBtn) sheetsModalCloseBtn.addEventListener('click', closeModal);

            if (btnSaveSheetsUrl) {
                btnSaveSheetsUrl.addEventListener('click', () => {
                    const inputUrl = document.getElementById('sheets-web-app-url');
                    const val = inputUrl ? inputUrl.value.trim() : '';
                    this.db.saveConfig(val);
                    this.showToast('URL de Google Sheets guardada.');
                    this.updateSyncStatusBadge();
                    this.closeAllModals();
                });
            }

            if (btnTestConn) {
                btnTestConn.addEventListener('click', async () => {
                    const inputUrl = document.getElementById('sheets-web-app-url');
                    const val = inputUrl ? inputUrl.value.trim() : '';
                    if (!val) {
                        alert('Ingresá una URL de Google Apps Script primero.');
                        return;
                    }
                    btnTestConn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando...';
                    try {
                        const res = await this.db.testConnection(val);
                        btnTestConn.innerHTML = '<i class="fas fa-check"></i> ¡Conectado!';
                        setTimeout(() => { btnTestConn.innerHTML = '<i class="fas fa-plug"></i> Probar'; }, 3000);
                        alert('✅ ' + (res.message || '¡Conexión con Google Sheets verificada con éxito!'));
                    } catch (err) {
                        btnTestConn.innerHTML = '<i class="fas fa-times"></i> Error';
                        setTimeout(() => { btnTestConn.innerHTML = '<i class="fas fa-plug"></i> Probar'; }, 3000);
                        alert('❌ No se pudo conectar: ' + err.message + '\n\nRevisá que la implementación de Apps Script tenga acceso: "Cualquier usuario" (Anyone).');
                    }
                });
            }

            if (btnExportAll) {
                btnExportAll.addEventListener('click', async () => {
                    const inputUrl = document.getElementById('sheets-web-app-url');
                    if (inputUrl && inputUrl.value.trim()) {
                        this.db.saveConfig(inputUrl.value.trim());
                    }
                    if (!this.db.config.gasUrl) {
                        alert('Primero configurá y guardá la URL de Google Sheets.');
                        return;
                    }

                    btnExportAll.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
                    try {
                        const res = await this.db.exportAllToSheets();
                        btnExportAll.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
                        setTimeout(() => { btnExportAll.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Exportar Todo a Sheets'; }, 3000);
                        this.showToast(`¡${res.count || 'Todos los'} productos exportados a Google Sheets exitosamente!`);
                        this.updateSyncStatusBadge();
                    } catch (err) {
                        btnExportAll.innerHTML = '<i class="fas fa-times"></i> Error';
                        setTimeout(() => { btnExportAll.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Exportar Todo a Sheets'; }, 3000);
                        alert('Error al exportar a Google Sheets: ' + err.message);
                    }
                });
            }

            if (btnImportAll) {
                btnImportAll.addEventListener('click', async () => {
                    const inputUrl = document.getElementById('sheets-web-app-url');
                    if (inputUrl && inputUrl.value.trim()) {
                        this.db.saveConfig(inputUrl.value.trim());
                    }
                    if (!this.db.config.gasUrl) {
                        alert('Primero configurá la URL de Google Sheets.');
                        return;
                    }

                    btnImportAll.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
                    try {
                        const prods = await this.db.fetchFromSheets();
                        btnImportAll.innerHTML = '<i class="fas fa-check"></i> ¡Actualizado!';
                        setTimeout(() => { btnImportAll.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Descargar desde Sheets'; }, 3000);
                        this.showToast(`¡Catálogo actualizado desde Google Sheets (${prods ? prods.length : 0} productos)!`);
                        this.updateSyncStatusBadge();
                    } catch (err) {
                        btnImportAll.innerHTML = '<i class="fas fa-times"></i> Error';
                        setTimeout(() => { btnImportAll.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Descargar desde Sheets'; }, 3000);
                        alert('Error al traer datos desde Google Sheets: ' + err.message);
                    }
                });
            }

            if (btnCopyCode) {
                btnCopyCode.addEventListener('click', () => {
                    // Copiar el texto o indicar el archivo
                    const code = `// Abrir el archivo google-sheets-backend.gs de este proyecto para el código completo.`;
                    navigator.clipboard.writeText(code).then(() => {
                        this.showToast('¡Nombre de archivo copiado! Buscá google-sheets-backend.gs en tu carpeta.');
                    }).catch(() => {
                        alert('Encontrá el código completo listo para pegar en el archivo: google-sheets-backend.gs');
                    });
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
                        this.showToast('¡Contraseña actualizada con éxito en Google Sheets!');
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

        updateSyncStatusBadge() {
            const pill = document.getElementById('admin-status-pill');
            if (!pill) return;

            const cfg = this.db.config;
            pill.className = 'admin-status-pill';

            if (!cfg.gasUrl) {
                pill.classList.add('local');
                pill.querySelector('.admin-status-text').innerText = 'Modo Local (Configurar Sheets)';
                pill.title = 'Los cambios se guardan en este navegador. Hacé clic para conectar con Google Sheets.';
            } else if (cfg.lastSyncStatus === 'syncing') {
                pill.classList.add('syncing');
                pill.querySelector('.admin-status-text').innerText = 'Sincronizando con Sheets...';
            } else if (cfg.lastSyncStatus === 'error') {
                pill.classList.add('error');
                pill.querySelector('.admin-status-text').innerText = 'Error en Sheets (Verificar)';
                pill.title = 'Hubo un error de conexión con Google Sheets. Clic para verificar la URL.';
            } else {
                pill.classList.add('synced');
                pill.querySelector('.admin-status-text').innerText = 'Google Sheets Conectado';
                pill.title = 'Conectado en vivo con Google Sheets. Clic para administrar.';
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
                fileStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Se guardará automáticamente en tu Google Drive';
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

            msgEl.innerHTML = `¿Estás seguro de que querés eliminar <strong>"${product.name}"</strong> ($${product.price})?<br>Se actualizará el catálogo y la hoja de Google Sheets.`;

            overlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        openSheetsModal() {
            const modal = document.getElementById('admin-sheets-modal');
            const overlay = document.getElementById('admin-modal-overlay');
            const inputUrl = document.getElementById('sheets-web-app-url');

            if (inputUrl) {
                inputUrl.value = this.db.config.gasUrl || '';
            }

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
                ? '<i class="fas fa-spinner fa-spin"></i> <span>Subiendo foto a Drive...</span>' 
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

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        window.adminPanel = new AdminPanel();
        window.adminPanel.init();
    });

})(window, document);
