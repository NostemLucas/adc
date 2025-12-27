# Plan de Reorganización: Módulo de Usuarios

## 📊 Análisis de la Estructura Actual

### Problemas Identificados:
1. ❌ Todos los archivos de dominio están en una sola carpeta raíz
2. ❌ No hay separación clara entre agregados (User, InternalProfile, ExternalProfile)
3. ❌ Los commands/queries mezclan operaciones de diferentes agregados
4. ❌ Falta organización por contextos de negocio
5. ❌ Repositorios e interfaces están dispersos

---

## 🎯 Estructura Propuesta

### Organización por Agregados

```
src/core/users/
├── 📁 domain/
│   ├── 📁 user/                          # Agregado User (base)
│   │   ├── user.entity.ts
│   │   ├── user.spec.ts
│   │   ├── user.repository.interface.ts
│   │   ├── events/
│   │   │   ├── user-created.event.ts
│   │   │   ├── user-updated.event.ts
│   │   │   ├── user-deleted.event.ts
│   │   │   └── index.ts
│   │   └── exceptions/
│   │       ├── user.exceptions.ts
│   │       └── index.ts
│   │
│   ├── 📁 internal-profile/               # Agregado InternalProfile
│   │   ├── internal-profile.entity.ts
│   │   ├── internal-profile.spec.ts
│   │   ├── internal-profile.repository.interface.ts
│   │   ├── internal-user.aggregate.ts     # Agregado User + InternalProfile
│   │   ├── events/
│   │   │   ├── profile-role-changed.event.ts
│   │   │   └── index.ts
│   │   └── exceptions/
│   │       └── internal-profile.exceptions.ts
│   │
│   ├── 📁 external-profile/               # Agregado ExternalProfile
│   │   ├── external-profile.entity.ts
│   │   ├── external-profile.spec.ts
│   │   ├── external-profile.repository.interface.ts
│   │   ├── external-user.aggregate.ts     # Agregado User + ExternalProfile
│   │   ├── events/
│   │   │   ├── profile-organization-changed.event.ts
│   │   │   └── index.ts
│   │   └── exceptions/
│   │       └── external-profile.exceptions.ts
│   │
│   ├── 📁 shared/                         # Compartido entre agregados
│   │   ├── constants/
│   │   │   ├── user-type.enum.ts
│   │   │   ├── user-status.enum.ts
│   │   │   ├── system-role.enum.ts
│   │   │   └── index.ts
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts
│   │   │   ├── username.vo.ts
│   │   │   ├── password.vo.ts
│   │   │   ├── person-name.vo.ts
│   │   │   ├── ci.vo.ts
│   │   │   ├── phone.vo.ts
│   │   │   ├── address.vo.ts
│   │   │   ├── image-url.vo.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── user-uniqueness.validator.ts
│   │   │   └── index.ts
│   │   └── policies/
│   │       ├── login-policy.ts
│   │       └── index.ts
│   │
│   └── index.ts                           # Export todo el dominio
│
├── 📁 application/
│   ├── 📁 user/                           # Use cases de User base
│   │   ├── commands/
│   │   │   ├── update-user/
│   │   │   │   ├── update-user.command.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   ├── update-user.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── delete-user/
│   │   │   │   ├── delete-user.command.ts
│   │   │   │   ├── delete-user.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── upload-avatar/
│   │   │   │   ├── upload-avatar.command.ts
│   │   │   │   ├── upload-avatar.dto.ts
│   │   │   │   ├── upload-avatar.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── queries/
│   │   │   ├── get-user/
│   │   │   │   ├── get-user.query.ts
│   │   │   │   ├── get-user.handler.ts
│   │   │   │   ├── user-response.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── list-users/
│   │   │   │   ├── list-users.query.ts
│   │   │   │   ├── list-users.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── event-handlers/
│   │   │   ├── user-created.handler.ts
│   │   │   ├── user-updated.handler.ts
│   │   │   ├── user-deleted.handler.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── 📁 internal-profile/               # Use cases de InternalProfile
│   │   ├── commands/
│   │   │   ├── create-internal-user/
│   │   │   │   ├── create-internal-user.command.ts
│   │   │   │   ├── create-internal-user.dto.ts
│   │   │   │   ├── create-internal-user.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── update-profile-roles/
│   │   │   │   ├── update-profile-roles.command.ts
│   │   │   │   ├── update-profile-roles.dto.ts
│   │   │   │   ├── update-profile-roles.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── queries/
│   │   │   ├── get-internal-users-by-role/
│   │   │   │   ├── get-internal-users-by-role.query.ts
│   │   │   │   ├── get-internal-users-by-role.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── 📁 external-profile/               # Use cases de ExternalProfile
│   │   ├── commands/
│   │   │   ├── create-external-user/
│   │   │   │   ├── create-external-user.command.ts
│   │   │   │   ├── create-external-user.dto.ts
│   │   │   │   ├── create-external-user.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── change-organization/
│   │   │   │   ├── change-organization.command.ts
│   │   │   │   ├── change-organization.dto.ts
│   │   │   │   ├── change-organization.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── activate-profile/
│   │   │   │   ├── activate-profile.command.ts
│   │   │   │   ├── activate-profile.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── queries/
│   │   │   ├── get-users-by-organization/
│   │   │   │   ├── get-users-by-organization.query.ts
│   │   │   │   ├── get-users-by-organization.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── 📁 shared/                         # Mappers y DTOs compartidos
│   │   ├── mappers/
│   │   │   ├── user-to-response.mapper.ts
│   │   │   ├── internal-user-to-response.mapper.ts
│   │   │   ├── external-user-to-response.mapper.ts
│   │   │   └── index.ts
│   │   └── dtos/
│   │       ├── user-base-response.dto.ts
│   │       └── index.ts
│   │
│   └── index.ts
│
├── 📁 infrastructure/
│   ├── 📁 persistence/
│   │   ├── user/
│   │   │   ├── user.orm-mapper.ts
│   │   │   ├── user.repository.ts
│   │   │   └── index.ts
│   │   ├── internal-profile/
│   │   │   ├── internal-profile.orm-mapper.ts
│   │   │   ├── internal-profile.repository.ts
│   │   │   └── index.ts
│   │   ├── external-profile/
│   │   │   ├── external-profile.orm-mapper.ts
│   │   │   ├── external-profile.repository.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── 📁 mappers/
│   │   ├── user-status.mapper.ts
│   │   └── index.ts
│   │
│   ├── 📁 di/
│   │   ├── tokens.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── 📁 presentation/
│   ├── 📁 http/
│   │   ├── users.controller.ts
│   │   ├── users.controller.spec.ts
│   │   ├── internal-users.controller.ts    # Nuevo - endpoints específicos
│   │   ├── external-users.controller.ts    # Nuevo - endpoints específicos
│   │   └── index.ts
│   │
│   └── index.ts
│
├── 📁 test-helpers/
│   ├── user-mock.factory.ts
│   ├── internal-profile-mock.factory.ts
│   ├── external-profile-mock.factory.ts
│   └── index.ts
│
├── users.module.ts                         # Módulo principal
└── README.md                               # Documentación del módulo
```

