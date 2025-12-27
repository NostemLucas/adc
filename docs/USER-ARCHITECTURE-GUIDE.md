# Guía de Arquitectura: Sistema de Usuarios con Perfiles Separados

## 📋 Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Conceptos Clave](#conceptos-clave)
3. [Estructura de Entidades](#estructura-de-entidades)
4. [Flujos de Negocio](#flujos-de-negocio)
5. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 Visión General

El sistema de usuarios ahora utiliza una arquitectura de **Perfiles Separados** que separa físicamente a los usuarios según su tipo:

```
Usuario (User)
    ├─ type: INTERNAL → InternalProfile (tiene roles del sistema)
    └─ type: EXTERNAL → ExternalProfile (pertenece a una organización)
```

### ¿Por qué este cambio?

**Problema anterior:**
- Todos los usuarios tenían un array de roles
- Era posible que un usuario "CLIENTE" tuviera roles de sistema por error
- El invariante "solo clientes tienen organización" era frágil

**Solución actual:**
- Separación física a nivel de base de datos
- El `type` del usuario es **INMUTABLE** (no se puede cambiar)
- Imposible mezclar roles de sistema con organizaciones

---

## 🔑 Conceptos Clave

### 1. User (Usuario Base)

La entidad `User` ahora contiene solo información **común** a todos los usuarios:

```typescript
class User {
  // Campos comunes
  id: string
  names: Text        // Juan
  lastNames: Text    // Pérez García
  email: Email       // juan.perez@example.com
  username: Username // juanperez
  password: Password
  ci: BolivianCI     // 12345678
  phone: Phone?      // 70123456
  address: Text?
  image: ImageUrl?

  // CAMPO CLAVE: Tipo inmutable
  readonly type: UserType  // 'internal' o 'external'

  // Campos de seguridad
  status: UserStatus
  failedLoginAttempts: number
  lockUntil: Date?

  // Helpers
  get isInternal(): boolean
  get isExternal(): boolean
  get fullName(): string
  canAttemptLogin(): boolean
}
```

**Importante:**
- `type` es **readonly** - No se puede cambiar después de creación
- User ya **NO** tiene un campo `roles`
- Los roles ahora están en `InternalProfile`

### 2. InternalProfile (Perfil Interno)

Para usuarios del **personal del sistema** (administradores, gerentes, auditores):

```typescript
class InternalProfile {
  id: string
  userId: string  // Relación 1:1 con User

  // Roles del sistema
  roles: SystemRole[]  // ['administrador', 'gerente', 'auditor']

  // Info laboral
  department: string?        // "TI", "Finanzas"
  employeeCode: string?      // "EMP-001"
  hireDate: Date?

  // Helpers
  get primaryRole(): SystemRole
  hasRole(role: SystemRole): boolean
  get isAdmin(): boolean
  get isManager(): boolean
  get isAuditor(): boolean
}
```

**Enumeración de Roles del Sistema:**
```typescript
enum SystemRole {
  ADMINISTRADOR = 'administrador',
  GERENTE = 'gerente',
  AUDITOR = 'auditor'
}
```

### 3. ExternalProfile (Perfil Externo)

Para usuarios **clientes de organizaciones**:

```typescript
class ExternalProfile {
  id: string
  userId: string  // Relación 1:1 con User

  // OBLIGATORIO: Todo usuario externo pertenece a una organización
  organizationId: string

  // Info organizacional
  jobTitle: string?              // "Gerente de Proyecto"
  department: string?            // "Operaciones"
  organizationalEmail: Email?    // juan@empresa.com
  isActive: boolean
  joinedAt: Date
  leftAt: Date?

  // Métodos
  activate(): void
  deactivate(): void
  changeOrganization(newOrgId: string): void
}
```

### 4. Organization (Organización)

Entidad para empresas clientes:

```typescript
class Organization {
  id: string
  name: OrganizationName    // Único
  description: string?
  logo: ImageUrl?
  banner: ImageUrl?
  mission: string?
  vision: string?
  address: Text?
  phone: Phone?
  email: Email?
  website: string?
  isActive: boolean

  // Relaciones
  // → Muchos ExternalProfile.organizationId apuntan a esta org
}
```

---

## 🏗️ Estructura de Entidades

### Diagrama de Relaciones

```
┌──────────────────────┐
│       User           │
│  - id                │
│  - names             │
│  - email             │
│  - type (INMUTABLE)  │◄─┐
└──────────────────────┘  │
         △                 │
         │ 1:1             │
         ├─────────────────┼──────────────────┐
         │                 │                  │
┌────────┴──────────┐  ┌──┴──────────────┐  │
│ InternalProfile   │  │ ExternalProfile │  │
│  - userId ────────┼──┘  - userId ──────┼──┘
│  - roles[]        │     - organizationId ─┐
│  - department     │     - jobTitle        │
│  - employeeCode   │     - isActive        │
└───────────────────┘     └──────────────────┘
                                    │
                                    │ N:1
                                    ▼
                          ┌──────────────────┐
                          │  Organization    │
                          │  - id            │
                          │  - name          │
                          │  - logo          │
                          └──────────────────┘
```

### Agregados (Aggregates)

Para facilitar el trabajo con usuarios completos, existen agregados que combinan User + Profile:

#### InternalUser (Agregado)
```typescript
class InternalUser {
  private _user: User
  private _profile: InternalProfile

  // Delegación conveniente
  get id(): string { return this._user.id }
  get username(): string { return this._user.username }
  get email(): string { return this._user.email }
  get fullName(): string { return this._user.fullName }
  get profileId(): string { return this._profile.id }

  // Acceso a roles
  get roles(): SystemRole[] { return this._profile.roles }
  get primaryRole(): SystemRole { return this._profile.primaryRole }
  hasRole(role: SystemRole): boolean

  // Validaciones
  canAttemptLogin(): boolean {
    return this._user.canAttemptLogin()
  }
}
```

#### ExternalUser (Agregado)
```typescript
class ExternalUser {
  private _user: User
  private _profile: ExternalProfile

  // Delegación
  get id(): string { return this._user.id }
  get username(): string { return this._user.username }
  get organizationId(): string { return this._profile.organizationId }
  get profileId(): string { return this._profile.id }

  // Validaciones combinadas
  canAttemptLogin(): boolean {
    return this._user.canAttemptLogin() && this._profile.isActive
  }
}
```

---

## 🔄 Flujos de Negocio

### Flujo 1: Crear Usuario Interno

```typescript
// 1. Cliente envía request
POST /users
{
  "type": "internal",
  "names": "Juan",
  "lastNames": "Pérez",
  "email": "juan@sistema.com",
  "username": "jperez",
  "password": "Password123",
  "ci": "12345678",
  "roles": ["administrador", "gerente"],  // ← Roles del sistema
  "department": "TI",
  "employeeCode": "EMP-001"
}

// 2. CreateUserHandler procesa
async execute(command: CreateUserCommand) {
  // Validar que tipo sea INTERNAL
  if (dto.type !== UserType.INTERNAL) return

  // Validar que tenga roles
  if (!dto.roles || dto.roles.length === 0) {
    throw new Error('Usuarios INTERNAL deben tener roles')
  }

  // Crear User base
  const user = User.create({
    type: UserType.INTERNAL,  // ← INMUTABLE para siempre
    names: dto.names,
    // ... otros campos
  })
  await userRepository.save(user)

  // Crear InternalProfile
  const profile = InternalProfile.create({
    userId: user.id,
    roles: [SystemRole.ADMINISTRADOR, SystemRole.GERENTE],
    department: 'TI',
    employeeCode: 'EMP-001'
  })
  await internalProfileRepository.save(profile)

  // ✅ Ahora tenemos User + InternalProfile separados
}
```

### Flujo 2: Crear Usuario Externo

```typescript
POST /users
{
  "type": "external",
  "names": "María",
  "lastNames": "González",
  "email": "maria@cliente.com",
  "username": "mgonzalez",
  "password": "Password123",
  "ci": "87654321",
  "organizationId": "org-uuid-123",  // ← OBLIGATORIO
  "jobTitle": "Gerente de Proyecto",
  "organizationalEmail": "maria@empresa.com"
}

// CreateUserHandler
async execute(command: CreateUserCommand) {
  if (dto.type !== UserType.EXTERNAL) return

  // Validar que tenga organizationId
  if (!dto.organizationId) {
    throw new Error('Usuarios EXTERNAL deben tener organizationId')
  }

  // Crear User
  const user = User.create({
    type: UserType.EXTERNAL,  // ← INMUTABLE
    // ... campos
  })
  await userRepository.save(user)

  // Crear ExternalProfile
  const profile = ExternalProfile.create({
    userId: user.id,
    organizationId: dto.organizationId,  // ← Relación con Organization
    jobTitle: 'Gerente de Proyecto',
    organizationalEmail: 'maria@empresa.com'
  })
  await externalProfileRepository.save(profile)
}
```

### Flujo 3: Login

```typescript
// AuthService.login()
async login(username: string, password: string) {
  // 1. Buscar usuario base
  const user = await userRepository.findByUsernameOrEmail(username)

  // 2. Validar contraseña
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new UnauthorizedException()

  // 3. Cargar usuario CON perfil
  const fullUser = await this.loadUserWithProfile(user)

  // 4. Manejar según tipo
  if (fullUser instanceof InternalUser) {
    // Usuario INTERNAL
    const currentRole = fullUser.primaryRole

    // Crear sesión
    const session = Session.create({
      userId: user.id,
      currentRole: currentRole.toString(),  // 'administrador'
      // ...
    })

    // Generar tokens con roles
    const tokens = await this.generateTokenPairForInternal(
      fullUser,
      session.id,
      currentRole
    )

    // Obtener menús según rol activo
    const menus = MenuFilter.getMenusForRole(currentRole)
    const permissions = RolePermissionChecker.getPermissions(currentRole)

    return {
      user: {
        id: fullUser.id,
        type: 'internal',
        roles: ['administrador', 'gerente'],
        currentRole: 'administrador'
      },
      tokens,
      menus,
      permissions
    }
  }
  else {
    // Usuario EXTERNAL
    const session = Session.create({
      userId: user.id,
      currentRole: 'cliente',
      // ...
    })

    const tokens = await this.generateTokenPairForExternal(fullUser, session.id)

    // Menús de cliente
    const menus = MenuFilter.getMenusForRole(Role.CLIENTE)

    return {
      user: {
        id: fullUser.id,
        type: 'external',
        organizationId: fullUser.organizationId
      },
      tokens,
      menus,
      permissions
    }
  }
}

// Helper interno
private async loadUserWithProfile(user: User) {
  if (user.isInternal) {
    const profile = await internalProfileRepository.findByUserId(user.id)
    return InternalUser.create(user, profile)
  } else {
    const profile = await externalProfileRepository.findByUserId(user.id)
    return ExternalUser.create(user, profile)
  }
}
```

### Flujo 4: Cambiar Rol Activo (Solo INTERNAL)

```typescript
// Solo usuarios INTERNAL pueden cambiar de rol
PUT /auth/switch-role
{
  "role": "gerente"
}

// AuthService.switchRole()
async switchRole(sessionId: string, newRole: SystemRole) {
  const session = await sessionRepository.findById(sessionId)
  const user = await userRepository.findById(session.userId)

  // ⚠️ SOLO usuarios INTERNAL
  if (!user.isInternal) {
    throw new BadRequestException('Solo usuarios internos pueden cambiar rol')
  }

  // Cargar con perfil
  const internalUser = await this.loadUserWithProfile(user) as InternalUser

  // Verificar que tenga el rol
  if (!internalUser.hasRole(newRole)) {
    throw new BadRequestException(`No tienes el rol ${newRole}`)
  }

  // Cambiar rol en sesión
  session.switchRole(newRole.toString())

  // Regenerar tokens
  const tokens = await this.generateTokenPairForInternal(
    internalUser,
    session.id,
    newRole
  )

  // Nuevos menús según nuevo rol
  const menus = MenuFilter.getMenusForRole(newRole)
  const permissions = RolePermissionChecker.getPermissions(newRole)

  return { tokens, menus, permissions }
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Verificar si usuario es admin

```typescript
// ❌ ANTES (ya no funciona)
if (user.isAdmin) { ... }
if (user.roles.includes('ADMINISTRADOR')) { ... }

// ✅ AHORA
// Opción 1: Cargar con perfil
const fullUser = await loadUserWithProfile(user)
if (fullUser instanceof InternalUser && fullUser.hasRole(SystemRole.ADMINISTRADOR)) {
  // Es admin
}

// Opción 2: Desde JWT payload (más eficiente)
const payload = req.user  // JWT ya verificado
if (payload.type === 'internal' && payload.roles.includes('administrador')) {
  // Es admin
}
```

### Ejemplo 2: Obtener usuarios administradores

```typescript
// ❌ ANTES
const admins = await userRepository.findByRole('ADMINISTRADOR')

// ✅ AHORA
// Buscar en perfiles internos
const allProfiles = await internalProfileRepository.findAll()
const adminProfiles = allProfiles.filter(p =>
  p.roles.includes(SystemRole.ADMINISTRADOR)
)

// Cargar usuarios
const admins = await Promise.all(
  adminProfiles.map(p => userRepository.findById(p.userId))
)
```

### Ejemplo 3: Obtener usuarios de una organización

```typescript
// Buscar perfiles externos de la organización
const profiles = await externalProfileRepository.findByOrganizationId(orgId)

// Cargar usuarios
const users = await Promise.all(
  profiles.map(p => userRepository.findById(p.userId))
)
```

### Ejemplo 4: Estructura del JWT

```typescript
// Token para usuario INTERNAL
{
  sub: "user-id",
  username: "jperez",
  email: "juan@sistema.com",
  type: "internal",
  profileId: "profile-id",
  roles: ["administrador", "gerente"],
  currentRole: "administrador",
  sessionId: "session-id"
}

// Token para usuario EXTERNAL
{
  sub: "user-id",
  username: "mgonzalez",
  email: "maria@cliente.com",
  type: "external",
  profileId: "profile-id",
  organizationId: "org-uuid-123",
  sessionId: "session-id"
}
```

---

## 🛡️ Invariantes Protegidos

### 1. Tipo Inmutable
```typescript
const user = User.create({ type: UserType.INTERNAL, ... })

// ❌ IMPOSIBLE - El campo es readonly
user.type = UserType.EXTERNAL  // Error de compilación

// ❌ IMPOSIBLE - No existe el método
user.changeType(UserType.EXTERNAL)  // Error: método no existe
```

### 2. Separación Física

```sql
-- Usuario INTERNAL siempre tiene InternalProfile
-- Usuario EXTERNAL siempre tiene ExternalProfile

-- ✅ VÁLIDO
User { id: 1, type: 'INTERNAL' }
InternalProfile { userId: 1, roles: ['administrador'] }

-- ❌ IMPOSIBLE a nivel de aplicación
User { id: 2, type: 'INTERNAL' }
ExternalProfile { userId: 2, organizationId: 'org-1' }  -- ¡NO! Tipo mismatch
```

### 3. Organización Solo para Externos

```typescript
// ✅ Usuario EXTERNAL - DEBE tener organizationId
ExternalProfile.create({
  userId: user.id,
  organizationId: 'org-123',  // ← OBLIGATORIO
  ...
})

// ✅ Usuario INTERNAL - NO puede tener organizationId
InternalProfile.create({
  userId: user.id,
  roles: [SystemRole.ADMINISTRADOR],  // ← Tiene roles en su lugar
  ...
})
```

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | ANTES | AHORA |
|---------|-------|-------|
| **Roles** | `user.roles: Role[]` | `internalProfile.roles: SystemRole[]` |
| **Verificar Admin** | `user.isAdmin` | `internalUser.hasRole(SystemRole.ADMINISTRADOR)` |
| **Organización** | `user.organizationId?` (opcional) | `externalProfile.organizationId` (obligatorio) |
| **Tipo** | Implícito por roles | `user.type` (inmutable) |
| **Cambiar Rol** | Modificar `user.roles` | Solo cambiar `session.currentRole` |
| **Protección** | Validaciones en código | Separación física en DB |

---

## 🎓 Conceptos DDD Aplicados

### 1. **Aggregate Roots**
- `User` es un aggregate root
- `InternalProfile` es un aggregate root independiente
- `ExternalProfile` es un aggregate root independiente
- `InternalUser` y `ExternalUser` son agregados compuestos

### 2. **Value Objects**
- `Email`, `Username`, `Password`, `Phone`, `BolivianCI`
- Inmutables, validación en constructor

### 3. **Invariantes de Dominio**
- Tipo de usuario es inmutable
- Usuario INTERNAL debe tener al menos un rol
- Usuario EXTERNAL debe tener organizationId

### 4. **Eventos de Dominio**
- `UserCreatedEvent` - incluye `type` en lugar de `roles`
- `SessionCreatedEvent` - incluye `currentRole`
- `SessionRoleSwitchedEvent` - para usuarios INTERNAL

---

## 🔍 Debugging y Troubleshooting

### ¿Cómo verificar el tipo de un usuario?

```typescript
// En el código
const user = await userRepository.findById(userId)
console.log('Tipo:', user.type)  // 'internal' o 'external'
console.log('Es interno?', user.isInternal)  // true/false

// En la BD
SELECT id, username, type FROM "User" WHERE id = 'user-id';
```

### ¿Cómo ver los roles de un usuario?

```typescript
// INTERNAL users
const profile = await internalProfileRepository.findByUserId(userId)
console.log('Roles:', profile.roles)  // [SystemRole.ADMINISTRADOR, ...]

// EXTERNAL users (no tienen roles)
const profile = await externalProfileRepository.findByUserId(userId)
console.log('OrgId:', profile.organizationId)
```

### ¿Cómo cargar un usuario completo?

```typescript
const user = await userRepository.findById(userId)
const fullUser = await authService.loadUserWithProfile(user)

if (fullUser instanceof InternalUser) {
  console.log('Roles:', fullUser.roles)
  console.log('Es admin?', fullUser.hasRole(SystemRole.ADMINISTRADOR))
} else {
  console.log('OrgId:', fullUser.organizationId)
  console.log('Puede entrar?', fullUser.canAttemptLogin())
}
```

---

## 📚 Archivos Clave

```
src/core/users/domain/
├── user.ts                    # Entidad User base
├── internal-profile.ts        # Perfil para usuarios INTERNAL
├── external-profile.ts        # Perfil para usuarios EXTERNAL
├── internal-user.ts           # Agregado User + InternalProfile
├── external-user.ts           # Agregado User + ExternalProfile
└── constants/
    ├── user-type.enum.ts      # enum UserType
    └── system-role.enum.ts    # enum SystemRole

src/core/auth/
├── services/auth.service.ts   # Lógica de login
└── interfaces/
    └── jwt-payload.interface.ts  # Estructura del JWT

src/core/users/infrastructure/
└── persistence/
    ├── user.repository.ts
    ├── internal-profile.repository.ts
    └── external-profile.repository.ts
```

---

## ✅ Checklist de Migración

Si necesitas actualizar código existente:

- [ ] Reemplazar `user.roles` por cargar perfil y acceder a `internalUser.roles`
- [ ] Reemplazar `user.isAdmin` por `internalUser.hasRole(SystemRole.ADMINISTRADOR)`
- [ ] Reemplazar `user.organizationId` por `externalUser.organizationId`
- [ ] Actualizar creación de usuarios para incluir `type`
- [ ] Actualizar JWT para incluir `type`, `profileId`, y campos condicionales
- [ ] Queries que filtran por rol ahora deben usar `internalProfileRepository`

---

¿Necesitas más ejemplos o aclaraciones sobre algún concepto específico? 🚀
