# Guía de AggregateRoot - Campos Técnicos Compartidos

## Resumen

Todos los agregados del dominio heredan de `AggregateRoot` que proporciona campos técnicos comunes y gestión de eventos de dominio.

## Campos Técnicos Heredados

### Campos Automáticos

```typescript
// @shared/domain/aggregate-root.base.ts
export abstract class AggregateRoot {
  protected _id!: string           // Identificador único
  protected _createdAt!: Date      // Fecha de creación
  protected _updatedAt!: Date      // Fecha de última actualización
  protected _deletedAt: Date | null        // Fecha de eliminación lógica
}

// NOTA: El operador ! indica a TypeScript que estos campos serán
// asignados en el constructor de clases hijas (strict mode compatible)
```

### Getters Disponibles

```typescript
user.id          // string
user.createdAt   // Date
user.updatedAt   // Date
user.deletedAt   // Date | null
user.isDeleted   // boolean
```

### Métodos Disponibles

```typescript
// Actualizar timestamp de modificación
protected touch(): void

// Eliminación lógica
user.softDelete()  // Marca como eliminado
user.restore()     // Restaura un elemento eliminado

// Domain Events
user.hasDomainEvents()  // boolean
user.getDomainEvents()  // readonly IEvent[]
user.clearDomainEvents()
```

## Cómo Crear un Nuevo Agregado

### 1. Definir la Entidad

```typescript
// my-entity.ts
import { AggregateRoot } from '@shared/domain/aggregate-root.base'

interface MyEntityConstructorProps {
  // Campos técnicos
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null

  // Campos de negocio
  name: string
  email: string
}

export class MyEntity extends AggregateRoot {
  // ===== CAMPOS DE NEGOCIO SOLAMENTE =====
  // NO incluir: id, createdAt, updatedAt, deletedAt (están en AggregateRoot)

  private _name: string
  private _email: string

  private constructor(props: MyEntityConstructorProps) {
    super()

    // Asignar campos técnicos heredados (asignación directa)
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    // Asignar campos de negocio
    this._name = props.name
    this._email = props.email
  }

  // ===== GETTERS =====
  // id, createdAt, updatedAt, deletedAt, isDeleted → Heredados

  get name(): string {
    return this._name
  }

  get email(): string {
    return this._email
  }

  // ===== MÉTODOS DE NEGOCIO =====

  updateName(newName: string): void {
    this._name = newName
    this.touch() // ← IMPORTANTE: Actualiza updatedAt
    this.addDomainEvent(new MyEntityUpdatedEvent(this._id))
  }

  // ===== FACTORY METHODS =====

  static create(data: { name: string; email: string }): MyEntity {
    const now = new Date()

    return new MyEntity({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      name: data.name,
      email: data.email,
    })
  }

  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    name: string
    email: string
  }): MyEntity {
    return new MyEntity({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      name: data.name,
      email: data.email,
    })
  }
}
```

### 2. Llamar a touch() en Modificaciones

**IMPORTANTE:** Llama `this.touch()` en TODOS los métodos que modifiquen el estado:

```typescript
✅ CORRECTO
updateStatus(status: Status): void {
  this._status = status
  this.touch() // ← Actualiza updatedAt automáticamente
}

❌ INCORRECTO
updateStatus(status: Status): void {
  this._status = status
  // Falta touch() - updatedAt no se actualiza
}
```

### 3. Soft Delete

```typescript
// En lugar de eliminar de BD, marca como eliminado
user.softDelete()

// Verifica si está eliminado
if (user.isDeleted) {
  console.log(`Eliminado el: ${user.deletedAt}`)
}

// Restaurar
user.restore()
```

## Auditoría (createdBy, updatedBy)

Los campos `createdBy` y `updatedBy` se manejan automáticamente en la capa de infraestructura usando `RequestContext`.

### BaseRepository maneja esto automáticamente

```typescript
// BaseRepository.ts
export abstract class BaseRepository {
  protected async create(model: string, data: any) {
    const userId = this.requestContext.getUserId()

    return this.prisma[model].create({
      data: {
        ...data,
        createdBy: userId,    // ← Automático
        updatedBy: userId,    // ← Automático
      }
    })
  }

  protected async update(model: string, where: any, data: any) {
    const userId = this.requestContext.getUserId()

    return this.prisma[model].update({
      where,
      data: {
        ...data,
        updatedBy: userId,    // ← Automático
      }
    })
  }
}
```

### NO necesitas manejar createdBy/updatedBy en el dominio

```typescript
✅ CORRECTO - El dominio NO maneja auditoría de usuario
class User extends AggregateRoot {
  // Solo campos de negocio
  private _name: string
  private _email: string
  // NO incluir createdBy/updatedBy
}

❌ INCORRECTO - No mezclar auditoría técnica con dominio
class User extends AggregateRoot {
  private _name: string
  private _createdBy: string  // ← NO hacer esto
  private _updatedBy: string  // ← NO hacer esto
}
```

## Prisma Schema

```prisma
model User {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  createdBy String?   @map("created_by")
  updatedBy String?   @map("updated_by")

  // Campos de negocio
  name  String
  email String @unique

  @@map("users")
}
```

## Resumen de Responsabilidades

| Campo | Dónde se define | Dónde se asigna | Quién lo maneja |
|-------|----------------|-----------------|-----------------|
| `id` | AggregateRoot | Entity constructor | Dominio (crypto.randomUUID()) |
| `createdAt` | AggregateRoot | Entity.create() | Dominio (new Date()) |
| `updatedAt` | AggregateRoot | touch() | Dominio (this.touch()) |
| `deletedAt` | AggregateRoot | softDelete() | Dominio (user.softDelete()) |
| `createdBy` | Prisma Schema | BaseRepository | Infraestructura (RequestContext) |
| `updatedBy` | Prisma Schema | BaseRepository | Infraestructura (RequestContext) |

## Ventajas de este Enfoque

✅ **Separación de Responsabilidades**
- Dominio: Lógica de negocio pura
- Infraestructura: Aspectos técnicos (auditoría, persistencia)

✅ **DRY (Don't Repeat Yourself)**
- No repites campos técnicos en cada entidad
- Métodos comunes compartidos

✅ **Consistencia**
- Todas las entidades tienen los mismos campos base
- Comportamiento uniforme (soft delete, timestamps)

✅ **Testeable**
- Dominio no depende de infraestructura
- Fácil de hacer unit tests

✅ **Escalable**
- Agregar nuevos agregados es simple
- Cambios en campos técnicos se hacen una vez

✅ **TypeScript Strict Mode Compatible**
- Usa definite assignment assertion (`!`) para campos asignados por clases hijas
- Sin hacks ni workarounds (no Object.defineProperty)
- Type-safe y mantenible

## Ejemplo Completo: User

Ver `/src/core/users/domain/user.ts` para un ejemplo completo de implementación.

```typescript
export class User extends AggregateRoot {
  // Campos de negocio
  private _names: PersonName
  private _email: Email
  // ... más campos

  // Constructor asigna campos técnicos + negocio
  private constructor(props: UserConstructorProps) {
    super()
    // Asignación directa - simple y limpia
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    this._names = props.names
    this._email = props.email
    // ...
  }

  // Métodos llaman a touch()
  update(data: UpdateUserData): void {
    if (data.names) this._names = PersonName.create(data.names)
    if (data.email) this._email = Email.create(data.email)

    this.touch() // ← Actualiza updatedAt
    this.addDomainEvent(new UserUpdatedEvent(...))
  }

  // Soft delete heredado
  // user.softDelete() ya está disponible
}
```
