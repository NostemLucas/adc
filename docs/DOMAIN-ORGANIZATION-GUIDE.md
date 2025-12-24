# Guía de Organización de Dominios DDD

## 📋 Estructura Estándar de Dominio

Basada en el módulo `users` como referencia profesional.

```
src/core/{module-name}/
├── domain/
│   ├── constants/              # Enums y constantes del dominio
│   │   ├── index.ts
│   │   └── {entity}-status.enum.ts
│   ├── events/                 # Domain Events (Event Sourcing)
│   │   ├── index.ts
│   │   ├── {entity}-created.event.ts
│   │   ├── {entity}-updated.event.ts
│   │   └── {entity}-deleted.event.ts
│   ├── exceptions/             # Excepciones de dominio
│   │   ├── index.ts
│   │   ├── domain.exception.ts
│   │   └── {entity}.exceptions.ts
│   ├── repositories/           # Repository Interfaces (Ports)
│   │   ├── index.ts
│   │   ├── tokens.ts
│   │   └── {entity}.repository.interface.ts
│   ├── services/               # Domain Services
│   │   ├── index.ts
│   │   └── {domain-service}.ts
│   ├── value-objects/          # Value Objects
│   │   ├── index.ts
│   │   ├── README.md
│   │   └── {field-name}.vo.ts
│   ├── {entity}.entity.ts      # Entidad principal
│   └── {entity}.entity.spec.ts # Tests unitarios
├── application/                # Casos de Uso (CQRS)
│   ├── commands/               # Comandos (Create, Update, Delete)
│   ├── queries/                # Consultas (Get, List)
│   └── dto/                    # DTOs de aplicación
├── infrastructure/             # Adaptadores
│   ├── {entity}.repository.ts  # Implementación del repositorio
│   └── index.ts
├── {module}.controller.ts      # Controlador HTTP
└── {module}.module.ts          # Módulo NestJS
```

## 🎯 Entidad de Dominio - Patrón Ideal

### ✅ Características Clave

1. **Campos Privados** con prefijo `_`
2. **Constructor Privado** con Parameter Object Pattern
3. **Value Objects** para validaciones
4. **Factory Methods** (create, fromPersistence)
5. **Domain Events** para integración
6. **Getters Públicos** para acceso controlado
7. **Métodos de Comportamiento** (lógica de negocio)
8. **Inmutabilidad** protegida (defensive copy)

### 📝 Plantilla de Entidad

```typescript
import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { {Entity}CreatedEvent, {Entity}UpdatedEvent, {Entity}DeletedEvent } from './events'
import { {Field}VO } from './value-objects'
import crypto from 'crypto'

// ===== TIPOS PARA CONSTRUCTOR =====
interface {Entity}ConstructorProps {
  id: string
  createdAt: Date
  updatedAt: Date
  // ... campos requeridos (Value Objects)
  deletedAt?: Date | null
  // ... campos opcionales
}

// ===== TIPOS PARA FACTORY METHODS =====
interface Create{Entity}Data {
  // Campos primitivos (string, number, etc)
  field1: string
  field2: number
  field3?: string | null
}

export class {Entity} extends AggregateRoot {
  // ===== CAMPOS PRIVADOS =====
  private readonly _id: string
  private readonly _createdAt: Date
  private readonly _updatedAt: Date
  private _deletedAt: Date | null
  private _field1: Field1VO  // Value Object
  private _field2: number

  // ===== CONSTRUCTOR PRIVADO CON PARAMETER OBJECT =====
  private constructor(props: {Entity}ConstructorProps) {
    super()
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._field1 = props.field1
    this._field2 = props.field2
    this._deletedAt = props.deletedAt ?? null
  }

  // ===== GETTERS PÚBLICOS =====
  get id(): string {
    return this._id
  }

  get field1(): Field1VO {
    return this._field1
  }

  // ===== GETTERS COMPUTADOS =====
  get isActive(): boolean {
    return this._deletedAt === null
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====
  updateField1(newValue: string): void {
    this._field1 = Field1VO.create(newValue)
    // Emitir evento si es necesario
  }

  // ===== FACTORY METHOD: CREATE =====
  static create(data: Create{Entity}Data): {Entity} {
    // Validaciones
    {Entity}.validateRequiredFields(data)

    const now = new Date()

    return new {Entity}({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      field1: Field1VO.create(data.field1),
      field2: data.field2,
      deletedAt: null,
    })
  }

  // ===== FACTORY METHOD: FROM PERSISTENCE =====
  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    field1: string
    field2: number
  }): {Entity} {
    return new {Entity}({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      field1: Field1VO.create(data.field1),
      field2: data.field2,
      deletedAt: data.deletedAt || null,
    })
  }

  // ===== MÉTODO UPDATE =====
  update(data: {
    field1?: string
    field2?: number
  }): void {
    if (data.field1 !== undefined) {
      this._field1 = Field1VO.create(data.field1)
    }

    if (data.field2 !== undefined) {
      this._field2 = data.field2
    }

    // Emitir evento
    const updatedFields = Object.keys(data)
    this.addDomainEvent(
      new {Entity}UpdatedEvent(
        this._id,
        updatedFields,
        new Date(),
      ),
    )
  }

  // ===== EVENTOS DE DOMINIO =====
  markAsCreated(): void {
    this.addDomainEvent(
      new {Entity}CreatedEvent(
        this._id,
        this._createdAt,
      ),
    )
  }

  markAsDeleted(): void {
    this._deletedAt = new Date()

    this.addDomainEvent(
      new {Entity}DeletedEvent(
        this._id,
        this._deletedAt,
      ),
    )
  }

  // ===== VALIDACIONES PRIVADAS =====
  private static validateRequiredFields(data: Create{Entity}Data): void {
    if (!data.field1?.trim()) {
      throw new EmptyFieldException('field1')
    }
  }
}
```

