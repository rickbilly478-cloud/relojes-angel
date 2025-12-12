// Autenticación y manejo de sesión - Relojes Angel

// Verificar sesión del usuario
async function checkSession() {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
            updateUIForAuthenticatedUser(data.user);
        } else {
            updateUIForGuestUser();
        }
        
        return data;
    } catch (error) {
        console.error('Error checking session:', error);
        return { authenticated: false };
    }
}

// Actualizar UI para usuario autenticado
function updateUIForAuthenticatedUser(user) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) {
        userMenu.style.display = 'block';
        if (userName) userName.textContent = user.nombre || 'Usuario';
    }
}

// Actualizar UI para usuario invitado
function updateUIForGuestUser() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
}

// Cerrar sesión
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            showToast('Sesión cerrada exitosamente', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        console.error('Error logging out:', error);
        showToast('Error al cerrar sesión', 'error');
    }
}

// Actualizar contador del carrito
async function updateCartCount() {
    try {
        const session = await checkSession();
        if (!session.authenticated) {
            const cartCount = document.getElementById('cartCount');
            if (cartCount) cartCount.textContent = '0';
            return;
        }

        const response = await fetch('/api/carrito', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const items = await response.json();
            const totalItems = items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                cartCount.textContent = totalItems;
                if (totalItems > 0) {
                    cartCount.classList.add('has-items');
                } else {
                    cartCount.classList.remove('has-items');
                }
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Mostrar notificaciones toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Obtener icono según tipo de toast
function getToastIcon(type) {
    const icons = {
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>`,
        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>`,
        warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>`
    };
    
    return icons[type] || icons.info;
}

// Proteger rutas que requieren autenticación
async function requireAuth(redirectUrl = '/login') {
    const session = await checkSession();
    if (!session.authenticated) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// Prevenir acceso a páginas de auth si ya está autenticado
async function redirectIfAuthenticated(redirectUrl = '/dashboard') {
    const session = await checkSession();
    if (session.authenticated) {
        window.location.href = redirectUrl;
        return true;
    }
    return false;
}

// Manejar errores de respuesta de la API
function handleAPIError(response, data) {
    if (response.status === 401) {
        showToast('Sesión expirada. Por favor inicia sesión nuevamente.', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
    
    if (response.status === 403) {
        showToast('No tienes permisos para realizar esta acción.', 'error');
        return;
    }
    
    if (response.status === 404) {
        showToast('Recurso no encontrado.', 'error');
        return;
    }
    
    if (response.status >= 500) {
        showToast('Error del servidor. Por favor intenta más tarde.', 'error');
        return;
    }
    
    // Mostrar mensaje de error específico si existe
    const errorMessage = data?.error || data?.message || 'Ocurrió un error inesperado';
    showToast(errorMessage, 'error');
}

// Inicializar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar sesión
    await checkSession();
    
    // Actualizar contador del carrito
    await updateCartCount();
    
    // Configurar botón de logout si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Configurar menú de usuario
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
    
    // Configurar menú móvil
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }
});

// Exportar funciones para uso global
window.checkSession = checkSession;
window.logout = logout;
window.updateCartCount = updateCartCount;
window.showToast = showToast;
window.requireAuth = requireAuth;
window.redirectIfAuthenticated = redirectIfAuthenticated;
window.handleAPIError = handleAPIError;
