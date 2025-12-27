# Sistema de Autenticación y Autorización - Audit2

Sistema completo de autenticación con JWT, refresh tokens, OTP, roles y bloqueo por intentos fallidos desarrollado con NestJS.

## Características Principales

### 1. Autenticación
- Login con username/email y contraseña
- **Bloqueo temporal (30 min) después de 3 intentos fallidos**
- JWT Access Token (15 minutos por defecto)
- JWT Refresh Token (7 días por defecto)
- Logout individual y global (todas las sesiones)

### 2. Sistema de Perfiles Separados

El sistema utiliza **perfiles separados** basados en el tipo de usuario:

#### Usuarios Internos (INTERNAL)
Usuarios del sistema (staff) con roles administrativos:
- **ADMINISTRADOR**: Acceso total al sistema
- **GERENTE**: Gestión de auditorías
- **AUDITOR**: Realización de auditorías
- Los roles son **acumulables** (un usuario puede tener múltiples roles)

#### Usuarios Externos (EXTERNAL)
Usuarios clientes de organizaciones:
- Asociados a una **organización específica**
- Acceso limitado a datos de su organización
- No tienen roles administrativos

**Arquitectura:**
- Cada `User` tiene un campo `type` (INTERNAL/EXTERNAL) **inmutable**
- `InternalProfile` contiene roles y datos administrativos
- `ExternalProfile` contiene organización y datos del cliente
- Separación física en base de datos para mayor seguridad

### 3. Sesiones
- Múltiples sesiones por usuario
- Tracking de IP y User-Agent
- Expiración automática
- Refresh token rotation

### 4. OTP (One-Time Password)
- Códigos de verificación temporales
- Tipos: email_verification, password_reset, two_factor_auth, login_verification
- Expiración configurable (10 min por defecto)
- Límite de 5 intentos por código

## Instalación

### Opción 1: Con Docker (Recomendado) 🐳

**Requisitos:**
- Docker y Docker Compose instalados

**Inicio rápido:**
```bash
# 1. Iniciar base de datos
./docker.sh db:start

# 2. Instalar dependencias
npm install

# 3. Ejecutar migraciones
npx prisma migrate dev

# 4. Iniciar aplicación
npm run start:dev
```

**O levantar todo el stack:**
```bash
# Iniciar app + base de datos + pgAdmin
./docker.sh up

# Ver documentación completa
cat DOCKER_SETUP.md
```

### Opción 2: Instalación Manual

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Configurar PostgreSQL:**
```bash
# Crear base de datos
createdb audit_db
```

4. **Ejecutar migraciones:**
```bash
npx prisma migrate dev
```

5. **Ejecutar la aplicación:**
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 🐳 Docker Commands

```bash
# Base de datos
./docker.sh db:start      # Iniciar PostgreSQL + pgAdmin
./docker.sh db:stop       # Detener
./docker.sh db:logs       # Ver logs
./docker.sh db:shell      # Conectar a psql
./docker.sh db:backup     # Crear backup

# Stack completo
./docker.sh up            # Iniciar todo
./docker.sh down          # Detener todo
./docker.sh logs          # Ver logs
./docker.sh status        # Estado de servicios

# Desarrollo
./docker.sh dev           # Modo desarrollo

# Ver todos los comandos
./docker.sh help
```

## Endpoints de Autenticación

### POST /auth/login
Login de usuario con bloqueo por intentos.

**Request:**
```json
{
  "username": "usuario@example.com",
  "password": "miPassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "username": "usuario",
    "email": "usuario@example.com",
    "fullName": "Nombre Completo",
    "type": "INTERNAL",
    "status": "ACTIVE"
  },
  "profile": {
    "roles": ["ADMINISTRADOR", "AUDITOR"]
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Errores:**
- `401`: Credenciales inválidas. Intentos restantes: 2
- `401`: Cuenta bloqueada por 30 minutos debido a múltiples intentos fallidos
- `401`: Cuenta inactiva. Contacta al administrador

### POST /auth/refresh
Obtener nuevos tokens usando el refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### POST /auth/logout
Cerrar sesión actual.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### POST /auth/logout-all
Cerrar todas las sesiones del usuario.

**Headers:**
```
Authorization: Bearer <accessToken>
```

### POST /auth/me
Obtener información del usuario autenticado.

**Headers:**
```
Authorization: Bearer <accessToken>
```

## Uso de Guards y Decorators

### Rutas protegidas con autenticación

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './core/auth/decorators/current-user.decorator';
import { User } from './core/users/domain/user';

@Controller('protected')
export class ProtectedController {
  @Get('data')
  getData(@CurrentUser() user: User) {
    return {
      message: 'Datos protegidos',
      user: user.fullName,
      type: user.type
    };
  }
}
```