---

## 🔄 Migraciones de Archivos

### Paso 1: Reorganizar Domain

```bash
# User aggregate
domain/user.ts                  → domain/user/user.entity.ts
domain/user.spec.ts             → domain/user/user.spec.ts
domain/events/user-*.event.ts   → domain/user/events/
domain/exceptions/user.*.ts     → domain/user/exceptions/

# InternalProfile aggregate
domain/internal-profile.ts      → domain/internal-profile/internal-profile.entity.ts
domain/internal-user.ts         → domain/internal-profile/internal-user.aggregate.ts

# ExternalProfile aggregate
domain/external-profile.ts      → domain/external-profile/external-profile.entity.ts
domain/external-user.ts         → domain/external-profile/external-user.aggregate.ts

# Shared
domain/constants/               → domain/shared/constants/
domain/value-objects/           → domain/shared/value-objects/
domain/services/                → domain/shared/services/
domain/policies/                → domain/shared/policies/
```

### Paso 2: Reorganizar Application

```bash
# Separar create-user en dos handlers especializados
application/commands/create-user/
  → application/internal-profile/commands/create-internal-user/
  → application/external-profile/commands/create-external-user/

# Mantener comandos generales en user/
application/commands/update-user/    → application/user/commands/update-user/
application/commands/delete-user/    → application/user/commands/delete-user/
application/commands/upload-avatar/  → application/user/commands/upload-avatar/

# Queries
application/queries/get-user/        → application/user/queries/get-user/
application/queries/list-users/      → application/user/queries/list-users/
```

