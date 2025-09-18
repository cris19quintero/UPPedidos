# ===== Dockerfile para UTPedidos Backend - Railway CORREGIDO =====
FROM node:18-alpine

# Metadatos
LABEL maintainer="UTP Development Team"
LABEL version="1.0.0"
LABEL description="UTPedidos Backend API"

# Variables de entorno - SIN PORT FIJO
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S utpedidos -u 1001 -G nodejs

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache dumb-init

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p public/uploads logs && \
    chown -R utpedidos:nodejs /app && \
    chmod -R 755 /app

# Cambiar a usuario no-root
USER utpedidos

# NO exponer puerto fijo - Railway lo asigna dinámicamente
# EXPOSE $PORT

# Health check usando variable de entorno PORT
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "const http=require('http');const port=process.env.PORT||3001;http.get(\`http://localhost:\${port}/health\`,(r)=>{r.statusCode===200?process.exit(0):process.exit(1)}).on('error',()=>process.exit(1))"

# Comando de inicio con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]