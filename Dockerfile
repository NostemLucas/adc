# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- Dependencies Stage ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ---- Build Stage ----
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build de la aplicación
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app

# Instalar solo dependencias de producción necesarias
RUN apk add --no-cache dumb-init

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar dependencias
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar prisma schema y generar cliente
COPY --chown=nestjs:nodejs prisma ./prisma
RUN npx prisma generate

# Copiar código compilado
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Crear directorio para logs
RUN mkdir -p logs && chown nestjs:nodejs logs

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "dist/main.js"]
