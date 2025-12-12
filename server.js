const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// Importar base de datos
const db = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Usuario por defecto (no vinculado a la base de datos)
// Cumple con la política: mayúsculas, minúsculas y números
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Password123';
const DEFAULT_USER = {
    id: 'default-001',
    email: 'admin@relojesangel.com',
    password: bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10),
    nombre: 'Administrador',
    isDefault: true
};

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: true,
    credentials: true
}));

// Parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sesiones
// En Docker local usamos cookies no seguras (HTTP) para evitar cierre de sesión
// En producción con HTTPS, establecer SESSION_SECURE=true y configurar proxy
const SESSION_SECURE = (process.env.SESSION_SECURE || 'false') === 'true';
if (SESSION_SECURE) {
    app.set('trust proxy', 1);
}
app.use(session({
    secret: process.env.SESSION_SECRET || 'relojes-angel-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: SESSION_SECURE,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado. Por favor inicie sesión.' });
    }
};

// ============== RUTAS DE AUTENTICACIÓN ==============

// Registro de nuevo usuario
app.post('/api/auth/register', [
    body('email').isEmail().normalizeEmail().withMessage('Ingrese un correo electrónico válido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres'),
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('telefono').optional().trim()
], async (req, res) => {
    try {
        // Validar campos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, nombre, telefono } = req.body;

        // Verificar si el email ya existe en la base de datos
        const existingUser = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
        }

        // Verificar si intenta usar el email del usuario por defecto
        if (email.toLowerCase() === DEFAULT_USER.email.toLowerCase()) {
            return res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario en la base de datos
        const stmt = db.prepare(`
            INSERT INTO usuarios (email, password, nombre, telefono, fecha_registro)
            VALUES (?, ?, ?, ?, datetime('now'))
        `);
        
        const result = stmt.run(email, hashedPassword, nombre, telefono || null);

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            userId: result.lastInsertRowid 
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Login
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail().withMessage('Ingrese un correo electrónico válido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        let user = null;
        let isDefaultUser = false;

        // Primero verificar si es el usuario por defecto
        if (email.toLowerCase() === DEFAULT_USER.email.toLowerCase()) {
            const passwordMatch = await bcrypt.compare(password, DEFAULT_USER.password);
            if (passwordMatch) {
                user = DEFAULT_USER;
                isDefaultUser = true;
            }
        }

        // Si no es el usuario por defecto, buscar en la base de datos
        if (!user) {
            const dbUser = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
            if (dbUser) {
                const passwordMatch = await bcrypt.compare(password, dbUser.password);
                if (passwordMatch) {
                    user = dbUser;
                }
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Crear sesión
        req.session.user = {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            isDefault: isDefaultUser
        };

        res.json({ 
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Sesión cerrada exitosamente' });
    });
});

// Verificar sesión
app.get('/api/auth/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    } else {
        res.json({ authenticated: false });
    }
});

// ============== RUTAS DE PRODUCTOS ==============

// Obtener todos los relojes
app.get('/api/productos', (req, res) => {
    try {
        const productos = db.prepare('SELECT * FROM productos ORDER BY destacado DESC, id DESC').all();
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Obtener un reloj específico
app.get('/api/productos/:id', (req, res) => {
    try {
        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// ============== RUTAS DE CARRITO (requiere autenticación) ==============

// Obtener carrito del usuario
app.get('/api/carrito', requireAuth, (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Si es usuario por defecto, usar carrito en sesión
        if (req.session.user.isDefault) {
            const carrito = req.session.carrito || [];
            return res.json(carrito);
        }

        const items = db.prepare(`
            SELECT c.*, p.nombre, p.precio, p.imagen, p.marca
            FROM carrito c
            JOIN productos p ON c.producto_id = p.id
            WHERE c.usuario_id = ?
        `).all(userId);
        
        res.json(items);
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({ error: 'Error al obtener carrito' });
    }
});

// Agregar al carrito
app.post('/api/carrito', requireAuth, (req, res) => {
    try {
        const { productoId, cantidad = 1 } = req.body;
        const userId = req.session.user.id;

        // Verificar que el producto existe
        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(productoId);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Si es usuario por defecto, usar carrito en sesión
        if (req.session.user.isDefault) {
            if (!req.session.carrito) {
                req.session.carrito = [];
            }
            
            const existingIndex = req.session.carrito.findIndex(item => item.producto_id === productoId);
            if (existingIndex >= 0) {
                req.session.carrito[existingIndex].cantidad += cantidad;
            } else {
                req.session.carrito.push({
                    producto_id: productoId,
                    cantidad,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    imagen: producto.imagen,
                    marca: producto.marca
                });
            }
            return res.json({ message: 'Producto agregado al carrito' });
        }

        // Para usuarios registrados, usar base de datos
        const existingItem = db.prepare('SELECT * FROM carrito WHERE usuario_id = ? AND producto_id = ?').get(userId, productoId);
        
        if (existingItem) {
            db.prepare('UPDATE carrito SET cantidad = cantidad + ? WHERE id = ?').run(cantidad, existingItem.id);
        } else {
            db.prepare('INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)').run(userId, productoId, cantidad);
        }

        res.json({ message: 'Producto agregado al carrito' });
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ error: 'Error al agregar al carrito' });
    }
});

// Eliminar del carrito
app.delete('/api/carrito/:productoId', requireAuth, (req, res) => {
    try {
        const productoId = parseInt(req.params.productoId);
        const userId = req.session.user.id;

        if (req.session.user.isDefault) {
            if (req.session.carrito) {
                req.session.carrito = req.session.carrito.filter(item => item.producto_id !== productoId);
            }
            return res.json({ message: 'Producto eliminado del carrito' });
        }

        db.prepare('DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?').run(userId, productoId);
        res.json({ message: 'Producto eliminado del carrito' });
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        res.status(500).json({ error: 'Error al eliminar del carrito' });
    }
});

// ============== RUTAS DE PÁGINAS ==============

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Página de registro
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Dashboard (requiere autenticación)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Catálogo
app.get('/catalogo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'catalogo.html'));
});

// Carrito
app.get('/carrito', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'carrito.html'));
});

// ============== MANEJO DE ERRORES ==============

// 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Error general
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🕐 Relojes Angel - Servidor iniciado                   ║
║                                                          ║
║   📍 URL: http://localhost:${PORT}                         ║
║                                                          ║
║   👤 Usuario por defecto:                                ║
║      Email: admin@relojesangel.com                       ║
║      Password: ${DEFAULT_ADMIN_PASSWORD}                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
