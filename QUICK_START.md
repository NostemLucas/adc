# Guía de Inicio Rápido

Esta guía te ayudará a poner en marcha el sistema en menos de 5 minutos.

## Paso 1: Instalación

```bash
# Instalar dependencias
npm install
```

## Paso 2: Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb audit_db

# O usando psql
psql -U postgres
CREATE DATABASE audit_db;
\q
```

## Paso 3: Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
# Los valores por defecto ya funcionan para desarrollo local
```

**Contenido mínimo del .env:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=audit_db

JWT_SECRET=mi-super-secreto-jwt-2024
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=mi-super-secreto-refresh-2024
JWT_REFRESH_EXPIRATION=7d

PORT=3000
NODE_ENV=development
```

## Paso 4: Iniciar Aplicación

```bash
# Modo desarrollo (con hot-reload)
npm run start:dev
```

Deberías ver:
```
Application is running on: http://localhost:3000
```

## Paso 5: Crear Datos Iniciales (Opcional)

Opción A: Ejecutar el seed (cuando esté implementado)
```bash
npm run seed
```

Opción B: Crear manualmente usando SQL o Postman

### Crear Usuario Interno (Admin) - SQL

```sql
-- 1. Crear el usuario base
INSERT INTO "User" (
  id, names, "lastNames", email, username, password, ci,
  type, status, "failedLoginAttempts", "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'Administrador',
  'Sistema',
  'admin@audit.com',
  'admin',
  '$2b$10$YourHashedPasswordHere', -- Usa bcrypt para hashear 'Admin123!'
  '12345678',
  'INTERNAL',  -- Tipo de usuario
  'ACTIVE',
  0,
  NOW(),
  NOW()
) RETURNING id;

-- 2. Crear el perfil interno con roles
INSERT INTO "InternalProfile" (
  id, "userId", roles, "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  ARRAY['ADMINISTRADOR']::text[],  -- Roles como array
  NOW(),
  NOW()
FROM "User" u
WHERE u.email = 'admin@audit.com';
```

### Crear Usuario Externo (Cliente) - SQL

```sql
-- 1. Primero necesitas una organización
INSERT INTO "Organization" (
  id, name, email, phone, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'Empresa Demo',
  'contacto@empresademo.com',
  '72345678',
  NOW(),
  NOW()
) RETURNING id;

-- 2. Crear el usuario externo
INSERT INTO "User" (
  id, names, "lastNames", email, username, password, ci,
  type, status, "failedLoginAttempts", "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'Cliente',
  'Demo',
  'cliente@empresademo.com',
  'clientedemo',
  '$2b$10$YourHashedPasswordHere',
  '87654321',
  'EXTERNAL',  -- Tipo externo
  'ACTIVE',
  0,
  NOW(),
  NOW()
) RETURNING id;

-- 3. Crear el perfil externo
INSERT INTO "ExternalProfile" (
  id, "userId", "organizationId", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  o.id,
  NOW(),
  NOW()
FROM "User" u, "Organization" o
WHERE u.email = 'cliente@empresademo.com'
  AND o.name = 'Empresa Demo';
```

## Paso 6: Probar la API

### Test de Health (sin autenticación)

Si creas un endpoint público de health:

```bash
curl http://localhost:3000
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@audit.com",
    "password": "Admin123!"
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@audit.com",
    "fullName": "Administrador Sistema",
    "type": "INTERNAL",
    "status": "ACTIVE"
  },
  "profile": {
    "roles": ["ADMINISTRADOR"]
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Obtener Perfil

```bash
# Reemplaza <TOKEN> con el accessToken recibido
curl -X POST http://localhost:3000/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Troubleshooting

### Error: "password authentication failed"

Verifica tus credenciales de PostgreSQL en el archivo `.env`:
- DB_USERNAME
- DB_PASSWORD

### Error: "database does not exist"

Crea la base de datos:
```bash
createdb audit_db
```

### Error: "Cannot find module '@shared'"

Reinicia el servidor de desarrollo:
```bash
# Ctrl+C para detener
npm run start:dev
```

### Error: "jwt must be provided"

Asegúrate de incluir el header Authorization:
```
Authorization: Bearer tu-token-aqui
```

### Puerto 3000 ya en uso

Cambia el puerto en `.env`:
```env
PORT=3001
```

## Próximos Pasos

1. ✅ Lee la documentación completa en `README.md`
2. ✅ Revisa los ejemplos de API en `API_EXAMPLES.md`
3. ✅ Consulta el resumen de implementación en `IMPLEMENTATION_SUMMARY.md`
4. ✅ Implementa los endpoints de tu aplicación
5. ✅ Protege tus rutas con `@Roles()` y `@Public()`

## Scripts Útiles

```bash
# Desarrollo con hot-reload
npm run start:dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm run start:prod

# Formatear código
npm run format

# Linting
npm run lint

# Tests (cuando los implementes)
npm run test
```

## Estructura del Proyecto

```
audit2/
├── src/
│   ├── core/           # Módulos del núcleo (auth, users, roles, etc.)
│   ├── app/            # Módulos de la aplicación
│   ├── shared/         # Código compartido
│   ├── database/       # Migraciones y seeds
│   ├── app.module.ts   # Módulo principal
│   └── main.ts         # Punto de entrada
├── .env                # Variables de entorno
├── README.md           # Documentación principal
└── package.json        # Dependencias
```

## Credenciales por Defecto

Después de ejecutar el seed o crear usuarios manualmente:

**Usuarios Internos (Staff):**

- **Administrador**
  - Email: `admin@audit.com`
  - Password: `Admin123!`
  - Tipo: INTERNAL
  - Roles: ADMINISTRADOR

- **Gerente**
  - Email: `maria.garcia@audit.com`
  - Password: `Gerente123!`
  - Tipo: INTERNAL
  - Roles: GERENTE

- **Auditor**
  - Email: `juan.perez@audit.com`
  - Password: `Auditor123!`
  - Tipo: INTERNAL
  - Roles: AUDITOR

**Usuarios Externos (Clientes):**

- **Cliente Demo**
  - Email: `cliente@empresademo.com`
  - Password: `Cliente123!`
  - Tipo: EXTERNAL
  - Organización: Empresa Demo

## Soporte

Si encuentras problemas, revisa:
1. `README.md` - Documentación completa
2. `API_EXAMPLES.md` - Ejemplos de uso
3. `IMPLEMENTATION_SUMMARY.md` - Detalles de implementación

---

¡Listo! 🚀 Tu sistema de autenticación está configurado y funcionando.