### Paso 3: Reorganizar Infrastructure

```bash
infrastructure/persistence/user.*.ts
  → infrastructure/persistence/user/

infrastructure/persistence/internal-profile.*.ts
  → infrastructure/persistence/internal-profile/

infrastructure/persistence/external-profile.*.ts
  → infrastructure/persistence/external-profile/
```

### Paso 4: Controllers

```bash
# Separar en 3 controllers especializados
users.controller.ts
  → presentation/http/users.controller.ts           (operaciones generales)
  → presentation/http/internal-users.controller.ts  (específico INTERNAL)
  → presentation/http/external-users.controller.ts  (específico EXTERNAL)
```

---

## 📝 Nuevos Archivos a Crear

### 1. InternalUsersController
```typescript
// presentation/http/internal-users.controller.ts
@Controller('internal-users')
@ApiTags('Usuarios Internos')
export class InternalUsersController {
  @Post()
  createInternalUser(@Body() dto: CreateInternalUserDto) { }

  @Put(':id/roles')
  updateRoles(@Param('id') id: string, @Body() dto: UpdateRolesDto) { }

  @Get('by-role/:role')
  getUsersByRole(@Param('role') role: SystemRole) { }
}
```

### 2. ExternalUsersController
```typescript
// presentation/http/external-users.controller.ts
@Controller('external-users')
@ApiTags('Usuarios Externos')
export class ExternalUsersController {
  @Post()
  createExternalUser(@Body() dto: CreateExternalUserDto) { }

  @Put(':id/organization')
  changeOrganization(@Param('id') id: string, @Body() dto: ChangeOrgDto) { }

  @Get('by-organization/:orgId')
  getUsersByOrganization(@Param('orgId') orgId: string) { }

  @Post(':id/activate')
  activateProfile(@Param('id') id: string) { }

  @Post(':id/deactivate')
  deactivateProfile(@Param('id') id: string) { }
}
```

### 3. Separar CreateUserDto

```typescript
// application/internal-profile/commands/create-internal-user/create-internal-user.dto.ts
export class CreateInternalUserDto {
  // Campos base de User
  names: string
  lastNames: string
  email: string
  username: string
  password: string
  ci: string
  phone?: string
  address?: string

  // Específicos de InternalProfile
  roles: SystemRole[]           // OBLIGATORIO
  department?: string
  employeeCode?: string
}

// application/external-profile/commands/create-external-user/create-external-user.dto.ts
export class CreateExternalUserDto {
  // Campos base de User
  names: string
  lastNames: string
  email: string
  username: string
  password: string
  ci: string
  phone?: string
  address?: string

  // Específicos de ExternalProfile
  organizationId: string        // OBLIGATORIO
  jobTitle?: string
  department?: string
  organizationalEmail?: string
}
```

### 4. Domain Index Mejorado

