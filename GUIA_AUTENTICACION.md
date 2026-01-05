# Guía de Autenticación y Autorización

## Resumen del Sistema

Este sistema maneja **dos tipos de usuarios**:

1. **Usuarios Internos** - Personal del sistema (Administradores, Gerentes, Auditores)
2. **Usuarios Externos** - Clientes de organizaciones

## Flujo de Login

### 1. Usuario Interno (con roles)

```http
POST /api/auth/login
{
  "username": "admin@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "user": {
    "id": "user-uuid",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Juan Administrador",
    "roles": ["administrador", "gerente"],
    "currentRole": "administrador"
  },
  "tokens": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "menus": [...],
  "permissions": [
    "users:create",
    "users:read",
    "audits:approve",
    ...
  ]
}
```

**JWT Payload (Usuario Interno):**
```json
{
  "sub": "user-uuid",
  "username": "admin",
  "email": "admin@example.com",
  "profileId": "internal-profile-uuid",
  "roles": ["administrador", "gerente"],
  "currentRole": "administrador",
  "sessionId": "session-uuid"
}
```

### 2. Usuario Externo (Cliente)

```http
POST /api/auth/login
{
  "username": "cliente@empresa.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "user": {
    "id": "user-uuid",
    "username": "cliente",
    "email": "cliente@empresa.com",
    "fullName": "María Cliente",
    "organizationId": "org-uuid-123"
  },
  "tokens": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "menus": [...],
  "permissions": [
    "audits:read",
    "findings:read",
    "reports:read",
    "notifications:read"
  ]
}
```

**JWT Payload (Usuario Externo/Cliente):**
```json
{
  "sub": "user-uuid",
  "username": "cliente",
  "email": "cliente@empresa.com",
  "profileId": "external-profile-uuid",
  "organizationId": "org-uuid-123",
  "sessionId": "session-uuid"
}
```

## Diferencias Clave entre Tipos de Usuario

| Característica | Usuario Interno | Usuario Externo/Cliente |
|----------------|----------------|------------------------|
| **Campo en JWT** | `roles` + `currentRole` | `organizationId` |
| **Permisos** | Según rol (Admin, Gerente, Auditor) | Solo lectura (CLIENTE) |
| **Acceso** | Gestión completa del sistema | Solo sus datos de organización |
| **Endpoints** | `/api/internal-users` | `/api/external-profiles` |

## Roles y Permisos

### Roles del Sistema

```typescript
enum Role {
  ADMINISTRADOR = 'administrador',
  GERENTE = 'gerente',
  AUDITOR = 'auditor',
  CLIENTE = 'cliente',
}
```

### Permisos por Rol

#### ADMINISTRADOR
- ✅ **Full access** a todos los recursos
- Gestión de usuarios, roles, auditorías, hallazgos, reportes, clientes, configuración

#### GERENTE
- ✅ **Crear y aprobar** auditorías
- ✅ **Asignar** auditores
- ✅ **Ver y exportar** reportes
- ❌ No puede crear/eliminar usuarios

#### AUDITOR
- ✅ **Actualizar** auditorías asignadas
- ✅ **Crear y actualizar** hallazgos
- ✅ **Crear y ver** reportes
- ❌ No puede aprobar ni asignar auditorías

#### CLIENTE (Usuario Externo)
- ✅ **Solo lectura** de:
  - Sus propias auditorías
  - Hallazgos de sus auditorías
  - Sus reportes
  - Notificaciones
- ❌ **NO puede** crear, editar, eliminar ni aprobar nada

## Protección de Endpoints

### 1. Proteger por Rol Específico

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, RolesGuard, Roles, Role } from '@core/auth'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {

  // Solo ADMINISTRADOR puede acceder
  @Roles(Role.ADMINISTRADOR)
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    // ...
  }

  // ADMINISTRADOR o GERENTE pueden acceder
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @Get()
  async listUsers() {
    // ...
  }
}
```

### 2. Proteger Solo para Usuarios Internos

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, InternalOnlyGuard, InternalOnly } from '@core/auth'

@Controller('internal-users')
@UseGuards(JwtAuthGuard, InternalOnlyGuard)
export class InternalUsersController {

  // Solo usuarios INTERNOS (tienen roles)
  @InternalOnly()
  @Post()
  async createInternalUser(@Body() dto: CreateInternalUserDto) {
    // Los clientes recibirán 403 Forbidden
  }
}
```

### 3. Filtrar por Organización (Para Clientes)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, CurrentUser, OrganizationId } from '@core/auth'
import { JwtPayload } from '@core/auth/interfaces'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {

  @Get()
  async getMyReports(
    @CurrentUser() user: JwtPayload,
    @OrganizationId() organizationId?: string,
  ) {
    // Si es usuario INTERNO (roles existe)
    if (user.roles && user.roles.length > 0) {
      // Ver todos los reportes (o según su rol)
      return this.reportsService.findAll()
    }

    // Si es usuario EXTERNO (organizationId existe)
    if (organizationId) {
      // Solo ver reportes de su organización
      return this.reportsService.findByOrganization(organizationId)
    }

    throw new ForbiddenException('Usuario sin perfil válido')
  }
}
```

### 4. Proteger por Permisos Específicos

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, PermissionsGuard, RequirePermissions } from '@core/auth'
import { Resource, Action } from '@core/auth/domain/authorization'

@Controller('audits')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditsController {

  // Requiere permiso específico
  @RequirePermissions({ resource: Resource.AUDITS, action: Action.APPROVE })
  @Patch(':id/approve')
  async approveAudit(@Param('id') id: string) {
    // Solo usuarios con permiso AUDITS:APPROVE pueden acceder
    // (ADMINISTRADOR y GERENTE)
  }
}
```

