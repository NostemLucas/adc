# Docker Setup - Sistema de Auditorías

Esta guía explica cómo usar Docker para ejecutar la aplicación y la base de datos.

## 📋 Requisitos Previos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)

**Verificar instalación:**
```bash
docker --version
docker compose version
```

## 🚀 Opciones de Deployment

### Opción 1: Solo Base de Datos (Recomendado para Desarrollo)

Esta opción ejecuta PostgreSQL en Docker mientras desarrollas la aplicación localmente.

**Iniciar la base de datos:**
```bash
docker compose up -d
```

**Servicios disponibles:**
- **PostgreSQL**: `localhost:5432`
  - Usuario: `postgres`
  - Password: `postgres`
  - Database: `audit_db`

- **pgAdmin**: `http://localhost:5050`
  - Email: `admin@audit.com`
  - Password: `admin123`

**Ejecutar migraciones de Prisma:**
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Ver base de datos en navegador
npx prisma studio
```

**Iniciar la aplicación (localmente):**
```bash
npm run start:dev
```

### Opción 2: Stack Completo (Aplicación + Base de Datos)

Esta opción ejecuta todo en Docker containers.

**Iniciar todo el stack:**
```bash
docker compose -f docker-compose.full.yml up -d --build
```

**Servicios disponibles:**
- **API**: `http://localhost:3000`
- **Swagger Docs**: `http://localhost:3000/api/docs`
- **PostgreSQL**: `localhost:5432`
- **pgAdmin**: `http://localhost:5050`

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Ver contenedores en ejecución
docker compose ps

# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f postgres
docker compose logs -f app

# Detener servicios
docker compose stop

# Detener y eliminar contenedores
docker compose down

# Detener y eliminar todo (incluye volúmenes)
docker compose down -v
```

### Gestión de Base de Datos

```bash
# Conectar a PostgreSQL desde CLI
docker compose exec postgres psql -U postgres -d audit_db

# Backup de la base de datos
docker compose exec postgres pg_dump -U postgres audit_db > backup.sql

# Restaurar backup
docker compose exec -T postgres psql -U postgres audit_db < backup.sql

# Ver tablas de la base de datos
docker compose exec postgres psql -U postgres -d audit_db -c "\dt"
```

### Gestión de la Aplicación

```bash
# Reconstruir imagen de la aplicación
docker compose -f docker-compose.full.yml build app

# Reiniciar solo la aplicación
docker compose -f docker-compose.full.yml restart app

# Ver logs de la aplicación
docker compose -f docker-compose.full.yml logs -f app

# Ejecutar comandos dentro del contenedor
docker compose exec app sh

# Ejecutar migraciones en producción
docker compose exec app npx prisma migrate deploy
```

## 📦 Estructura de Archivos Docker

```
audit2/
├── docker-compose.yml           # Solo PostgreSQL + pgAdmin
├── docker-compose.full.yml      # Stack completo (App + DB)
├── Dockerfile                   # Imagen de la aplicación NestJS
├── .dockerignore               # Archivos a ignorar en build
└── docker/
    └── init/
        └── 01-init.sql         # Script de inicialización de DB
```

## 🔧 Configuración Personalizada

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/audit_db?schema=public"

# JWT
JWT_SECRET=your-custom-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-custom-refresh-secret-key
JWT_REFRESH_EXPIRATION=7d

# Application
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

**Para producción**, asegúrate de cambiar:
- ✅ Contraseñas de PostgreSQL
- ✅ Secrets de JWT
- ✅ NODE_ENV a `production`

### Cambiar Puertos

Si necesitas cambiar los puertos por defecto, edita `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Cambiar puerto local

  pgadmin:
    ports:
      - "8080:80"    # Cambiar puerto de pgAdmin
```

### Aumentar Memoria de PostgreSQL

Para mejorar el performance, edita `docker-compose.yml`:

```yaml
services:
  postgres:
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "max_connections=200"
```

## 🎯 Flujo de Trabajo Recomendado

### Desarrollo Local

```bash
# 1. Iniciar solo la base de datos
docker compose up -d postgres

# 2. Ejecutar migraciones
npx prisma migrate dev

# 3. Seed de datos (opcional)
npx prisma db seed