### Rutas públicas (sin autenticación)

```typescript
import { Public } from './core/auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Public()
  @Get('info')
  getInfo() {
    return { message: 'Ruta pública' };
  }
}
```

### Proteger por roles

```typescript
import { Roles } from './core/auth/decorators/roles.decorator';
import { Role } from './core/auth/domain/authorization';

@Controller('admin')
export class AdminController {
  @Roles(Role.ADMINISTRADOR)
  @Get('dashboard')
  getDashboard() {
    return { message: 'Dashboard de administrador' };
  }

  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @Get('reports')
  getReports() {
    return { message: 'Accesible para admin o gerente' };
  }
}
```

## Creación de Usuarios

### ✅ Crear Usuario Interno (Staff)
```typescript
import { CreateUserCommand } from './core/users/application/internal-profile';
import { UserType } from './core/users/domain';

const command = new CreateUserCommand({
  names: 'Juan',
  lastNames: 'Pérez',
  email: 'juan@example.com',
  username: 'juanp',
  password: 'SecurePass123',
  ci: '12345678',
  type: UserType.INTERNAL,
  roles: [Role.ADMINISTRADOR, Role.AUDITOR] // Múltiples roles OK
});

await this.commandBus.execute(command);
```

### ✅ Crear Usuario Externo (Cliente)
```typescript
const command = new CreateExternalUserCommand({
  names: 'María',
  lastNames: 'González',
  email: 'maria@clienteorg.com',
  username: 'mariag',
  password: 'SecurePass123',
  ci: '87654321',
  type: UserType.EXTERNAL,
  organizationId: 'org-uuid' // Asociado a organización
});

await this.commandBus.execute(command);
```

### ❌ Cambiar tipo de usuario (INMUTABLE)
```typescript
// El campo 'type' NO puede modificarse después de la creación
user.type = UserType.EXTERNAL;
// Error: "El tipo de usuario es inmutable y no puede ser modificado"
```

## Bloqueo por Intentos Fallidos

- **Máximo de intentos**: 3
- **Tiempo de bloqueo**: 30 minutos
- **Reset automático**: Login exitoso o cambio de contraseña

El sistema informa al usuario cuántos intentos le quedan y cuánto tiempo debe esperar si está bloqueado.

## Variables de Entorno

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=audit_db

JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d

PORT=3000
NODE_ENV=development
```

## Arquitectura

### Estructura del Proyecto
```
src/
├── core/
│   ├── auth/                      # Sistema de autenticación
│   │   └── domain/authorization/  # Roles, permisos y menús
│   ├── users/                     # Gestión de usuarios (DDD)
│   │   ├── domain/
│   │   │   ├── user/             # Agregado User
│   │   │   ├── internal-profile/ # Agregado InternalProfile
│   │   │   ├── external-profile/ # Agregado ExternalProfile
│   │   │   └── shared/           # Value Objects, Services
│   │   ├── application/          # Use Cases (CQRS)
│   │   └── infrastructure/       # Repositorios
│   ├── organizations/             # Gestión de organizaciones
│   ├── sessions/                  # Manejo de sesiones
│   ├── notifications/             # Sistema de notificaciones
│   └── otp/                       # Códigos de verificación
├── shared/                        # Código compartido
│   ├── domain/                    # Base classes DDD
│   ├── validators/                # Validadores custom
│   ├── file-upload/               # Sistema de archivos
│   ├── email/                     # Sistema de emails
│   └── logger/                    # Sistema de logging
└── app.module.ts
```

### Patrones Implementados
- **DDD (Domain-Driven Design)**: Agregados User, InternalProfile, ExternalProfile
- **CQRS**: Separación de Commands y Queries
- **Event Sourcing**: Eventos de dominio para auditoría
- **Repository Pattern**: Abstracción de persistencia
- **Value Objects**: Email, CI, Phone, etc.

## Seguridad

- Contraseñas hasheadas con bcrypt
- Refresh token rotation
- Sesiones con expiración
- Guards globales
- Validación de entrada
- Protección contra fuerza bruta

## Licencia

UNLICENSED
