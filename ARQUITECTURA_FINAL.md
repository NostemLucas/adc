# Arquitectura Final - Simple y Limpia

## ✅ Decisión: Repositorios Independientes

**NO usamos BaseRepository** - Cada repositorio es simple e independiente.

## Estructura

```
src/
├── shared/
│   ├── database/
│   │   ├── prisma.service.ts       ✅ Prisma Client
│   │   └── prisma.module.ts        ✅ Global module
│   └── filters/
│       └── prisma-exception.filter.ts  ✅ Errores centralizados
│
├── core/
│   ├── users/
│   │   ├── domain/
│   │   │   └── user.entity.ts      ✅ Entidad PURA (sin ORM)
│   │   └── infrastructure/
│   │       └── user.repository.ts  ✅ Repo independiente
│   │
│   ├── roles/
│   │   ├── domain/
│   │   │   └── role.entity.ts
│   │   └── infrastructure/
│   │       └── role.repository.ts
│   │
│   ├── sessions/
│   │   ├── domain/
│   │   │   └── session.entity.ts
│   │   └── infrastructure/
│   │       └── session.repository.ts
│   │
│   └── auth/
│       ├── services/
│       │   └── auth.service.ts     ✅ Usa repositorios
│       └── auth.module.ts
│
└── prisma/
    └── schema.prisma
```

## Flujo de Datos

```
┌─────────────────┐
│   Controller    │
└────────┬────────┘
         │
┌────────▼────────┐
│     Service     │  ← Lógica de negocio
└────────┬────────┘
         │
┌────────▼────────┐
│ Domain Entity   │  ← Validaciones
│  (User.create)  │
└────────┬────────┘
         │
┌────────▼────────┐
│   Repository    │  ← Simple, sin try-catch
│  (independiente)│
└────────┬────────┘
         │
┌────────▼────────┐
│  Prisma Client  │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
└─────────────────┘

  ┌──────────────────┐
  │ Exception Filter │ ← Captura errores
  │     (Global)     │   de Prisma
  └──────────────────┘
```

## Repositorio Simple

```typescript
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  private toDomain(prismaUser: PrismaUserWithRoles): User {
    return User.fromPersistence({ ... })
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true }
    })
    return user ? this.toDomain(user) : null
  }

  async create(user: User): Promise<User> {
    // NO try-catch - Exception Filter lo maneja
    const created = await this.prisma.user.create({
      data: { ... },
      include: { roles: true }
    })
    return this.toDomain(created)
  }

  // Solo métodos que necesitas
}
```

## Exception Filter Global

```typescript
// main.ts
app.useGlobalFilters(new PrismaExceptionFilter())

// Automáticamente convierte errores de Prisma a user-friendly:
// P2002 → 409: "Ya existe un registro con este email"
// P2025 → 404: "Registro no encontrado"
```

## Ventajas

✅ **Simple** - Sin abstracción compleja
✅ **Control total** - Cada repo hace exactamente lo que necesita
✅ **Type-safe** - Prisma types en lugar de `any`
✅ **Errores centralizados** - Exception Filter global
✅ **Fácil de entender** - No hay magia oculta

## Uso en Service

```typescript
@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private roleRepo: RoleRepository
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    // 1. Buscar roles
    const roles = await this.roleRepo.findByIds(dto.roleIds)

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    // 3. Crear entidad (validaciones automáticas)
    const user = User.create({
      ...dto,
      password: hashedPassword,
      roles
    })

    // 4. Guardar
    // Si falla → Exception Filter convierte a 409/404/etc
    return await this.userRepo.create(user)
  }
}
```

## Archivos Clave

✅ **Usar:**
- `user.repository.ts` (simple)
- `session.repository.ts` (simple)
- `role.repository.ts` (simple)
- `prisma-exception.filter.ts`
- `auth.service.ts` (refactorizado)
- `auth.module.ts` (con Prisma)
- `app.module.ts` (con PrismaModule)

❌ **NO usar (eliminados):**
- `base.repository.ts`
- `database.exception.ts`
- Archivos `.old.ts`

## Comandos Prisma

```bash
# Generar client
npx prisma generate

# Crear migración
npx prisma migrate dev --name init

# Ver DB
npx prisma studio

# Formatear schema
npx prisma format
```

## Conclusión

Arquitectura limpia ≠ Complejidad innecesaria.

Esta arquitectura es:
- ✅ Limpia (separación de capas)
- ✅ Simple (sin abstracción prematura)
- ✅ Type-safe (Prisma)
- ✅ Mantenible (fácil de entender)