## Decorators Disponibles

### @CurrentUser()
Obtiene el usuario actual (JWT payload completo)

```typescript
@Get('profile')
async getProfile(@CurrentUser() user: JwtPayload) {
  return user
}
```

### @OrganizationId()
Obtiene el organizationId del cliente (solo externos)

```typescript
@Get('my-audits')
async getMyAudits(@OrganizationId() orgId?: string) {
  if (!orgId) throw new BadRequestException('Solo para clientes')
  return this.auditsService.findByOrganization(orgId)
}
```

### @CurrentRole()
Obtiene el rol activo del usuario interno

```typescript
@Get('dashboard')
async getDashboard(@CurrentRole() currentRole?: string) {
  // currentRole solo existe para usuarios internos
  return this.dashboardService.getByRole(currentRole)
}
```

### @Roles(...roles)
Requiere uno de los roles especificados

```typescript
@Roles(Role.ADMINISTRADOR, Role.GERENTE)
@Post('assign')
async assignAudit(...) {
  // Solo Admin o Gerente
}
```

### @InternalOnly()
Requiere que sea usuario interno

```typescript
@InternalOnly()
@Post('system-config')
async updateSystemConfig(...) {
  // Solo usuarios internos, clientes reciben 403
}
```

## Guards Disponibles

1. **JwtAuthGuard** - Valida el JWT token (siempre usar primero)
2. **RolesGuard** - Verifica roles específicos con @Roles()
3. **PermissionsGuard** - Verifica permisos con @RequirePermissions()
4. **InternalOnlyGuard** - Verifica que sea usuario interno con @InternalOnly()

## Cambio de Rol (Solo Usuarios Internos)

Los usuarios internos con múltiples roles pueden cambiar su rol activo:

```http
POST /api/auth/switch-role
Authorization: Bearer <token>
{
  "sessionId": "session-uuid",
  "newRole": "gerente"
}
```

**Respuesta:**
- Nuevos tokens con el rol actualizado
- Menús y permisos del nuevo rol

## Refresh Token

```http
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGci..."
}
```

**Respuesta:**
```json
{
  "accessToken": "nuevo-access-token",
  "refreshToken": "nuevo-refresh-token"
}
```

## Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
{
  "refreshToken": "eyJhbGci..."
}
```

## Mejores Prácticas

### ✅ DO:
1. Siempre usar `@UseGuards(JwtAuthGuard)` en controllers protegidos
2. Combinar guards: `@UseGuards(JwtAuthGuard, RolesGuard)` cuando necesites roles
3. Usar `@InternalOnly()` para endpoints administrativos
4. Filtrar datos por `organizationId` para clientes
5. Validar permisos a nivel de negocio además de guards

### ❌ DON'T:
1. No confiar solo en el frontend para ocultar opciones
2. No olvidar aplicar guards en nuevos endpoints
3. No mezclar lógica de internal y external en el mismo endpoint
4. No exponer datos de otras organizaciones a clientes

## Ejemplo Completo: Endpoint de Reportes

```typescript
import {
  Controller, Get, Post, Body, Param,
  UseGuards, ForbiddenException
} from '@nestjs/common'
import {
  JwtAuthGuard, RolesGuard, Roles, Role,
  CurrentUser, OrganizationId
} from '@core/auth'
import { JwtPayload } from '@core/auth/interfaces'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {

  // Endpoint para clientes: solo ven sus reportes
  @Get('my-reports')
  async getMyReports(
    @CurrentUser() user: JwtPayload,
    @OrganizationId() organizationId?: string,
  ) {
    if (organizationId) {
      // Cliente: solo sus reportes
      return this.reportsService.findByOrganization(organizationId)
    }

    // Usuario interno: reportes según permisos
    return this.reportsService.findAll()
  }

  // Solo internos con roles específicos pueden crear reportes
  @Roles(Role.ADMINISTRADOR, Role.GERENTE, Role.AUDITOR)
  @UseGuards(RolesGuard)
  @Post()
  async createReport(@Body() dto: CreateReportDto) {
    return this.reportsService.create(dto)
  }

  // Solo admin puede eliminar
  @Roles(Role.ADMINISTRADOR)
  @UseGuards(RolesGuard)
  @Delete(':id')
  async deleteReport(@Param('id') id: string) {
    return this.reportsService.delete(id)
  }
}
```

## Arquitectura de Seguridad

```
Cliente/Frontend
      ↓
   [Request con JWT]
      ↓
   JwtAuthGuard → Valida token y extrae user
      ↓
   InternalOnlyGuard → (opcional) Verifica si es interno
      ↓
   RolesGuard → (opcional) Verifica rol específico
      ↓
   PermissionsGuard → (opcional) Verifica permiso
      ↓
   Controller → Lógica de negocio
      ↓
   Service → Filtrado por organización si aplica
      ↓
   Repository → Query a base de datos
```

## Testing de Autenticación

```typescript
describe('ReportsController', () => {
  it('cliente solo ve sus reportes', async () => {
    const clientToken = await getClientToken('cliente@org.com')

    const response = await request(app.getHttpServer())
      .get('/reports/my-reports')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200)

    // Verificar que solo trae reportes de su organización
    expect(response.body.every(r => r.organizationId === 'org-123')).toBe(true)
  })

  it('admin puede crear reportes', async () => {
    const adminToken = await getAdminToken()

    await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Nuevo reporte' })
      .expect(201)
  })

  it('cliente no puede crear reportes', async () => {
    const clientToken = await getClientToken('cliente@org.com')

    await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ title: 'Nuevo reporte' })
      .expect(403) // Forbidden
  })
})
```
