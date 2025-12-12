const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Crear directorio de datos si no existe
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Crear conexión a la base de datos
const dbPath = path.join(dataDir, 'relojes_angel.db');
const db = new Database(dbPath);

// Habilitar claves foráneas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Crear tablas
db.exec(`
    -- Tabla de usuarios
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        telefono TEXT,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        activo INTEGER DEFAULT 1
    );

    -- Tabla de productos (relojes)
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio REAL NOT NULL,
        precio_anterior REAL,
        marca TEXT NOT NULL,
        categoria TEXT DEFAULT 'clasico',
        imagen TEXT,
        stock INTEGER DEFAULT 10,
        destacado INTEGER DEFAULT 0,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de carrito
    CREATE TABLE IF NOT EXISTS carrito (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER DEFAULT 1,
        fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
    );

    -- Tabla de pedidos
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        total REAL NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        direccion_envio TEXT,
        fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Tabla de detalles de pedido
    CREATE TABLE IF NOT EXISTS pedido_detalles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
    );
`);

// Insertar productos de ejemplo si no existen
const productCount = db.prepare('SELECT COUNT(*) as count FROM productos').get();

if (productCount.count === 0) {
    const insertProduct = db.prepare(`
        INSERT INTO productos (nombre, descripcion, precio, precio_anterior, marca, categoria, imagen, stock, destacado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const productos = [
        {
            nombre: 'Celestial Chronograph',
            descripcion: 'Reloj cronógrafo de lujo con movimiento automático suizo. Caja de acero inoxidable de 42mm con cristal de zafiro anti-reflejante. Resistente al agua hasta 100m.',
            precio: 2499.99,
            precio_anterior: 2999.99,
            marca: 'Angel Swiss',
            categoria: 'lujo',
            imagen: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            stock: 5,
            destacado: 1
        },
        {
            nombre: 'Midnight Classic',
            descripcion: 'Elegante reloj clásico con esfera negra y detalles dorados. Correa de cuero genuino italiano. Movimiento de cuarzo japonés de alta precisión.',
            precio: 899.99,
            precio_anterior: null,
            marca: 'Angel Collection',
            categoria: 'clasico',
            imagen: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500',
            stock: 15,
            destacado: 1
        },
        {
            nombre: 'Sport Pro X',
            descripcion: 'Reloj deportivo resistente con funciones de cronómetro, alarma y luz LED. Resistente al agua hasta 200m. Ideal para deportes acuáticos.',
            precio: 349.99,
            precio_anterior: 449.99,
            marca: 'Angel Sport',
            categoria: 'deportivo',
            imagen: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500',
            stock: 25,
            destacado: 1
        },
        {
            nombre: 'Vintage Rose Gold',
            descripcion: 'Reloj vintage con acabado en oro rosa. Diseño minimalista con números romanos. Correa de malla milanesa.',
            precio: 599.99,
            precio_anterior: null,
            marca: 'Angel Vintage',
            categoria: 'clasico',
            imagen: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=500',
            stock: 10,
            destacado: 0
        },
        {
            nombre: 'Digital Smartwatch Elite',
            descripcion: 'Smartwatch de última generación con monitor de ritmo cardíaco, GPS integrado y notificaciones inteligentes. Batería de 7 días.',
            precio: 799.99,
            precio_anterior: 999.99,
            marca: 'Angel Tech',
            categoria: 'smart',
            imagen: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500',
            stock: 20,
            destacado: 1
        },
        {
            nombre: 'Ocean Diver 300',
            descripcion: 'Reloj de buceo profesional resistente hasta 300m. Bisel giratorio unidireccional, válvula de helio y Super-LumiNova.',
            precio: 1299.99,
            precio_anterior: null,
            marca: 'Angel Marine',
            categoria: 'deportivo',
            imagen: 'https://images.unsplash.com/photo-1548171915-e79a380a2a4b?w=500',
            stock: 8,
            destacado: 0
        },
        {
            nombre: 'Executive Titanium',
            descripcion: 'Reloj ejecutivo de titanio ultraligero. Movimiento automático con reserva de marcha de 72 horas. Cristal de zafiro.',
            precio: 1899.99,
            precio_anterior: 2199.99,
            marca: 'Angel Premium',
            categoria: 'lujo',
            imagen: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=500',
            stock: 6,
            destacado: 0
        },
        {
            nombre: 'Minimalist White',
            descripcion: 'Diseño minimalista escandinavo con esfera blanca pura. Correa intercambiable de cuero o NATO. Perfecto para cualquier ocasión.',
            precio: 299.99,
            precio_anterior: null,
            marca: 'Angel Basic',
            categoria: 'clasico',
            imagen: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500',
            stock: 30,
            destacado: 0
        },
        {
            nombre: 'Pilot Aviation',
            descripcion: 'Reloj de aviador con regla de cálculo deslizante. Esfera grande de 44mm con alta legibilidad. Inspirado en la aviación clásica.',
            precio: 749.99,
            precio_anterior: null,
            marca: 'Angel Aviation',
            categoria: 'clasico',
            imagen: 'https://images.unsplash.com/photo-1587925358603-c2eea5305bbc?w=500',
            stock: 12,
            destacado: 0
        },
        {
            nombre: 'Fitness Tracker Pro',
            descripcion: 'Monitor de actividad física con seguimiento de sueño, calorías y más de 20 modos deportivos. Pantalla AMOLED brillante.',
            precio: 199.99,
            precio_anterior: 249.99,
            marca: 'Angel Fit',
            categoria: 'smart',
            imagen: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500',
            stock: 40,
            destacado: 0
        },
        {
            nombre: 'Skeleton Automatic',
            descripcion: 'Reloj esqueleto que muestra el intrincado movimiento mecánico. Acabado en negro mate con detalles azules. Una obra de arte en tu muñeca.',
            precio: 1599.99,
            precio_anterior: null,
            marca: 'Angel Artisan',
            categoria: 'lujo',
            imagen: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=500',
            stock: 4,
            destacado: 1
        },
        {
            nombre: 'Classic Leather Brown',
            descripcion: 'Reloj clásico atemporal con correa de cuero marrón envejecido. Esfera crema con índices dorados. Elegancia tradicional.',
            precio: 449.99,
            precio_anterior: null,
            marca: 'Angel Heritage',
            categoria: 'clasico',
            imagen: 'https://images.unsplash.com/photo-1526045431048-f857369baa09?w=500',
            stock: 18,
            destacado: 0
        }
    ];

    const insertMany = db.transaction((items) => {
        for (const item of items) {
            insertProduct.run(
                item.nombre,
                item.descripcion,
                item.precio,
                item.precio_anterior,
                item.marca,
                item.categoria,
                item.imagen,
                item.stock,
                item.destacado
            );
        }
    });

    insertMany(productos);
    console.log('✅ Productos de ejemplo insertados en la base de datos');
}

console.log('✅ Base de datos inicializada correctamente');

module.exports = db;
