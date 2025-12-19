# Resumen de Refactorización: TypeORM → Prisma

## ¿Por qué esta refactorización?

### Problema Anterior (TypeORM)
```typescript
// ❌ Entidad mezclando decoradores de ORM con lógica de negocio
@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ nullable: false })
  names!: string

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({ name: 'user_roles', ... })
  roles!: Role[]

  // Lógica de dominio mezclada
  get fullName(): string { ... }
  static create(data) { ... }
}
```

**Problemas:**
- ❌ Responsabilidades mezcladas (persistencia + dominio)
- ❌ Difícil de testear
- ❌ Acoplado a TypeORM
- ❌ Errores técnicos expuestos al cliente

### Solución Nueva (Prisma + Clean Architecture)

```typescript
// ✅ Entidad de dominio PURA (sin decoradores)
export class User {
  names!: string
  roles: Role[] = []

  get fullName(): string { ... }

  static create(data) {
    // Validaciones de negocio puras
  }
}

// ✅ Repositorio maneja SOLO persistencia
@Injectable()
export class UserRepository extends BaseRepository {
  protected toDomain(prismaUser) { /* mapping */ }
  protected toPrismaCreate(user) { /* mapping */ }
}
```

**Ventajas:**
- ✅ Separación clara de responsabilidades
- ✅ Type-safety completo con Prisma
- ✅ Errores centralizados y user-friendly
- ✅ Fácil de testear (mock repositorios)
- ✅ Flexibilidad para cambiar ORM

## Estructura del Proyecto

```
src/
├── shared/
│   └── database/
│       ├── prisma.service.ts          # PrismaClient service
│       ├── prisma.module.ts           # Global module
│       ├── base.repository.ts         # ⭐ Repositorio base genérico
│       ├── exceptions/
│       │   └── database.exception.ts  # ⭐ Excepciones personalizadas
│       └── index.ts
│
├── core/
│   ├── users/
│   │   ├── domain/
│   │   │   ├── user.entity.ts        # ⭐ Entidad PURA (sin ORM)
│   │   │   └── user-status.enum.ts
│   │   └── infrastructure/
│   │       └── user.repository.ts    # ⭐ Implementación con Prisma
│   │
│   ├── roles/
│   │   ├── domain/
│   │   │   └── role.entity.ts        # ⭐ Entidad PURA
│   │   └── infrastructure/
│   │       └── role.repository.ts
│   │
│   ├── sessions/
│   │   ├── domain/
│   │   │   └── session.entity.ts     # ⭐ Entidad PURA
│   │   └── infrastructure/
│   │       └── session.repository.ts
│   │
│   └── auth/
│       ├── services/
│       │   ├── auth.service.ts       # ⭐ Refactorizado (usa repositorios)
│       │   └── auth.service.old.ts   # Backup TypeORM
│       └── auth.module.ts
│
└── prisma/
    └── schema.prisma                  # ⭐ Schema de base de datos
```

## Archivos Clave Creados

### 1. BaseRepository (Métodos Genéricos)
`src/shared/database/base.repository.ts`

**Funcionalidades:**
- ✅ CRUD genérico (create, update, delete, find)
- ✅ Soft delete / restore
- ✅ **Manejo centralizado de errores**
- ✅ Conversión automática Domain ↔ Prisma

```typescript
// Cualquier repositorio extiende BaseRepository
export class UserRepository extends BaseRepository<User, ...> {
  // Solo implementas conversiones específicas
  protected toDomain(prismaUser) { ... }
  protected toPrismaCreate(user) { ... }
  protected toPrismaUpdate(user) { ... }

  // Heredas automáticamente:
  // - findById, findOne, findMany
  // - create, update, delete
  // - softDelete, restore
  // - exists, count
}
```

### 2. Manejo Centralizado de Errores
`src/shared/database/exceptions/database.exception.ts`

**Antes:**
```typescript
try {
  await userRepo.create(data)
} catch (error) {
  // ❌ Error técnico de Prisma expuesto:
  // "Unique constraint failed on the fields: (`email`)"
}
```

**Después:**
```typescript
try {
  await userRepository.create(user)
} catch (error) {
  // ✅ Excepción amigable:
  // DuplicateRecordException: "Ya existe un User con este email"
  // Status 409 Conflict
}
```

**Tipos de excepciones:**
- `RecordNotFoundException` → 404
- `DuplicateRecordException` → 409
- `ForeignKeyViolationException` → 409
- `DatabaseException` → 500

### 3. Domain Entities (Pure)
`src/core/users/domain/user.entity.ts`

**Características:**
- ✅ Sin decoradores de ORM
- ✅ Lógica de negocio pura
- ✅ Factory methods (`create`, `fromPersistence`)
- ✅ Métodos de comportamiento
- ✅ Validaciones de dominio

```typescript
export class User {
  // Factory para crear nuevos usuarios
  static create(data: {...}) {
    // Validaciones de negocio
    User.validateRequiredFields(data)
    User.validateFormats(data)
    User.validateRoles(data.roles)

    const user = new User()
    // ... inicialización
    return user
  }

  // Factory para hidratar desde DB
  static fromPersistence(data: {...}) {
    const user = new User()
    // ... mapeo desde Prisma
    return user
  }

  // Lógica de negocio
  incrementFailedAttempts(): void { ... }
  canAttemptLogin(): boolean { ... }
}
```

### 4. Prisma Schema
`prisma/schema.prisma`

```prisma
model User {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?  // Soft delete

  names     String
  email     String    @unique
  // ... otros campos

  roles     Role[]    @relation("UserRoles")
  sessions  Session[]

  @@map("users")
}
```

