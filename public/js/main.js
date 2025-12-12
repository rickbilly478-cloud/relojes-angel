// Main JavaScript - Relojes Angel

// Cargar productos destacados en la página principal
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        
        // Filtrar solo productos destacados
        const destacados = productos.filter(p => p.destacado).slice(0, 6);
        
        if (destacados.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No hay productos destacados disponibles en este momento.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = destacados.map(producto => `
            <article class="product-card" data-id="${producto.id}">
                ${producto.destacado ? '<span class="product-badge">Destacado</span>' : ''}
                ${producto.precio_anterior ? '<span class="product-badge sale">Oferta</span>' : ''}
                <div class="product-image">
                    <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
                    <div class="product-overlay">
                        <a href="/catalogo" class="quick-view-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Ver Detalles
                        </a>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-brand">${producto.marca}</span>
                    <h3 class="product-name">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcion ? producto.descripcion.substring(0, 80) + '...' : ''}</p>
                    <div class="product-price">
                        <span class="current-price">$${producto.precio.toFixed(2)}</span>
                        ${producto.precio_anterior ? `<span class="old-price">$${producto.precio_anterior.toFixed(2)}</span>` : ''}
                    </div>
                    <button class="btn btn-primary btn-block add-to-cart-btn" data-id="${producto.id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"/>
                            <circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        Agregar al Carrito
                    </button>
                </div>
            </article>
        `).join('');
        
        // Agregar event listeners a botones de agregar al carrito
        container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                await addToCartFromHome(this.dataset.id, this);
            });
        });
        
    } catch (error) {
        console.error('Error loading featured products:', error);
        container.innerHTML = `
            <div class="error-state">
                <p>Error al cargar los productos. Por favor intenta de nuevo más tarde.</p>
            </div>
        `;
    }
}

// Agregar producto al carrito desde la página principal
async function addToCartFromHome(productId, button) {
    const session = await checkSession();
    
    if (!session.authenticated) {
        showToast('Debes iniciar sesión para agregar productos al carrito', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }
    
    // Deshabilitar botón temporalmente
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"/>
        </svg>
        Agregando...
    `;
    
    try {
        const response = await fetch('/api/carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                productoId: parseInt(productId),
                cantidad: 1
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            showToast('✓ Producto agregado al carrito', 'success');
            await updateCartCount();
            
            // Restaurar botón con checkmark temporalmente
            button.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                ¡Agregado!
            `;
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 2000);
        } else {
            const data = await response.json();
            showToast(data.error || 'Error al agregar al carrito', 'error');
            button.innerHTML = originalText;
            button.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Manejar formulario de newsletter
function setupNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        
        if (!email) {
            showToast('Por favor ingresa tu correo electrónico', 'warning');
            return;
        }
        
        // Simular suscripción exitosa
        showToast('¡Gracias por suscribirte! Recibirás nuestras novedades.', 'success');
        this.reset();
    });
}

// Manejar formulario de contacto
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const message = document.getElementById('contactMessage').value;
        
        if (!name || !email || !message) {
            showToast('Por favor completa todos los campos', 'warning');
            return;
        }
        
        // Simular envío exitoso
        showToast('¡Mensaje enviado! Te responderemos pronto.', 'success');
        this.reset();
    });
}

// Smooth scroll para enlaces internos
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animación al hacer scroll
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observar elementos que queremos animar
    document.querySelectorAll('.product-card, .category-card, .stat, .about-content, .contact-item').forEach(el => {
        observer.observe(el);
    });
}

// Lazy loading de imágenes
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Header scroll effect
function setupHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide header on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 500) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
        
        lastScroll = currentScroll;
    });
}

// Contador animado para estadísticas
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current) + '+';
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + '+';
            }
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// Inicializar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar productos destacados si estamos en la página principal
    if (document.getElementById('featuredProducts')) {
        loadFeaturedProducts();
    }
    
    // Configurar formularios
    setupNewsletterForm();
    setupContactForm();
    
    // Configurar efectos visuales
    setupSmoothScroll();
    setupScrollAnimations();
    setupLazyLoading();
    setupHeaderScroll();
    animateCounters();
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            if (navLinks) navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Cerrar menú al hacer click en un enlace
        if (navLinks) {
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.classList.remove('menu-open');
                });
            });
        }
    }
    
    // Cerrar menú móvil al cambiar tamaño de ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
            if (navLinks) navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
});

// Exportar funciones para uso global
window.loadFeaturedProducts = loadFeaturedProducts;
window.addToCartFromHome = addToCartFromHome;
