# Sistema de Transacciones con Contexto (CLS)

Sistema de transacciones para Prisma usando **AsyncLocalStorage** (Continuation Local Storage), permitiendo transacciones automáticas sin necesidad de pasar explícitamente el cliente transaccional entre métodos.

## 🎯 Ventajas

- **Sin acoplamiento**: No necesitas pasar la transacción como parámetro
- **Automático**: Los repositorios usan la transacción del contexto automáticamente
- **Type-safe**: Todo está completamente tipado
- **Clean Architecture**: Mantiene la separación de capas
- **Simple**: Uso intuitivo con decoradores o métodos directos

## 📦 Componentes

### 1. TransactionContext

Servicio que maneja el contexto de transacciones usando AsyncLocalStorage.

```typescript
import { TransactionContext } from '@shared/database'
```

### 2. BaseRepository

Clase base para repositorios que provee acceso automático al contexto transaccional.

```typescript
import { BaseRepository } from '@shared/database'
```

### 3. @Transactional Decorator

Decorador para ejecutar métodos dentro de una transacción.

```typescript
import { Transactional } from '@shared/database'
```

## 🚀 Uso

### Opción 1: Usando el Decorador @Transactional (Recomendado)

El decorador es la forma más limpia y declarativa.

```typescript
import { Injectable } from '@nestjs/common'
import { TransactionContext, Transactional } from '@shared/database'
import { UserRepository } from '../infrastructure/user.repository'
import { RoleRepository } from '../../roles/infrastructure/role.repository'

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly transactionContext: TransactionContext, // IMPORTANTE: Debe inyectarse
  ) {}

  @Transactional()
  async execute(dto: CreateUserDto): Promise<User> {
    // Todo dentro de este método se ejecuta en una transacción
    const user = await this.userRepository.create({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
    })

    // Asignar roles
    await this.roleRepository.assignToUser(dto.roleIds, user.id)

    // Si algo falla aquí, todo se revierte automáticamente
    return user
  }
}
```

### Opción 2: Usando runInTransaction Directamente

Para casos donde necesitas más control o lógica dinámica.

```typescript
import { Injectable } from '@nestjs/common'
import { TransactionContext } from '@shared/database'
import { UserRepository } from '../infrastructure/user.repository'
import { AuditRepository } from '../../audit/infrastructure/audit.repository'

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditRepository: AuditRepository,
    private readonly transactionContext: TransactionContext,
  ) {}

  async execute(userId: string, deletedBy: string): Promise<void> {
    await this.transactionContext.runInTransaction(async () => {
      // Eliminar usuario
      await this.userRepository.softDelete(userId)

      // Registrar en auditoría
      await this.auditRepository.log({
        action: 'USER_DELETED',
        userId,
        deletedBy,
        timestamp: new Date(),
      })

      // Si algo falla, todo se revierte
    })
  }
}
```

### Opción 3: Transacciones Anidadas

Las transacciones anidadas se manejan automáticamente - solo se crea una transacción en el nivel superior.

```typescript
@Injectable()
export class ComplexBusinessLogic {
  constructor(
    private readonly userUseCase: CreateUserUseCase, // Tiene @Transactional
    private readonly notificationService: NotificationService,
    private readonly transactionContext: TransactionContext,
  ) {}

  @Transactional()
  async execute(data: ComplexData): Promise<Result> {
    // Esta transacción envuelve todo
    const user = await this.userUseCase.execute(data.userData)
    // ↑ Aunque CreateUserUseCase también tiene @Transactional,
    //   usa la misma transacción del contexto actual

    await this.notificationService.send(user.email)

    return { user }
  }
}
```

## 📝 Migrar Repositorios Existentes

### Antes (Sin contexto de transacciones)

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@shared/database'
import { User } from '../domain/user.entity'

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    const prismaUser = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
      },
    })
    return User.fromPersistence(prismaUser)
  }
}
```

### Después (Con contexto de transacciones)

```typescript
import { Injectable } from '@nestjs/common'
import { BaseRepository, TransactionContext } from '@shared/database'
import { User } from '../domain/user.entity'

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(transactionContext: TransactionContext) {
    super(transactionContext)
  }

  async create(data: CreateUserData): Promise<User> {
    // this.prisma usa automáticamente la transacción del contexto si existe
    const prismaUser = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
      },
    })
    return User.fromPersistence(prismaUser)
  }
}
```

**Cambios necesarios:**

1. Extender `BaseRepository` en lugar de inyectar `PrismaService`
2. Inyectar `TransactionContext` en el constructor
3. Llamar a `super(transactionContext)`
4. ¡Eso es todo! Ahora el repositorio participa automáticamente en transacciones

## 🔍 Verificar si Estás en una Transacción

En casos raros donde necesitas saber si estás dentro de una transacción:

```typescript
@Injectable()
export class UserRepository extends BaseRepository {
  async create(data: CreateUserData): Promise<User> {
    if (this.isInTransaction) {
      console.log('Ejecutando dentro de una transacción')
    }

    const prismaUser = await this.prisma.user.create({ data })
    return User.fromPersistence(prismaUser)
  }
}
```

## ⚠️ Notas Importantes

### 1. Inyección de TransactionContext Obligatoria

Para usar el decorador `@Transactional()`, **debes** inyectar `TransactionContext` en el constructor:

```typescript
// ✅ CORRECTO
constructor(
  private readonly userRepository: UserRepository,
  private readonly transactionContext: TransactionContext, // IMPORTANTE
) {}