```typescript
// domain/index.ts
// User Aggregate
export * from './user/user.entity'
export * from './user/events'
export * from './user/exceptions'
export * from './user/user.repository.interface'

// InternalProfile Aggregate
export * from './internal-profile/internal-profile.entity'
export * from './internal-profile/internal-user.aggregate'
export * from './internal-profile/events'
export * from './internal-profile/exceptions'
export * from './internal-profile/internal-profile.repository.interface'

// ExternalProfile Aggregate
export * from './external-profile/external-profile.entity'
export * from './external-profile/external-user.aggregate'
export * from './external-profile/events'
export * from './external-profile/exceptions'
export * from './external-profile/external-profile.repository.interface'

// Shared
export * from './shared/constants'
export * from './shared/value-objects'
export * from './shared/services'
export * from './shared/policies'
```

### 5. Application Index Mejorado

```typescript
// application/index.ts
// User Commands
export * from './user/commands'
export * from './user/queries'
export * from './user/event-handlers'

// InternalProfile Commands
export * from './internal-profile/commands'
export * from './internal-profile/queries'

// ExternalProfile Commands
export * from './external-profile/commands'
export * from './external-profile/queries'

// Shared
export * from './shared/mappers'
export * from './shared/dtos'
```

### 6. README del Módulo

```markdown
# Users Module

## Estructura

Este módulo maneja tres agregados principales:
- **User**: Entidad base con información común
- **InternalProfile**: Para personal del sistema (administradores, gerentes, auditores)
- **ExternalProfile**: Para usuarios de organizaciones clientes

## Endpoints

### Usuarios Generales
- GET /users - Listar todos
- GET /users/:id - Obtener uno
- PUT /users/:id - Actualizar
- DELETE /users/:id - Eliminar
- POST /users/:id/avatar - Subir avatar

### Usuarios Internos
- POST /internal-users - Crear usuario interno
- PUT /internal-users/:id/roles - Actualizar roles
- GET /internal-users/by-role/:role - Buscar por rol

### Usuarios Externos
- POST /external-users - Crear usuario externo
- PUT /external-users/:id/organization - Cambiar organización
- GET /external-users/by-organization/:orgId - Buscar por organización
- POST /external-users/:id/activate - Activar perfil
- POST /external-users/:id/deactivate - Desactivar perfil

## Ver más
- [Guía de Arquitectura](../../docs/USER-ARCHITECTURE-GUIDE.md)
```

---

## ✅ Beneficios de esta Reorganización

1. **Separación de Responsabilidades**: Cada agregado tiene su propio namespace
2. **Escalabilidad**: Fácil agregar nuevos use cases sin mezclar contextos
3. **Descubribilidad**: Estructura clara, fácil encontrar archivos
4. **Testing**: Tests organizados por agregado
5. **Domain-Driven Design**: Refleja los bounded contexts
6. **Mantenibilidad**: Cambios en un agregado no afectan otros

---

## 🚀 Plan de Implementación

### Fase 1: Estructura Base (Sin romper nada)
1. Crear nuevas carpetas
2. Copiar archivos a nuevas ubicaciones (mantener originales)
3. Actualizar imports en archivos copiados
4. Verificar que compile

### Fase 2: Migrar Domain
1. Mover archivos de dominio
2. Crear índices de exportación
3. Actualizar imports en application e infrastructure

### Fase 3: Migrar Application
1. Separar CreateUser en dos handlers
2. Reorganizar commands y queries
3. Actualizar imports

### Fase 4: Migrar Infrastructure
1. Reorganizar repositorios
2. Actualizar providers en module

### Fase 5: Separar Controllers
1. Crear InternalUsersController
2. Crear ExternalUsersController
3. Migrar endpoints

### Fase 6: Limpieza
1. Eliminar archivos antiguos
2. Actualizar tests
3. Actualizar documentación

---

## ⚠️ Consideraciones

- Hacer cambios en una rama separada
- Ejecutar tests después de cada fase
- Mantener commits pequeños y descriptivos
- Actualizar imports gradualmente
- No romper la API existente hasta fase final

---

¿Procedo con la implementación? 🎯