## 📦 Value Objects

### Plantilla de Value Object

```typescript
import { Invalid{Field}Exception } from '../exceptions'

export class {Field}VO {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string | null | undefined): {Field}VO | null {
    // Permitir null/undefined si es opcional
    if (value === null || value === undefined) {
      return null
    }

    const trimmed = value.trim()

    // Validaciones
    if (!trimmed) {
      throw new Invalid{Field}Exception('El campo no puede estar vacío')
    }

    if (trimmed.length < MIN_LENGTH) {
      throw new Invalid{Field}Exception(`Mínimo ${MIN_LENGTH} caracteres`)
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Invalid{Field}Exception(`Máximo ${MAX_LENGTH} caracteres`)
    }

    // Validación específica (regex, formato, etc)
    if (!PATTERN.test(trimmed)) {
      throw new Invalid{Field}Exception('Formato inválido')
    }

    return new {Field}VO(trimmed)
  }

  getValue(): string {
    return this.value
  }

  equals(other: {Field}VO): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

## 🎯 Eventos de Dominio

### Plantilla de Event

```typescript
import { DomainEvent } from '@shared/domain/domain-event.base'

export class {Entity}CreatedEvent extends DomainEvent {
  constructor(
    public readonly entityId: string,
    public readonly field1: string,
    public readonly field2: string,
    occurredOn: Date,
  ) {
    super(entityId, occurredOn)
  }

  getEventName(): string {
    return '{entity}.created'
  }
}
```

## ⚠️ Excepciones de Dominio

### domain.exception.ts

```typescript
export class DomainException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainException'
  }
}
```

### {entity}.exceptions.ts

```typescript
import { DomainException } from './domain.exception'

export class EmptyFieldException extends DomainException {
  constructor(fieldName: string) {
    super(`El campo ${fieldName} no puede estar vacío`)
    this.name = 'EmptyFieldException'
  }
}

export class Invalid{Field}Exception extends DomainException {
  constructor(message: string) {
    super(message)
    this.name = 'Invalid{Field}Exception'
  }
}
```

## 🔌 Repository Interface (Port)

### {entity}.repository.interface.ts

```typescript
import { {Entity} } from '../{entity}.entity'

export interface I{Entity}Repository {
  findById(id: string): Promise<{Entity} | null>
  findByIdOrFail(id: string): Promise<{Entity}>
  create(entity: {Entity}): Promise<{Entity}>
  update(entity: {Entity}): Promise<{Entity}>
  save(entity: {Entity}): Promise<{Entity}>
  delete(id: string): Promise<void>

  // Métodos de búsqueda específicos
  findByField(field: string): Promise<{Entity} | null>
  existsByField(field: string, excludeId?: string): Promise<boolean>
}
```

### tokens.ts

```typescript
export const {ENTITY}_REPOSITORY = Symbol('I{Entity}Repository')
```

## ✅ Checklist de Migración

### Fase 1: Estructura de Carpetas
- [ ] Crear `domain/constants/`
- [ ] Crear `domain/events/`
- [ ] Crear `domain/exceptions/`
- [ ] Crear `domain/repositories/`
- [ ] Crear `domain/value-objects/`

### Fase 2: Refactorización de Entidad
- [ ] Cambiar campos públicos a privados con `_`
- [ ] Implementar Parameter Object Pattern en constructor
- [ ] Crear Value Objects para campos que requieren validación
- [ ] Agregar getters públicos
- [ ] Implementar métodos de comportamiento
- [ ] Agregar eventos de dominio

### Fase 3: Excepciones y Validaciones
- [ ] Crear excepciones de dominio específicas
- [ ] Mover validaciones de factory methods a Value Objects
- [ ] Implementar validaciones en métodos de comportamiento

### Fase 4: Repository Interface
- [ ] Crear interfaz de repositorio en domain
- [ ] Crear token de inyección
- [ ] Actualizar implementación en infrastructure

### Fase 5: Tests
- [ ] Crear tests unitarios para entidad
- [ ] Crear tests para Value Objects
- [ ] Crear tests para eventos

## 🚀 Beneficios

1. **Encapsulación**: Campos privados protegen invariantes
2. **Validación**: Value Objects centralizan reglas de negocio
3. **Mantenibilidad**: Parameter Object Pattern facilita cambios
4. **Testabilidad**: Entidades puras sin dependencias
5. **Inmutabilidad**: Defensive copy previene modificaciones
6. **Eventos**: Integración desacoplada entre módulos
7. **Clean Architecture**: Repository interface (Port) en dominio

## 📚 Ejemplo Real: User Entity

Ver: `src/core/users/domain/user.entity.ts`

Características implementadas:
- ✅ 8 Value Objects (Email, Username, CI, Phone, PersonName, Address, ImageUrl, HashedPassword)
- ✅ Parameter Object Pattern (17 campos → 1 objeto)
- ✅ 3 Domain Events (Created, Updated, Deleted)
- ✅ 6 Excepciones de dominio
- ✅ Repository Interface con 10+ métodos
- ✅ Domain Service (UserUniquenessValidator)
- ✅ 52 tests unitarios pasando

## 🔄 Orden de Refactorización Recomendado

1. **Roles** (más simple, buen punto de partida)
2. **Sessions** (similar complejidad a Roles)
3. **Menus** (más complejo, constructor con 11 params)
4. **Permissions** (si es necesario)
5. **Notifications** (si es necesario)
