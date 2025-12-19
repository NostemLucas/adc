# Comparación: BaseRepository vs Repositorios Independientes

## TL;DR: Usa Repositorios Independientes ✅

Para tu proyecto, **repositorios independientes** es la mejor opción.

## Comparación

### Opción 1: BaseRepository (Abstracto)

```typescript
// BaseRepository genérico
export abstract class BaseRepository<TDomain, TPrisma, ...> {
  protected abstract toDomain(prisma: any): TDomain
  protected abstract toPrisma(domain: TDomain): TPrisma

  async findById(id: string): Promise<TDomain | null> { }
  async create(data: TDomain): Promise<TDomain> { }
  async update(id: string, data: TDomain): Promise<TDomain> { }
  // ... 20+ métodos genéricos
}

// UserRepository extiende BaseRepository
export class UserRepository extends BaseRepository<User, PrismaUser, ...> {
  protected toDomain(prisma: any): User { }
  protected toPrisma(user: User): PrismaUser { }
  // Ya heredó todos los métodos
}
```

**Ventajas:**
- ✅ Evita duplicación de código
- ✅ Consistencia en todos los repos
- ✅ Un lugar para cambiar lógica común

**Desventajas:**
- ❌ Complejidad con TypeScript generics
- ❌ "Magia" oculta - developers nuevos se confunden
- ❌ Menos flexibilidad para casos especiales
- ❌ Over-engineering para proyectos pequeños/medianos
- ❌ TypeScript errors con tipos de Prisma

### Opción 2: Repositorios Independientes (Recomendado) ✅

```typescript
// UserRepository - Simple y directo
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  private toDomain(prismaUser: any): User {
    return User.fromPersistence({ ... })
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    return user ? this.toDomain(user) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    return user ? this.toDomain(user) : null
  }

  async save(user: User): Promise<User> {
    if (user.id) return this.update(user)
    else return this.create(user)
  }

  // Solo los métodos que REALMENTE necesitas
}
```

**Ventajas:**
- ✅ **Control total** - Cada repo hace exactamente lo que necesita
- ✅ **Simple y explícito** - Todo es visible
- ✅ **Fácil de entender** - No hay abstracción compleja
- ✅ **Flexible** - Puedes customizar sin restricciones
- ✅ **TypeScript feliz** - No hay problemas con genéricos
- ✅ **Prisma ya da type-safety** - No necesitas tanto wrapper

**Desventajas:**
- ⚠️ Repetición de código (pero mínima)
- ⚠️ Debes mantener consistencia manualmente

## Manejo de Errores: Exception Filter Global

En lugar de manejar errores en BaseRepository, usa un **Exception Filter Global**:

```typescript
// src/shared/filters/prisma-exception.filter.ts
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    switch (exception.code) {
      case 'P2002': // Duplicate
        return response.status(409).json({
          message: `Ya existe un registro con este ${field}`
        })

      case 'P2025': // Not found
        return response.status(404).json({
          message: 'Registro no encontrado'
        })

      // ... otros códigos
    }
  }
}

// En main.ts
app.useGlobalFilters(new PrismaExceptionFilter())
```

**Ventajas del Exception Filter Global:**
- ✅ Un solo lugar para manejar errores de Prisma
- ✅ Los repositorios se mantienen simples
- ✅ No necesitas try-catch en cada método
- ✅ Errores consistentes en toda la app

## Ejemplo Completo

### Repositorio Independiente

```typescript
// user.repository.ts
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  private toDomain(u: any): User {
    return User.fromPersistence({
      id: u.id,
      email: u.email,
      username: u.username,
      // ... resto de campos
      roles: u.roles?.map(r => Role.fromPersistence(r)) || []
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true }
    })
    return user ? this.toDomain(user) : null
  }

  async create(user: User): Promise<User> {
    // ❌ NO necesitas try-catch
    // El Exception Filter global captura errores de Prisma
    const created = await this.prisma.user.create({
      data: {
        email: user.email,
        username: user.username,
        password: user.password,
        // ...
        roles: { connect: user.roles.map(r => ({ id: r.id })) }
      },
      include: { roles: true }
    })

    return this.toDomain(created)
  }
}
```

### Uso en Service

```typescript
// user.service.ts
@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private roleRepo: RoleRepository
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    // 1. Buscar roles
    const roles = await this.roleRepo.findByIds(dto.roleIds)

    // 2. Hashear password
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    // 3. Crear entidad (con validaciones)
    const user = User.create({
      ...dto,
      password: hashedPassword,
      roles
    })

    // 4. Guardar
    // Si email duplicado → PrismaExceptionFilter convierte a 409
    return await this.userRepo.create(user)
  }
}
```

## Cuándo Usar Cada Opción

### Usa BaseRepository cuando:
- ❌ Tienes 10+ entidades muy similares
- ❌ El equipo es muy grande y necesitas consistencia forzada
- ❌ Estás construyendo un framework/librería

### Usa Repositorios Independientes cuando:
- ✅ Tienes 2-8 entidades (tu caso)
- ✅ Quieres máximo control
- ✅ El equipo es pequeño/mediano
- ✅ Prefieres simplicidad sobre abstracción
- ✅ **Estás usando Prisma** (que ya da type-safety)

## Migración de BaseRepository a Independientes

Si ya creaste con BaseRepository:

1. **Copia el método genérico** que necesites
2. **Pégalo en el repositorio específico**
3. **Customiza** según necesites
4. **Elimina** la herencia de BaseRepository

Ejemplo:

```typescript
// ANTES (con BaseRepository)
export class UserRepository extends BaseRepository<User, ...> {
  // 20+ métodos heredados que tal vez no uses
}

// DESPUÉS (independiente)
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    // Código copiado y customizado
  }

  async findByEmail(email: string): Promise<User | null> {
    // Solo lo que necesitas
  }

  // 5-10 métodos que REALMENTE usas
}
```

## Recomendación Final

Para tu proyecto de auditorías:

```typescript
src/
├── shared/
│   └── filters/
│       └── prisma-exception.filter.ts  ← Manejo de errores global
│
├── core/
│   ├── users/
│   │   ├── domain/user.entity.ts       ← Entidad pura
│   │   └── infrastructure/
│   │       └── user.repository.ts      ← Repo independiente simple
│   ├── roles/
│   │   ├── domain/role.entity.ts
│   │   └── infrastructure/
│   │       └── role.repository.ts
│   └── sessions/
│       ├── domain/session.entity.ts
│       └── infrastructure/
│           └── session.repository.ts
```

**Arquitectura:**
```
Controller → Service → Domain Entity → Repository → Prisma
                                            ↓
                                  Exception Filter ← Captura errores
```

## Conclusión

- ✅ **Repositorios Independientes** son más simples y directos
- ✅ **Exception Filter Global** maneja errores en un solo lugar
- ✅ **Prisma ya da type-safety** - no necesitas tanto wrapper
- ✅ Tienes **control total** sin complejidad innecesaria

**Código limpio ≠ Abstracción compleja**

A veces, código simple y directo es MÁS limpio que abstracción prematura. 🎯
