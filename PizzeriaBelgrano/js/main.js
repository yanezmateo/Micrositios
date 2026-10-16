/**
 * PIZZERÍA BELGRANO - ARTISANAL LOGIC, CAROUSELS, CUSTOMIZATION & WHATSAPP
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let cart = JSON.parse(localStorage.getItem('pizzeria_cart')) || [];
    const whatsappPhone = '59892884951'; // Teléfono del local: 092 884 951 (Montevideo, Uruguay)

    // Active Customization State (Item 9)
    let currentCustomItem = null;
    let currentCustomQty = 1;

    // --- DOM Elements ---
    const header = document.querySelector('.header');
    const menuBtn = document.querySelector('#menu-btn');
    const navbar = document.querySelector('.navbar');
    const menuOverlay = document.querySelector('#menu-overlay');

    const searchBtn = document.querySelector('#search-btn');
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('#search-box');
    const loginBtn = document.querySelector('#login-btn');
    const loginForm = document.querySelector('.login-form');

    const cartBtn = document.querySelector('#cart-btn');
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartOverlay = document.querySelector('.cart-overlay');
    const cartCloseBtn = document.querySelector('.cart-drawer-close');
    const cartItemsContainer = document.querySelector('.cart-items-container');
    const cartBadge = document.querySelector('#cart-badge');
    const totalAmountEl = document.querySelector('#cart-total-amount');
    const floatingCartBtn = document.querySelector('.floating-cart-btn');
    const floatingCartCount = document.querySelector('.floating-cart-count');
    const floatingCartTotal = document.querySelector('.floating-cart-total');
    const checkoutWhatsappBtn = document.querySelector('#btn-checkout-whatsapp');
    const toastEl = document.querySelector('#toast-notice');

    // Customization Modal Elements
    const customModal = document.querySelector('#custom-modal');
    const customModalOverlay = document.querySelector('#custom-modal-overlay');
    const modalCloseBtn = document.querySelector('#modal-close-btn');
    const modalCategory = document.querySelector('#modal-category');
    const modalTitle = document.querySelector('#modal-title');
    const modalUnitPrice = document.querySelector('#modal-unit-price');
    const modalImage = document.querySelector('#modal-image');
    const modalDesc = document.querySelector('#modal-description');
    const modalQtyVal = document.querySelector('#modal-qty-val');
    const modalQtyMinus = document.querySelector('#modal-qty-minus');
    const modalQtyPlus = document.querySelector('#modal-qty-plus');
    const modalOptionsContainer = document.querySelector('#modal-options-container');
    const modalOptionsLabel = document.querySelector('#modal-options-label');
    const modalOptionsHelp = document.querySelector('#modal-options-help');
    const modalTotalDisplay = document.querySelector('#modal-total-display');
    const modalConfirmBtn = document.querySelector('#modal-confirm-btn');

    // --- Format Currency ---
    function formatCurrency(amount) {
        return '$' + Number(amount).toLocaleString('es-UY');
    }

    // --- Header Scroll Effect ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });

    // --- Navigation & Dropdowns (Item 1: Fixed, Dedicated Overlay, No Blur Bug) ---
    function closeMobileMenu() {
        if (navbar) navbar.classList.remove('active');
        if (menuBtn) menuBtn.classList.remove('fa-times');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function closeAllDropdowns() {
        if (searchForm) searchForm.classList.remove('show-form');
        if (loginForm) loginForm.classList.remove('show-log');
        closeMobileMenu();
    }

    if (menuBtn && navbar) {
        menuBtn.addEventListener('click', () => {
            const isActive = navbar.classList.toggle('active');
            menuBtn.classList.toggle('fa-times', isActive);
            if (menuOverlay) menuOverlay.classList.toggle('active', isActive);

            if (isActive) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }

            if (searchForm) searchForm.classList.remove('show-form');
            if (loginForm) loginForm.classList.remove('show-log');
        });
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close mobile menu when clicking any nav link
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    if (searchBtn && searchForm) {
        searchBtn.addEventListener('click', () => {
            searchForm.classList.toggle('show-form');
            if (loginForm) loginForm.classList.remove('show-log');
            closeMobileMenu();
            if (searchForm.classList.contains('show-form')) {
                searchInput && searchInput.focus();
            }
        });
    }

    if (loginBtn && loginForm) {
        loginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Si ya está logueado como dueño, hacer foco en la barra de admin
            if (window.productsDb && window.productsDb.isAdmin()) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const isShown = loginForm.classList.toggle('show-log');
            if (searchForm) searchForm.classList.remove('show-form');
            closeMobileMenu();

            if (isShown) {
                setTimeout(() => {
                    const uInput = loginForm.querySelector('#login-username');
                    if (uInput) uInput.focus();
                }, 100);
            }
        });
    }

    window.addEventListener('scroll', () => {
        if (searchForm && searchForm.classList.contains('show-form')) {
            if (document.activeElement !== searchInput) {
                searchForm.classList.remove('show-form');
            }
        }
        if (loginForm && loginForm.classList.contains('show-log')) {
            // No cerrar si el usuario está tipeando en el input (ej: teclado móvil)
            const isTyping = loginForm.contains(document.activeElement);
            if (!isTyping) {
                loginForm.classList.remove('show-log');
            }
        }
    }, { passive: true });

    // --- Search Input live filter in menu ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const productBoxes = document.querySelectorAll('.Menú .box');
            let foundAny = false;

            productBoxes.forEach(box => {
                const title = box.querySelector('h3')?.innerText.toLowerCase() || '';
                const desc = box.querySelector('p')?.innerText.toLowerCase() || '';
                if (title.includes(query) || desc.includes(query)) {
                    box.style.display = '';
                    foundAny = true;
                } else {
                    box.style.display = 'none';
                }
            });

            if (query.length > 2 && foundAny) {
                const menuSection = document.querySelector('#Menú');
                if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // --- Cart Drawer Open / Close ---
    function openCart() {
        closeAllDropdowns();
        closeCustomModal();
        if (cartDrawer) cartDrawer.classList.add('active');
        if (cartOverlay) cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        if (cartDrawer) cartDrawer.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (floatingCartBtn) floatingCartBtn.addEventListener('click', openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // --- Toast Notification ---
    let toastTimeout = null;
    function showToast(message) {
        if (!toastEl) return;
        toastEl.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
        toastEl.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2600);
    }

    // --- Product Customization Modal (Item 9) ---
    function openCustomModal(productData) {
        closeAllDropdowns();
        closeCart();

        currentCustomItem = {
            id: productData.id,
            name: productData.name,
            price: Number(productData.price),
            image: productData.image,
            category: productData.category || 'pizzas',
            rawIngredients: productData.ingredients ? productData.ingredients.split(',').map(s => s.trim()) : [],
            rawVariants: productData.variants ? productData.variants.split(',').map(s => s.trim()) : [],
            desc: productData.desc || ''
        };
        currentCustomQty = 1;

        // Populate modal headers
        if (modalCategory) {
            const catMap = {
                pizzas: 'Pizzas Artesanales',
                sandwiches: 'Sándwiches Calientes al Horno',
                faina: 'Fainá a la Leña',
                lemeyun: 'Lemeyun Armenio',
                bebidas: 'Bebidas Frías',
                promos: 'Promociones & Combos'
            };
            modalCategory.innerText = catMap[currentCustomItem.category] || 'Nuestra Carta';
        }
        if (modalTitle) modalTitle.innerText = currentCustomItem.name;
        if (modalUnitPrice) modalUnitPrice.innerText = formatCurrency(currentCustomItem.price);
        if (modalImage) modalImage.src = currentCustomItem.image;
        if (modalDesc) modalDesc.innerText = currentCustomItem.desc || currentCustomItem.name;
        if (modalQtyVal) modalQtyVal.innerText = '1';

        // Build Customization Options
        if (modalOptionsContainer) {
            modalOptionsContainer.innerHTML = '';

            if (currentCustomItem.category === 'bebidas') {
                // Radio pills for beverage variants
                if (modalOptionsLabel) modalOptionsLabel.innerHTML = `<i class="fas fa-wine-bottle"></i> Elegí la variante de sabor:`;
                if (modalOptionsHelp) modalOptionsHelp.innerText = `Seleccioná tu tipo de gaseosa o variedad de cerveza preferida:`;

                const variants = currentCustomItem.rawVariants.length > 0 
                    ? currentCustomItem.rawVariants 
                    : ['Común', 'Zero', 'Light'];

                const wrapper = document.createElement('div');
                wrapper.className = 'variant-radio-container';

                variants.forEach((v, index) => {
                    const item = document.createElement('div');
                    item.className = 'variant-radio-item' + (index === 0 ? ' selected' : '');
                    item.setAttribute('data-variant', v);
                    item.innerText = v;
                    item.addEventListener('click', () => {
                        wrapper.querySelectorAll('.variant-radio-item').forEach(el => el.classList.remove('selected'));
                        item.classList.add('selected');
                    });
                    wrapper.appendChild(item);
                });

                modalOptionsContainer.appendChild(wrapper);

            } else {
                // Checkboxes for pizza, lemeyun, faina ingredients (all checked by default)
                if (modalOptionsLabel) modalOptionsLabel.innerHTML = `<i class="fas fa-sliders-h"></i> Personalizá los ingredientes:`;
                if (modalOptionsHelp) modalOptionsHelp.innerText = `Todos los ingredientes vienen incluidos. Desmarcá con un toque el que prefieras quitar:`;

                let ingredients = currentCustomItem.rawIngredients;
                if (!ingredients || ingredients.length === 0) {
                    if (currentCustomItem.category === 'pizzas') {
                        ingredients = ['Salsa de tomate', 'Mozzarella', 'Orégano', 'Aceite de oliva'];
                    } else if (currentCustomItem.category === 'sandwiches') {
                        ingredients = ['Jamón cocido', 'Queso derretido', 'Toque de manteca'];
                    } else if (currentCustomItem.category === 'faina') {
                        ingredients = ['Pimienta negra', 'Orégano'];
                    } else if (currentCustomItem.category === 'lemeyun') {
                        ingredients = ['Carne vacuna', 'Tomate y cebolla', 'Perejil', 'Limón'];
                    } else {
                        ingredients = ['Receta completa'];
                    }
                }

                ingredients.forEach(ing => {
                    const checkItem = document.createElement('div');
                    checkItem.className = 'ingredient-checkbox-item checked';
                    checkItem.setAttribute('data-ingredient', ing);
                    checkItem.innerHTML = `
                        <span class="ingredient-name"><i class="fas fa-check"></i> ${ing}</span>
                        <div class="ingredient-checkbox-indicator"><i class="fas fa-check"></i></div>
                    `;

                    checkItem.addEventListener('click', () => {
                        const isChecked = checkItem.classList.toggle('checked');
                        const icon = checkItem.querySelector('.ingredient-checkbox-indicator i');
                        const nameIcon = checkItem.querySelector('.ingredient-name i');
                        if (isChecked) {
                            if (icon) icon.className = 'fas fa-check';
                            if (nameIcon) nameIcon.className = 'fas fa-check';
                        } else {
                            if (icon) icon.className = 'fas fa-times';
                            if (nameIcon) nameIcon.className = 'fas fa-ban';
                        }
                    });

                    modalOptionsContainer.appendChild(checkItem);
                });
            }
        }

        updateModalPrice();

        if (customModal) customModal.classList.add('active');
        if (customModalOverlay) customModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCustomModal() {
        if (customModal) customModal.classList.remove('active');
        if (customModalOverlay) customModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        currentCustomItem = null;
    }

    function updateModalPrice() {
        if (!currentCustomItem) return;
        const total = currentCustomItem.price * currentCustomQty;
        if (modalTotalDisplay) modalTotalDisplay.innerText = formatCurrency(total);
    }

    if (modalQtyMinus) {
        modalQtyMinus.addEventListener('click', () => {
            if (currentCustomQty > 1) {
                currentCustomQty--;
                if (modalQtyVal) modalQtyVal.innerText = currentCustomQty;
                updateModalPrice();
            }
        });
    }

    if (modalQtyPlus) {
        modalQtyPlus.addEventListener('click', () => {
            if (currentCustomQty < 30) {
                currentCustomQty++;
                if (modalQtyVal) modalQtyVal.innerText = currentCustomQty;
                updateModalPrice();
            }
        });
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCustomModal);
    if (customModalOverlay) customModalOverlay.addEventListener('click', closeCustomModal);

    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCustomModal();
            closeCart();
            closeAllDropdowns();
        }
    });

    // Confirm and Add Customized Product to Cart
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', () => {
            if (!currentCustomItem) return;

            let customizationsText = '';
            let uniqueKeySuffix = '';

            if (currentCustomItem.category === 'bebidas') {
                const selectedVariantEl = modalOptionsContainer.querySelector('.variant-radio-item.selected');
                const selectedVariant = selectedVariantEl ? selectedVariantEl.getAttribute('data-variant') : 'Común';
                customizationsText = `Variante: ${selectedVariant}`;
                uniqueKeySuffix = `-${selectedVariant}`;
            } else {
                // Collect removed ingredients
                const uncheckedItems = modalOptionsContainer.querySelectorAll('.ingredient-checkbox-item:not(.checked)');
                const removed = [];
                uncheckedItems.forEach(el => {
                    removed.push(el.getAttribute('data-ingredient'));
                });

                if (removed.length > 0) {
                    customizationsText = `Sin: ${removed.join(', ')}`;
                    uniqueKeySuffix = `-sin-${removed.map(s => s.substring(0, 4)).join('-')}`;
                }
            }

            const itemCartId = currentCustomItem.id + uniqueKeySuffix;

            // Check if identical customized item exists in cart
            const existing = cart.find(i => i.cartId === itemCartId);
            if (existing) {
                existing.quantity += currentCustomQty;
            } else {
                cart.push({
                    cartId: itemCartId,
                    id: currentCustomItem.id,
                    name: currentCustomItem.name,
                    price: currentCustomItem.price,
                    image: currentCustomItem.image,
                    quantity: currentCustomQty,
                    customizations: customizationsText
                });
            }

            updateCartUI(true);
            showToast(`¡${currentCustomItem.name} se agregó a tu pedido!`);
            closeCustomModal();
        });
    }

    // Delegated click listener for all "Agregar" buttons (works for dynamically rendered products)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-to-cart');
        if (!btn) return;
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const dbItem = window.productsDb ? window.productsDb.getProductById(id) : null;

        const name = dbItem ? dbItem.name : btn.getAttribute('data-name');
        const price = dbItem ? dbItem.price : parseFloat(btn.getAttribute('data-price'));
        const image = dbItem ? dbItem.image : btn.getAttribute('data-image');
        const category = dbItem ? dbItem.category : btn.getAttribute('data-category');
        const ingredients = dbItem ? dbItem.ingredients : btn.getAttribute('data-ingredients');
        const variants = dbItem ? dbItem.variants : btn.getAttribute('data-variants');
        const desc = dbItem ? dbItem.desc : btn.getAttribute('data-desc');

        openCustomModal({ id, name, price, image, category, ingredients, variants, desc });
    });

    // --- Render Cart UI ---
    function updateCartUI(shouldAnimate = false) {
        localStorage.setItem('pizzeria_cart', JSON.stringify(cart));

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Update Badges
        if (cartBadge) {
            cartBadge.innerText = totalItems;
            if (shouldAnimate) {
                cartBadge.classList.add('bump');
                setTimeout(() => cartBadge.classList.remove('bump'), 300);
            }
        }

        if (floatingCartCount) floatingCartCount.innerText = totalItems;
        if (floatingCartTotal) floatingCartTotal.innerText = formatCurrency(totalPrice);
        if (totalAmountEl) totalAmountEl.innerText = formatCurrency(totalPrice);

        // Animar e iluminar el carrito para indicar claramente dónde despachar
        if (shouldAnimate && totalItems > 0) {
            if (floatingCartBtn) {
                floatingCartBtn.classList.remove('cart-highlight');
                void floatingCartBtn.offsetWidth; // forzar reflow para reiniciar animación
                floatingCartBtn.classList.add('cart-highlight');
                setTimeout(() => floatingCartBtn.classList.remove('cart-highlight'), 950);
            }

            const cartWrapper = document.querySelector('.cart-btn-wrapper');
            if (cartWrapper) {
                cartWrapper.classList.remove('cart-highlight');
                void cartWrapper.offsetWidth;
                cartWrapper.classList.add('cart-highlight');
                setTimeout(() => cartWrapper.classList.remove('cart-highlight'), 950);
            }
        }

        // Render Items in Cart Drawer
        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty-state">
                    <i class="fas fa-pizza-slice"></i>
                    <h4>Tu carrito está vacío</h4>
                    <p>¡Elegí tus pizzas, fainá o lemeyun favoritos del menú!</p>
                </div>
            `;
            return;
        }

        let html = '';
        cart.forEach(item => {
            html += `
                <div class="cart-item" data-cart-id="${item.cartId || item.id}">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        ${item.customizations ? `<div class="cart-item-custom-notes">${item.customizations}</div>` : ''}
                        <div class="cart-item-price">${formatCurrency(item.price)}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn btn-decrease" data-cart-id="${item.cartId || item.id}"><i class="fas fa-minus"></i></button>
                            <span class="qty-number">${item.quantity}</span>
                            <button class="qty-btn btn-increase" data-cart-id="${item.cartId || item.id}"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <button class="cart-item-delete" data-cart-id="${item.cartId || item.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = html;

        // Attach listeners
        cartItemsContainer.querySelectorAll('.btn-decrease').forEach(btn => {
            btn.addEventListener('click', () => {
                const cartId = btn.getAttribute('data-cart-id');
                changeItemQuantity(cartId, -1);
            });
        });

        cartItemsContainer.querySelectorAll('.btn-increase').forEach(btn => {
            btn.addEventListener('click', () => {
                const cartId = btn.getAttribute('data-cart-id');
                changeItemQuantity(cartId, 1);
            });
        });

        cartItemsContainer.querySelectorAll('.cart-item-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const cartId = btn.getAttribute('data-cart-id');
                removeItem(cartId);
            });
        });
    }

    function changeItemQuantity(cartId, delta) {
        const item = cart.find(i => (i.cartId || i.id) === cartId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => (i.cartId || i.id) !== cartId);
        }
        updateCartUI(delta > 0);
    }

    function removeItem(cartId) {
        cart = cart.filter(i => (i.cartId || i.id) !== cartId);
        updateCartUI(false);
    }

    // --- WhatsApp Order Generation (Item 9 WhatsApp Customizations) ---
    if (checkoutWhatsappBtn) {
        checkoutWhatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (cart.length === 0) {
                alert('Tu carrito está vacío. Agregá al menos un producto antes de pedir.');
                return;
            }

            const nameInput = document.querySelector('#checkout-name');
            const addressInput = document.querySelector('#checkout-address');
            const paymentSelect = document.querySelector('#checkout-payment');
            const notesInput = document.querySelector('#checkout-notes');

            const name = nameInput ? nameInput.value.trim() : '';
            const address = addressInput ? addressInput.value.trim() : '';
            const payment = paymentSelect ? paymentSelect.value : 'Efectivo';
            const notes = notesInput ? notesInput.value.trim() : '';

            if (!name) {
                alert('Por favor ingresá tu nombre para el pedido.');
                if (nameInput) nameInput.focus();
                return;
            }

            if (!address) {
                alert('Por favor ingresá la dirección de entrega (o "Retiro por local").');
                if (addressInput) addressInput.focus();
                return;
            }

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            let msg = `🍕 *NUEVO PEDIDO - LA BELGRANO (MONTEVIDEO)* 🍕\n\n`;
            msg += `👤 *Cliente:* ${name}\n`;
            msg += `📍 *Dirección:* ${address}\n`;
            msg += `💳 *Medio de Pago:* ${payment}\n`;
            if (notes) {
                msg += `📝 *Aclaraciones de entrega:* ${notes}\n`;
            }
            msg += `\n🛒 *DETALLE DEL PEDIDO:*\n`;

            cart.forEach(item => {
                const sub = formatCurrency(item.price * item.quantity);
                let itemLine = `• ${item.quantity}x ${item.name}`;
                if (item.customizations) {
                    itemLine += ` [${item.customizations}]`;
                }
                itemLine += ` (${formatCurrency(item.price)} c/u) = ${sub}\n`;
                msg += itemLine;
            });

            msg += `\n💰 *TOTAL A ABONAR: ${formatCurrency(total)}*\n\n`;
            msg += `🛵 _¡Hola! Por favor confírmenme el pedido y tiempo estimado de entrega._`;

            const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`;
            window.open(whatsappUrl, '_blank');
        });
    }

    // --- Category Filter Tabs in Menu (Item 8: Hide/Show Carousels per category) ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const categoryBlocks = document.querySelectorAll('.menu-category-block');

    function applyCategoryFilter(filter) {
        filterButtons.forEach(b => {
            if (b.getAttribute('data-filter') === filter) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        categoryBlocks.forEach(block => {
            const blockCategory = block.getAttribute('data-category');
            if (filter === 'all' || blockCategory === filter) {
                block.style.display = 'block';
            } else {
                block.style.display = 'none';
            }
        });

        // Update all swipers to recalculate slider layout
        if (window.swipersMap) {
            Object.values(window.swipersMap).forEach(s => s && s.update && s.update());
        }
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            applyCategoryFilter(filter);
        });
    });

    // --- Prevent unwanted mobile zoom (Pinch & Double-tap zoom) ---
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });

    let lastTouchTime = 0;
    document.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapInterval = currentTime - lastTouchTime;
        if (tapInterval < 300 && tapInterval > 0) {
            e.preventDefault();
        }
        lastTouchTime = currentTime;
    }, { passive: false });

    // --- Delivery Address Checker with Distance Logic (Item 13) ---
    const addressInput = document.querySelector('#delivery-address-input');
    const addressCheckBtn = document.querySelector('#delivery-check-btn');
    const addressStatusMsg = document.querySelector('#delivery-status-msg');

    if (addressCheckBtn && addressInput && addressStatusMsg) {
        // Coordenadas del local: Belgrano 2881, Parque Batlle, Montevideo
        const RESTAURANT_COORDS = { lat: -34.8997387, lng: -56.1581452 };

        function calculateDistanceKm(lat1, lon1, lat2, lon2) {
            const R = 6371; // Radio de la Tierra en km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        function renderDistanceResult(dist) {
            if (dist <= 2.2) {
                addressStatusMsg.className = 'delivery-status-msg success';
                addressStatusMsg.innerHTML = '<i class="fas fa-check-circle"></i> <strong>¡Llegamos a tu casa! Zona 1:</strong> Envío <strong>SIN CARGO</strong> (20 a 30 min).';
            } else if (dist <= 5.0) {
                addressStatusMsg.className = 'delivery-status-msg express';
                addressStatusMsg.innerHTML = '<i class="fas fa-bolt"></i> <strong>¡Llegamos a tu casa! Zona 2:</strong> Envío <strong>$60</strong> (30 a 40 min).';
            } else if (dist <= 7.0) {
                addressStatusMsg.className = 'delivery-status-msg express';
                addressStatusMsg.innerHTML = '<i class="fas fa-motorcycle"></i> <strong>¡Llegamos a tu casa!</strong> Envío <strong>$90</strong> (40 a 50 min).';
            } else {
                addressStatusMsg.className = 'delivery-status-msg error';
                addressStatusMsg.innerHTML = '<i class="fas fa-times-circle"></i> <strong>Zona fuera de cobertura.</strong> Podés pedir con modalidad Take Away (retiro en el local con 15% OFF).';
            }
        }

        function evaluateFallbackZones(val) {
            const zona1Streets = ['belgrano', 'parque batlle', 'batlle', 'blanqueada', 'tres cruces', 'ricaldoni', 'centenario', 'britanico', 'británico', 'av italia', 'italia', '8 de octubre', 'garibaldi', 'morquio', 'larrañaga'];
            const zona2Streets = ['pocitos', 'buceo', 'cordon', 'cordón', 'parque rodo', 'parque rodó', 'punta carretas', 'palermo', 'centro', 'rivera', 'benito blanco', 'españa', 'av brasil', 'av. brasil', 'avenida brasil', '21 de setiembre', 'rambla', 'ellauri'];

            const isZona1 = zona1Streets.some(kw => val.includes(kw));
            const isZona2 = zona2Streets.some(kw => val.includes(kw));

            if (isZona1) {
                addressStatusMsg.className = 'delivery-status-msg success';
                addressStatusMsg.innerHTML = '<i class="fas fa-check-circle"></i> <strong>¡Llegamos a tu casa! Zona 1:</strong> Envío <strong>SIN CARGO</strong> (20 a 30 min).';
            } else if (isZona2) {
                addressStatusMsg.className = 'delivery-status-msg express';
                addressStatusMsg.innerHTML = '<i class="fas fa-bolt"></i> <strong>¡Llegamos a tu casa! Zona 2:</strong> Envío <strong>$60</strong> (30 a 40 min).';
            } else {
                addressStatusMsg.className = 'delivery-status-msg warning';
                addressStatusMsg.innerHTML = '<i class="fas fa-question-circle"></i> Hacé tu pedido por WhatsApp y te confirmamos la entrega.';
            }
        }

        async function verifyAddress() {
            const val = addressInput.value.trim();
            const lowerVal = val.toLowerCase();

            if (!val) {
                addressStatusMsg.className = 'delivery-status-msg warning';
                addressStatusMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Por favor ingresá calle y número (ej: <strong>Belgrano 2881</strong>).';
                addressInput.focus();
                return;
            }

            // 1. Detección rápida de países o regiones no locales (ej: "brasil")
            const foreignPlaces = ['brasil', 'brazil', 'argentina', 'chile', 'paraguay', 'madrid', 'españa', 'espana', 'miami', 'eeuu', 'mexico', 'colombia', 'peru', 'venezuela', 'europa', 'bolivia', 'italia', 'francia', 'buenos aires', 'cordoba', 'rosario', 'rio de janeiro', 'sao paulo'];
            if (foreignPlaces.includes(lowerVal)) {
                addressStatusMsg.className = 'delivery-status-msg error';
                addressStatusMsg.innerHTML = '<i class="fas fa-times-circle"></i> <strong>Zona fuera de cobertura.</strong> Podés pedir con modalidad Take Away (retiro en el local con 15% OFF).';
                return;
            }

            // 2. Comprobar que incluya número de puerta o intersección
            const hasDigits = /\d+/.test(val);
            const hasIntersection = /\by\b|\besq\b|\besquina\b/i.test(val);

            if (!hasDigits && !hasIntersection) {
                addressStatusMsg.className = 'delivery-status-msg warning';
                addressStatusMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Por favor indicá calle y número (ej: <strong>Belgrano 2881</strong> o <strong>Av. Brasil 2600</strong>).';
                return;
            }

            // 3. Geocodificación precisa y cálculo de distancia en km
            const originalBtnHtml = addressCheckBtn.innerHTML;
            addressCheckBtn.disabled = true;
            addressCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            addressStatusMsg.className = 'delivery-status-msg loading';
            addressStatusMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando dirección...';

            try {
                const query = lowerVal.includes('montevideo') ? val : `${val}, Montevideo, Uruguay`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=uy&format=json&limit=1`, {
                    signal: controller.signal,
                    headers: { 'Accept-Language': 'es' }
                });
                clearTimeout(timeoutId);

                if (resp.ok) {
                    const results = await resp.json();
                    if (results && results.length > 0) {
                        const lat = parseFloat(results[0].lat);
                        const lon = parseFloat(results[0].lon);
                        const dist = calculateDistanceKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, lat, lon);
                        renderDistanceResult(dist);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Geocodificación online no disponible, usando fallback:', err);
            } finally {
                addressCheckBtn.disabled = false;
                addressCheckBtn.innerHTML = originalBtnHtml;
            }

            // 4. Fallback si no hubo respuesta del mapa
            evaluateFallbackZones(lowerVal);
        }

        addressCheckBtn.addEventListener('click', verifyAddress);
        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyAddress();
            }
        });
    }

    // --- Dynamic Catalog Rendering from Products Database / Google Sheets ---
    function renderDynamicProducts() {
        if (!window.productsDb) return;

        // 1. Promos Grid
        const promosContainer = document.querySelector('.promos-grid');
        if (promosContainer) {
            const promos = window.productsDb.getProductsByCategory('promos');
            if (promos && promos.length > 0) {
                promosContainer.innerHTML = promos.map(p => `
                    <div class="promo-card ${p.badge ? 'promo-card-featured' : ''}" data-category="promos">
                        <div class="admin-card-actions">
                            <button class="btn-card-edit" data-id="${p.id}" title="Editar Producto"><i class="fas fa-pencil-alt"></i></button>
                            <button class="btn-card-delete" data-id="${p.id}" title="Eliminar Producto"><i class="fas fa-trash-alt"></i></button>
                        </div>
                        ${p.badge ? `<div class="promo-badge-tag"><i class="fas fa-crown"></i> ${p.badge}</div>` : ''}
                        <div class="promo-img-wrapper">
                            <img src="${p.image}" alt="${p.name}">
                        </div>
                        <div class="promo-card-content">
                            <div class="promo-header-row">
                                <h3>${p.name}</h3>
                                <div class="promo-prices">
                                    ${p.old_price ? `<span class="old-price">$${p.old_price}</span>` : ''}
                                    <span class="current-price">$${p.price}</span>
                                </div>
                            </div>
                            <p class="promo-desc">${p.desc}</p>
                            <div class="promo-footer-row">
                                ${p.old_price && p.old_price > p.price ? `<span class="promo-saving-pill"><i class="fas fa-tag"></i> Ahorrá $${p.old_price - p.price}</span>` : ''}
                                <button class="btn-add-to-cart btn-promo-add"
                                        data-id="${p.id}"
                                        data-name="${p.name}"
                                        data-price="${p.price}"
                                        data-image="${p.image}"
                                        data-category="promos"
                                        data-ingredients="${p.ingredients || ''}"
                                        data-desc="${p.desc || ''}">
                                    <i class="fas fa-plus"></i> Agregar Promo
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // 2. Swiper Categories: pizzas, sandwiches, faina, lemeyun, bebidas
        const categories = ['pizzas', 'sandwiches', 'faina', 'lemeyun', 'bebidas'];
        categories.forEach(cat => {
            const wrapper = document.querySelector(`.slider-${cat} .swiper-wrapper`);
            if (wrapper) {
                const items = window.productsDb.getProductsByCategory(cat);
                if (items && items.length > 0) {
                    wrapper.innerHTML = items.map(p => `
                        <div class="swiper-slide box" data-category="${p.category}">
                            <div class="admin-card-actions">
                                <button class="btn-card-edit" data-id="${p.id}" title="Editar Producto"><i class="fas fa-pencil-alt"></i></button>
                                <button class="btn-card-delete" data-id="${p.id}" title="Eliminar Producto"><i class="fas fa-trash-alt"></i></button>
                            </div>
                            <div class="product-img-wrapper">
                                <img src="${p.image}" alt="${p.name}">
                            </div>
                            <div class="product-content">
                                <div class="product-header-row">
                                    <h3>${p.name}</h3>
                                    <span class="price">$${p.price}</span>
                                </div>
                                <p class="product-description">${p.desc}</p>
                                <div class="product-footer-row">
                                    <div class="stars">
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                    </div>
                                    <button class="btn-add-to-cart" 
                                            data-id="${p.id}" 
                                            data-name="${p.name}" 
                                            data-price="${p.price}" 
                                            data-image="${p.image}"
                                            data-category="${p.category}"
                                            data-ingredients="${p.ingredients || ''}"
                                            data-variants="${p.variants || ''}"
                                            data-desc="${p.desc || ''}">
                                        <i class="fas fa-plus"></i> Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }

            // Update Swiper if already initialized
            if (window.swipersMap && window.swipersMap[cat]) {
                window.swipersMap[cat].update();
            }
        });
    }

    // Initialize Products DB and initial render
    if (window.productsDb) {
        window.productsDb.init().then(() => {
            renderDynamicProducts();
        });
    }
    window.addEventListener('productsReady', renderDynamicProducts);
    window.addEventListener('productsUpdated', renderDynamicProducts);

    // --- Initialize Swiper Carousels ---
    if (typeof Swiper !== 'undefined') {
        window.swipersMap = {};

        const swiperConfig = (prevClass, nextClass) => ({
            loop: false,
            grabCursor: true,
            spaceBetween: 16,
            slidesPerView: 1.15,
            navigation: {
                nextEl: nextClass,
                prevEl: prevClass,
            },
            breakpoints: {
                480: {
                    slidesPerView: 1.3,
                    spaceBetween: 18,
                },
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 24,
                },
                1280: {
                    slidesPerView: 4,
                    spaceBetween: 24,
                }
            }
        });

        // 4 Dedicated Swipers (Item 8)
        const pizzasSlider = document.querySelector('.slider-pizzas');
        if (pizzasSlider) {
            window.swipersMap.pizzas = new Swiper(pizzasSlider, swiperConfig('.prev-pizzas', '.next-pizzas'));
        }

        const sandwichesSlider = document.querySelector('.slider-sandwiches');
        if (sandwichesSlider) {
            window.swipersMap.sandwiches = new Swiper(sandwichesSlider, swiperConfig('.prev-sandwiches', '.next-sandwiches'));
        }

        const fainaSlider = document.querySelector('.slider-faina');
        if (fainaSlider) {
            window.swipersMap.faina = new Swiper(fainaSlider, swiperConfig('.prev-faina', '.next-faina'));
        }

        const lemeyunSlider = document.querySelector('.slider-lemeyun');
        if (lemeyunSlider) {
            window.swipersMap.lemeyun = new Swiper(lemeyunSlider, swiperConfig('.prev-lemeyun', '.next-lemeyun'));
        }

        const bebidasSlider = document.querySelector('.slider-bebidas');
        if (bebidasSlider) {
            window.swipersMap.bebidas = new Swiper(bebidasSlider, swiperConfig('.prev-bebidas', '.next-bebidas'));
        }

        // Reviews Swiper
        const reviewSlider = document.querySelector('.review-slider');
        if (reviewSlider) {
            new Swiper(reviewSlider, {
                loop: true,
                grabCursor: true,
                spaceBetween: 18,
                slidesPerView: 1.08,
                autoplay: {
                    delay: 4500,
                    disableOnInteraction: false,
                },
                breakpoints: {
                    600: {
                        slidesPerView: 1.4,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 22,
                    },
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 24,
                    }
                }
            });
        }
    }

    // Initial render of cart
    updateCartUI();
});