## Flujo de Datos

```
┌─────────────────────────────────────────────┐
│ 1. Controller                               │
│    - Recibe CreateUserDto                   │
│    - Valida con class-validator             │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 2. Service                                  │
│    - Hashea password                        │
│    - Busca roles en RoleRepository          │
│    - Crea User.create() ← validaciones      │
│    - Llama userRepository.save()            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 3. Domain Entity (User)                     │
│    - User.create() valida reglas de negocio│
│    - Valida formato email, CI               │
│    - Valida roles exclusivos                │
│    - Retorna User válido                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 4. Repository                               │
│    - toPrismaCreate(user)                   │
│    - prisma.user.create()                   │
│    - Maneja errores → Excepciones amigables │
│    - toDomain(prismaUser) → User            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 5. Prisma                                   │
│    - Ejecuta query SQL                      │
│    - Type-safety completo                   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 6. PostgreSQL                               │
└─────────────────────────────────────────────┘
```

## Ejemplo Completo: Crear Usuario

### Antes (TypeORM)
```typescript
// Service
async createUser(dto: CreateUserDto) {
  const user = new User()
  user.names = dto.names
  user.email = dto.email
  // ... manualmente

  try {
    return await this.userRepository.save(user)
  } catch (error) {
    // ❌ Error técnico sin traducir
    if (error.code === '23505') { // magic number
      throw new ConflictException('Email duplicado')
    }
  }
}
```

### Después (Prisma)
```typescript
// Service
async createUser(dto: CreateUserDto) {
  // 1. Buscar roles
  const roles = await this.roleRepository.findByIds(dto.roleIds)

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(dto.password, 10)

  // 3. Crear entidad (validaciones automáticas)
  const user = User.create({
    ...dto,
    password: hashedPassword,
    roles, // ← Aquí valida automáticamente roles exclusivos
  })

  // 4. Persistir (errores ya traducidos)
  return await this.userRepository.save(user)
}
```

## Ventajas Específicas para tu Caso

### 1. Type Safety Completo
```typescript
// ✅ Autocomplete y validación en tiempo de desarrollo
const user = await prisma.user.findUnique({
  where: { id: '123' },
  include: {
    roles: true,  // ← IDE autocompleta relaciones
    sessions: {
      where: { isActive: true }  // ← Type-safe queries
    }
  }
})
```

### 2. Migraciones Controladas
```bash
# Crear migración
npx prisma migrate dev --name add_phone_verified

# Aplicar en producción
npx prisma migrate deploy

# Ver estado
npx prisma migrate status
```

### 3. Prisma Studio (GUI)
```bash
npx prisma studio
# Abre UI en http://localhost:5555
# Ver/editar datos sin SQL
```

### 4. Testing Simplificado
```typescript
// Mock del repositorio
const mockUserRepo = {
  findById: jest.fn().mockResolvedValue(mockUser),
  save: jest.fn().mockResolvedValue(mockUser),
}

const authService = new AuthService(
  mockUserRepo,  // ← Fácil de mockear
  mockSessionRepo,
  jwtService,
  configService
)
```

## Comparación de Código

### Buscar Usuario

**TypeORM:**
```typescript
const user = await this.userRepository.findOne({
  where: [{ username }, { email: username }],
  relations: ['roles'],
})
```

**Prisma:**
```typescript
const user = await this.userRepository.findOne({
  OR: [{ username }, { email: username }],
}, { roles: true })
```

### Crear con Relaciones

**TypeORM:**
```typescript
const user = new User()
user.roles = await this.roleRepository.findByIds(roleIds)
await this.userRepository.save(user)
```

**Prisma:**
```typescript
const user = User.create({ ...data, roles })
await this.userRepository.save(user)
// Repository internamente hace:
// prisma.user.create({
//   data: { ...user, roles: { connect: roles.map(r => ({ id: r.id })) } }
// })
```

## Próximos Pasos Recomendados

1. **Crear archivo .env**
   ```bash
   cp .env.example .env
   # Editar DATABASE_URL
   ```

2. **Ejecutar migración**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed de datos iniciales**
   ```bash
   npx prisma db seed
   ```

4. **Reemplazar archivos**
   ```bash
   # Ver MIGRATION_GUIDE.md
   ```

5. **Migrar otros módulos** siguiendo el mismo patrón

6. **Eliminar TypeORM** cuando todo funcione
   ```bash
   npm uninstall typeorm @nestjs/typeorm
   ```

## Comandos Útiles

```bash
# Generar Prisma Client
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Ver DB en UI
npx prisma studio

# Formatear schema
npx prisma format

# Validar schema
npx prisma validate
```

## Recursos

- 📘 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Guía paso a paso
- 📘 [API_EXAMPLES.md](./API_EXAMPLES.md) - Ejemplos de uso con Swagger
- 🌐 [Prisma Docs](https://www.prisma.io/docs)
- 🌐 [NestJS + Prisma](https://docs.nestjs.com/recipes/prisma)

## Conclusión

Esta refactorización te da una arquitectura profesional y escalable:

- ✅ **Clean Architecture** - Separación clara de capas
- ✅ **Type Safety** - Prisma autocompleta todo
- ✅ **Error Handling** - Centralizado y user-friendly
- ✅ **Testeable** - Mock repositorios fácilmente
- ✅ **Flexible** - Cambia ORM sin tocar dominio
- ✅ **Mantenible** - Código limpio y organizado

¡Ahora tienes control total sobre tus entidades y la persistencia está completamente separada! 🚀
