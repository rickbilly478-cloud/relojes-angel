# Relojes Angel

Aplicación web de tienda de relojes con login, sesiones y base de datos SQLite. Incluye validaciones frontend, usuario por defecto (solo en memoria) y usuarios registrados persistidos en la DB.

## Requisitos
- Node.js 18+ (usamos Node 20 en Docker)
- Docker (opcional para despliegue)

## Ejecutar en local
```bash
npm install
npm run start
# http://localhost:3000
```

## Usuario por defecto
- Email: admin@relojesangel.com
- Password: password123

## Docker
Construir y ejecutar con Docker Compose:
```bash
docker compose up --build -d
# http://localhost:3000
```

Publicar en Docker Hub:
```bash
docker build -t <tu_usuario>/relojes-angel:latest .
docker login
docker push <tu_usuario>/relojes-angel:latest
```

## SAST (SonarQube)
- Instala SonarQube local o usa SonarCloud.
- Analiza el proyecto con SonarQube para detectar vulnerabilidades y code smells.
- Exporta el reporte a PDF (SonarQube Web + impresión a PDF).

## DAST (OWASP ZAP)
- Ejecuta la app (`npm start` o `docker compose up`).
- En OWASP ZAP, realiza un escaneo activo contra `http://localhost:3000`.
- Revisa y exporta los hallazgos (HTML/PDF).

## Seguridad de contenedor (Trivy)
Escanea la imagen con Trivy:
```bash
brew install trivy # macOS
trivy image <tu_usuario>/relojes-angel:latest
```

## Variables de entorno
- `SESSION_SECRET`: secreto de sesión para `express-session`.

## Estructura
- `server.js`: servidor Express, rutas API y páginas.
- `database/init.js`: creación de DB y datos de ejemplo.
- `public/`: frontend (HTML/CSS/JS).
- `Dockerfile`, `docker-compose.yml`: despliegue con Docker.

## Notas
- El usuario por defecto no se guarda en la DB; el carrito para este usuario se maneja en sesión.
- Usuarios registrados se almacenan en SQLite con contraseñas `bcrypt`.
