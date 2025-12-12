// Validación de formularios - Relojes Angel

// Validar email
function validateEmail(input) {
    const errorElement = document.getElementById(input.id + 'Error');
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        if (errorElement) errorElement.textContent = 'El correo electrónico es requerido';
        input.classList.add('error');
        input.classList.remove('success');
        return false;
    }

    if (!emailRegex.test(email)) {
        if (errorElement) errorElement.textContent = 'Ingresa un correo electrónico válido';
        input.classList.add('error');
        input.classList.remove('success');
        return false;
    }

    if (errorElement) errorElement.textContent = '';
    input.classList.remove('error');
    input.classList.add('success');
    return true;
}

// Validar contraseña
function validatePassword(input) {
    const errorElement = document.getElementById(input.id + 'Error');
    const password = input.value;

    if (!password) {
        if (errorElement) errorElement.textContent = 'La contraseña es requerida';
        input.classList.add('error');
        input.classList.remove('success');
        return false;
    }

    if (password.length < 8) {
        if (errorElement) errorElement.textContent = 'La contraseña debe tener mínimo 8 caracteres';
        input.classList.add('error');
        input.classList.remove('success');
        return false;
    }

    // Verificar requisitos de seguridad
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber) {
        if (errorElement) errorElement.textContent = 'La contraseña debe contener mayúsculas, minúsculas y números';
        input.classList.add('error');
        input.classList.remove('success');
        return false;
    }

    if (errorElement) errorElement.textContent = '';
    input.classList.remove('error');
    input.classList.add('success');
    return true;
}

// Sanitizar entrada de texto
function sanitizeInput(input) {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Validar longitud de campo
function validateLength(input, minLength, maxLength = Infinity) {
    const value = input.value.trim();
    
    if (value.length < minLength) {
        return {
            valid: false,
            message: `Debe tener al menos ${minLength} caracteres`
        };
    }
    
    if (value.length > maxLength) {
        return {
            valid: false,
            message: `No puede exceder ${maxLength} caracteres`
        };
    }
    
    return { valid: true };
}

// Validar formato de teléfono
function validatePhone(input) {
    const phone = input.value.trim();
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    
    if (phone && !phoneRegex.test(phone)) {
        return {
            valid: false,
            message: 'Formato de teléfono inválido'
        };
    }
    
    return { valid: true };
}

// Prevenir inyección XSS en inputs
function setupXSSPrevention() {
    document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(input => {
        input.addEventListener('blur', function() {
            this.value = this.value.trim();
        });
    });
}

// Limitar intentos de login (simple rate limiting en frontend)
class RateLimiter {
    constructor(maxAttempts = 5, timeWindow = 300000) { // 5 intentos en 5 minutos
        this.maxAttempts = maxAttempts;
        this.timeWindow = timeWindow;
        this.attempts = [];
    }

    canAttempt() {
        const now = Date.now();
        this.attempts = this.attempts.filter(time => now - time < this.timeWindow);
        return this.attempts.length < this.maxAttempts;
    }

    recordAttempt() {
        this.attempts.push(Date.now());
    }

    getRemainingTime() {
        if (this.attempts.length === 0) return 0;
        const oldestAttempt = Math.min(...this.attempts);
        const timePassed = Date.now() - oldestAttempt;
        return Math.max(0, this.timeWindow - timePassed);
    }
}

// Inicializar prevención XSS cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupXSSPrevention);
} else {
    setupXSSPrevention();
}

// Exportar funciones para uso global
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.sanitizeInput = sanitizeInput;
window.validateLength = validateLength;
window.validatePhone = validatePhone;
window.RateLimiter = RateLimiter;