# 4. Iniciar aplicación en modo desarrollo
npm run start:dev

# 5. Ver logs de la BD si es necesario
docker compose logs -f postgres
```

### Testing

```bash
# 1. Levantar base de datos de test
docker compose up -d postgres

# 2. Ejecutar tests
npm run test

# 3. Limpiar
docker compose down -v
```

### Producción

```bash
# 1. Construir imágenes
docker compose -f docker-compose.full.yml build

# 2. Levantar servicios
docker compose -f docker-compose.full.yml up -d

# 3. Ver logs
docker compose -f docker-compose.full.yml logs -f

# 4. Verificar health
docker compose -f docker-compose.full.yml ps
```

## 🔍 Acceso a pgAdmin

1. Abrir navegador en `http://localhost:5050`
2. Login con:
   - Email: `admin@audit.com`
   - Password: `admin123`

3. Agregar servidor PostgreSQL:
   - Click derecho en "Servers" → "Register" → "Server"
   - **General Tab:**
     - Name: `Audit DB`
   - **Connection Tab:**
     - Host: `postgres` (nombre del servicio en Docker)
     - Port: `5432`
     - Database: `audit_db`
     - Username: `postgres`
     - Password: `postgres`

## 🐛 Troubleshooting

### Puerto 5432 ya en uso

```bash
# Ver qué está usando el puerto
sudo lsof -i :5432

# Cambiar puerto en docker-compose.yml
ports:
  - "5433:5432"  # Usar puerto diferente

# Actualizar DATABASE_URL en .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/audit_db?schema=public"
```

### Contenedor no inicia

```bash
# Ver logs de error
docker compose logs postgres

# Eliminar volúmenes y reiniciar
docker compose down -v
docker compose up -d
```

### Error de conexión desde la app

```bash
# Verificar que el contenedor esté corriendo
docker compose ps

# Verificar conectividad
docker compose exec postgres pg_isready -U postgres

# Si usas Docker en WSL/Windows, usa host.docker.internal
DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/audit_db"
```

### Migraciones fallan

```bash
# Conectar a la BD y verificar estado
docker compose exec postgres psql -U postgres -d audit_db

# Limpiar base de datos
docker compose down -v
docker compose up -d
npx prisma migrate dev --name init
```

### Volúmenes llenos de datos antiguos

```bash
# Listar volúmenes
docker volume ls

# Eliminar volúmenes específicos
docker volume rm audit2_postgres_data
docker volume rm audit2_pgadmin_data

# Eliminar volúmenes no usados
docker volume prune
```

## 📊 Monitoreo

### Ver uso de recursos

```bash
# Estadísticas en tiempo real
docker stats

# Solo PostgreSQL
docker stats audit_postgres
```

### Logs estructurados

```bash
# Ver logs con formato JSON
docker compose logs --json postgres

# Filtrar por timestamp
docker compose logs --since 30m postgres
```

## 🔐 Seguridad en Producción

**Checklist antes de deployment:**

- [ ] Cambiar contraseña de PostgreSQL
- [ ] Cambiar secrets de JWT
- [ ] Cambiar credenciales de pgAdmin
- [ ] No exponer puerto de PostgreSQL (5432) públicamente
- [ ] Usar secrets de Docker Swarm o Kubernetes
- [ ] Configurar backup automático de base de datos
- [ ] Habilitar SSL/TLS en PostgreSQL
- [ ] Limitar conexiones de red con `networks`

**Ejemplo de configuración segura:**

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    # No exponer puerto públicamente
    # ports:
    #   - "5432:5432"

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## 📚 Recursos Adicionales

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres)
- [pgAdmin Docker Documentation](https://www.pgadmin.org/docs/pgadmin4/latest/container_deployment.html)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda)

## 🎉 Siguiente Paso

Una vez que tengas la base de datos corriendo:

```bash
# 1. Ejecutar migraciones
npx prisma migrate dev

# 2. Iniciar la aplicación
npm run start:dev

# 3. Ver Swagger docs
open http://localhost:3000/api/docs
```

---

**¿Necesitas ayuda?** Revisa la sección de Troubleshooting o los logs con `docker compose logs -f`
