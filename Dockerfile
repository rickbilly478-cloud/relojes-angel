# Relojes Angel - Dockerfile
FROM node:20-alpine

# Crear app dir
WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm install --production && npm cache clean --force

# Copiar código
COPY . .

# Crear directorio de datos para SQLite
RUN mkdir -p /app/data && chown -R node:node /app

# Usar usuario no root
USER node

# Exponer puerto
EXPOSE 3000

# Variables por defecto
ENV NODE_ENV=production \
    SESSION_SECRET=change-me

# Comando
CMD ["node","server.js"]
