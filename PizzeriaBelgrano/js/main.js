/**
 * PIZZERÍA BELGRANO - INTERACTIVE LOGIC & WHATSAPP INTEGRATION
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let cart = JSON.parse(localStorage.getItem('pizzeria_cart')) || [];
    const whatsappPhone = '5491134567890'; // Teléfono del local

    // --- DOM Elements ---
    const header = document.querySelector('.header');
    const menuBtn = document.querySelector('#menu-btn');
    const navbar = document.querySelector('.navbar');
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

    // --- Header Scroll Effect ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Navigation & Dropdowns ---
    function closeAllDropdowns() {
        if (searchForm) searchForm.classList.remove('show-form');
        if (loginForm) loginForm.classList.remove('show-log');
        if (navbar) navbar.classList.remove('active');
        if (menuBtn) menuBtn.classList.remove('fa-times');
    }

    if (menuBtn && navbar) {
        menuBtn.addEventListener('click', () => {
            const isActive = navbar.classList.toggle('active');
            menuBtn.classList.toggle('fa-times', isActive);
            if (searchForm) searchForm.classList.remove('show-form');
            if (loginForm) loginForm.classList.remove('show-log');
        });
    }

    if (searchBtn && searchForm) {
        searchBtn.addEventListener('click', () => {
            searchForm.classList.toggle('show-form');
            if (loginForm) loginForm.classList.remove('show-log');
            if (navbar) navbar.classList.remove('active');
            if (menuBtn) menuBtn.classList.remove('fa-times');
            if (searchForm.classList.contains('show-form')) {
                searchInput && searchInput.focus();
            }
        });
    }

    if (loginBtn && loginForm) {
        loginBtn.addEventListener('click', () => {
            loginForm.classList.toggle('show-log');
            if (searchForm) searchForm.classList.remove('show-form');
            if (navbar) navbar.classList.remove('active');
            if (menuBtn) menuBtn.classList.remove('fa-times');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            closeAllDropdowns();
        });
    });

    // Close dropdowns on scroll
    window.addEventListener('scroll', () => {
        if (searchForm && searchForm.classList.contains('show-form')) {
            searchForm.classList.remove('show-form');
        }
        if (loginForm && loginForm.classList.contains('show-log')) {
            loginForm.classList.remove('show-log');
        }
    }, { passive: true });

    // --- Search Input live filter in menu ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const productBoxes = document.querySelectorAll('.Menú .box, .products .box');
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
                const menuSection = document.querySelector('#Menú, #products');
                if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // --- Cart Drawer Open / Close ---
    function openCart() {
        closeAllDropdowns();
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

    // Any CTA with data-action="open-cart"
    document.querySelectorAll('[data-action="open-cart"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    });

    // --- Toast Notification ---
    let toastTimeout = null;
    function showToast(message) {
        if (!toastEl) return;
        toastEl.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
        toastEl.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2500);
    }

    // --- Currency Formatter ---
    function formatCurrency(amount) {
        return '$' + amount.toLocaleString('es-AR');
    }

    // --- Render Cart ---
    function updateCartUI() {
        localStorage.setItem('pizzeria_cart', JSON.stringify(cart));

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Update Badges
        if (cartBadge) {
            cartBadge.innerText = totalItems;
            cartBadge.classList.add('bump');
            setTimeout(() => cartBadge.classList.remove('bump'), 300);
        }

        if (floatingCartCount) floatingCartCount.innerText = totalItems;
        if (floatingCartTotal) floatingCartTotal.innerText = formatCurrency(totalPrice);
        if (totalAmountEl) totalAmountEl.innerText = formatCurrency(totalPrice);

        // Render Items
        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty-state">
                    <i class="fas fa-pizza-slice"></i>
                    <h4>Tu carrito está vacío</h4>
                    <p>¡Elegí tus pizzas y empanadas favoritas del menú!</p>
                </div>
            `;
            return;
        }

        let html = '';
        cart.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <div class="cart-item-price">${formatCurrency(item.price)}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn btn-decrease" data-id="${item.id}"><i class="fas fa-minus"></i></button>
                            <span class="qty-number">${item.quantity}</span>
                            <button class="qty-btn btn-increase" data-id="${item.id}"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <button class="cart-item-delete" data-id="${item.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = html;

        // Attach listeners to items
        cartItemsContainer.querySelectorAll('.btn-decrease').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                changeItemQuantity(id, -1);
            });
        });

        cartItemsContainer.querySelectorAll('.btn-increase').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                changeItemQuantity(id, 1);
            });
        });

        cartItemsContainer.querySelectorAll('.cart-item-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                removeItem(id);
            });
        });
    }

    function addToCart(product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image: product.image,
                quantity: 1
            });
        }
        updateCartUI();
        showToast(`¡${product.name} agregada al pedido!`);
    }

    function changeItemQuantity(id, delta) {
        const item = cart.find(i => i.id === id);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    }

    function removeItem(id) {
        cart = cart.filter(i => i.id !== id);
        updateCartUI();
    }

    // Attach "Agregar al Carrito" buttons in catalog
    document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            const image = btn.getAttribute('data-image');

            addToCart({ id, name, price, image });

            // Button feedback
            const originalText = btn.innerHTML;
            btn.classList.add('added');
            btn.innerHTML = `<i class="fas fa-check"></i> ¡Agregado!`;
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = originalText;
            }, 1200);
        });
    });

    // --- WhatsApp Order Generation ---
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

            let msg = `🍕 *NUEVO PEDIDO - PIZZERÍA BELGRANO* 🍕\n\n`;
            msg += `👤 *Cliente:* ${name}\n`;
            msg += `📍 *Dirección:* ${address}\n`;
            msg += `💳 *Medio de Pago:* ${payment}\n`;
            if (notes) {
                msg += `📝 *Aclaraciones:* ${notes}\n`;
            }
            msg += `\n🛒 *DETALLE DEL PEDIDO:*\n`;

            cart.forEach(item => {
                const sub = formatCurrency(item.price * item.quantity);
                msg += `• ${item.quantity}x ${item.name} (${formatCurrency(item.price)} c/u) = ${sub}\n`;
            });

            msg += `\n💰 *TOTAL A ABONAR: ${formatCurrency(total)}*\n\n`;
            msg += `🛵 _¡Hola! Por favor confírmenme el pedido y tiempo estimado de entrega._`;

            const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`;
            window.open(whatsappUrl, '_blank');
        });
    }

    // --- Category Filter Tabs in Menu ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productSlides = document.querySelectorAll('.product-slider .swiper-slide');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            productSlides.forEach(slide => {
                const category = slide.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    slide.style.display = '';
                } else {
                    slide.style.display = 'none';
                }
            });

            // Update Swiper if present
            if (window.productSwiper) {
                window.productSwiper.update();
            }
        });
    });

    // --- Initialize Swiper Carousels ---
    if (typeof Swiper !== 'undefined') {
        // Products Swiper
        const productSliders = document.querySelectorAll('.product-slider');
        productSliders.forEach(slider => {
            window.productSwiper = new Swiper(slider, {
                loop: false,
                grabCursor: true,
                spaceBetween: 24,
                slidesPerView: 1,
                breakpoints: {
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
        });

        // Reviews Swiper
        const reviewSliders = document.querySelectorAll('.review-slider, .Reseñas-slider');
        reviewSliders.forEach(slider => {
            new Swiper(slider, {
                loop: true,
                grabCursor: true,
                spaceBetween: 24,
                slidesPerView: 1,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false,
                },
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 24,
                    }
                }
            });
        });
    }

    // Initial render of cart
    updateCartUI();
});