// ❌ INCORRECTO - El decorador lanzará un error
constructor(
  private readonly userRepository: UserRepository,
) {}
```

### 2. Métodos Async

Los métodos con `@Transactional()` **deben** ser async:

```typescript
// ✅ CORRECTO
@Transactional()
async execute(dto: CreateUserDto): Promise<User> {
  // ...
}

// ❌ INCORRECTO
@Transactional()
execute(dto: CreateUserDto): User {
  // ...
}
```

### 3. Manejo de Errores

Si lanzas un error dentro de una transacción, se hace rollback automáticamente:

```typescript
@Transactional()
async execute(dto: CreateUserDto): Promise<User> {
  const user = await this.userRepository.create(dto)

  if (someCondition) {
    // Esto hará rollback de la creación del usuario
    throw new BadRequestException('Condición inválida')
  }

  return user
}
```

### 4. Operaciones No Transaccionales

Si necesitas ejecutar algo fuera de la transacción, hazlo **antes** o **después**:

```typescript
@Transactional()
async execute(dto: CreateUserDto): Promise<User> {
  // Dentro de transacción
  const user = await this.userRepository.create(dto)
  await this.roleRepository.assignToUser(dto.roleIds, user.id)
  return user
}

async sendWelcomeEmail(user: User): Promise<void> {
  // Fuera de transacción - ejecutar después de commit
  await this.emailService.send(user.email, 'Bienvenido!')
}
```

## 🎓 Ejemplo Completo: Flujo de Creación de Usuario

```typescript
// ========== DOMAIN ==========
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
  ) {}

  static fromPersistence(data: PrismaUser): User {
    return new User(data.id, data.email, data.username)
  }
}

// ========== INFRASTRUCTURE ==========
@Injectable()
export class UserRepository extends BaseRepository {
  constructor(transactionContext: TransactionContext) {
    super(transactionContext)
  }

  async create(data: CreateUserData): Promise<User> {
    const prismaUser = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
      },
    })
    return User.fromPersistence(prismaUser)
  }
}

@Injectable()
export class RoleRepository extends BaseRepository {
  constructor(transactionContext: TransactionContext) {
    super(transactionContext)
  }

  async assignToUser(roleIds: string[], userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: roleIds.map((id) => ({ id })),
        },
      },
    })
  }
}

// ========== APPLICATION ==========
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly transactionContext: TransactionContext,
  ) {}

  @Transactional()
  async execute(dto: CreateUserDto): Promise<User> {
    // 1. Crear usuario
    const user = await this.userRepository.create({
      email: dto.email,
      username: dto.username,
      password: await hash(dto.password),
    })

    // 2. Asignar roles
    await this.roleRepository.assignToUser(dto.roleIds, user.id)

    // 3. Si algo falla aquí, TODO se revierte automáticamente
    return user
  }
}

// ========== CONTROLLER ==========
@Controller('users')
export class UsersController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto)
  }
}
```

## 🔧 Debugging

Para ver si las transacciones están funcionando, puedes agregar logs:

```typescript
@Transactional()
async execute(dto: CreateUserDto): Promise<User> {
  console.log('Iniciando transacción...')

  const user = await this.userRepository.create(dto)
  console.log('Usuario creado:', user.id)

  await this.roleRepository.assignToUser(dto.roleIds, user.id)
  console.log('Roles asignados')

  console.log('Transacción completada con éxito')
  return user
}
```

## 📚 Recursos Adicionales

- [AsyncLocalStorage Node.js Docs](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)

## ❓ Preguntas Frecuentes

### ¿Puedo mezclar @Transactional() con runInTransaction()?

Sí, son compatibles. El decorador internamente usa `runInTransaction()`.

### ¿Qué pasa si no uso BaseRepository?

Tus repositorios no participarán en las transacciones del contexto. Necesitas usar `BaseRepository` o implementar el patrón manualmente.

### ¿Funciona con Prisma 7?

Sí, es completamente compatible con Prisma 7.

### ¿Hay overhead de performance?

AsyncLocalStorage tiene un overhead mínimo. En la mayoría de aplicaciones es imperceptible.
