# Ejemplo Práctico: Sistema de Transacciones

Este documento muestra un ejemplo real de cómo usar el sistema de transacciones con contexto CLS.

## Escenario: Crear Usuario con Roles y Auditoría

Queremos asegurar que cuando creamos un usuario:
1. Se cree el usuario en la BD
2. Se asignen sus roles
3. Se registre la acción en auditoría

**Todo debe ser atómico**: si algo falla, se revierte todo.

## Paso 1: Migrar Repositorios

### UserRepository

```typescript
import { Injectable } from '@nestjs/common'
import { BaseRepository, TransactionContext } from '@shared/database'
import { User } from '../domain/user.entity'

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(transactionContext: TransactionContext) {
    super(transactionContext)
  }

  async create(user: User): Promise<User> {
    // this.prisma usa automáticamente la transacción del contexto
    const created = await this.prisma.user.create({
      data: {
        names: user.names,
        lastNames: user.lastNames,
        email: user.email,
        username: user.username,
        password: user.password,
        ci: user.ci,
        status: user.status,
        roles: {
          connect: user.roles.map((role) => ({ id: role.id })),
        },
      },
      include: { roles: true },
    })

    return User.fromPersistence(created)
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    })

    return user ? User.fromPersistence(user) : null
  }
}
```

### AuditLogRepository

```typescript
import { Injectable } from '@nestjs/common'
import { BaseRepository, TransactionContext } from '@shared/database'

interface AuditLogData {
  action: string
  userId: string
  performedBy: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class AuditLogRepository extends BaseRepository {
  constructor(transactionContext: TransactionContext) {
    super(transactionContext)
  }

  async log(data: AuditLogData): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId,
        performedBy: data.performedBy,
        metadata: data.metadata,
        timestamp: new Date(),
      },
    })
  }
}
```

## Paso 2: Implementar Use Case con Transacción

### Opción A: Usando el Decorador @Transactional (Recomendado)

```typescript
import { Injectable, ConflictException } from '@nestjs/common'
import { Transactional, TransactionContext } from '@shared/database'
import { UserRepository } from '../infrastructure/user.repository'
import { AuditLogRepository } from '../../audit/infrastructure/audit-log.repository'
import { RoleRepository } from '../../roles/infrastructure/role.repository'
import { User } from '../domain/user.entity'
import { CreateUserDto } from '../dto/create-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly transactionContext: TransactionContext, // IMPORTANTE
  ) {}

  @Transactional()
  async execute(dto: CreateUserDto, createdBy: string): Promise<User> {
    // 1. Validar que el email no exista
    const existingUser = await this.userRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new ConflictException('El email ya está registrado')
    }

    // 2. Obtener los roles
    const roles = await this.roleRepository.findByIds(dto.roleIds)
    if (roles.length !== dto.roleIds.length) {
      throw new ConflictException('Algunos roles no existen')
    }

    // 3. Crear el usuario
    const hashedPassword = await bcrypt.hash(dto.password, 10)
    const user = User.create({
      names: dto.names,
      lastNames: dto.lastNames,
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      ci: dto.ci,
      status: 'ACTIVE',
      roles,
    })

    const createdUser = await this.userRepository.create(user)

    // 4. Registrar en auditoría
    await this.auditLogRepository.log({
      action: 'USER_CREATED',
      userId: createdUser.id,
      performedBy: createdBy,
      metadata: {
        email: createdUser.email,
        username: createdUser.username,
        roleIds: dto.roleIds,
      },
    })

    // Si algo falla en cualquier punto, TODO se revierte automáticamente
    return createdUser
  }
}
```

### Opción B: Usando runInTransaction Directamente

```typescript
import { Injectable, ConflictException } from '@nestjs/common'
import { TransactionContext } from '@shared/database'
import { UserRepository } from '../infrastructure/user.repository'
import { AuditLogRepository } from '../../audit/infrastructure/audit-log.repository'
import { User } from '../domain/user.entity'
import { CreateUserDto } from '../dto/create-user.dto'

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly transactionContext: TransactionContext,
  ) {}

  async execute(dto: CreateUserDto, createdBy: string): Promise<User> {
    return this.transactionContext.runInTransaction(async () => {
      // Validar email
      const existingUser = await this.userRepository.findByEmail(dto.email)
      if (existingUser) {
        throw new ConflictException('El email ya está registrado')
      }

      // Crear usuario
      const user = User.create({ ...dto })
      const createdUser = await this.userRepository.create(user)

      // Registrar auditoría
      await this.auditLogRepository.log({
        action: 'USER_CREATED',
        userId: createdUser.id,
        performedBy: createdBy,
      })

      return createdUser
    })
  }
}
```

## Paso 3: Usar en el Controller

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@core/auth/decorators/current-user.decorator'
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case'
import { CreateUserDto } from '../application/dto/create-user.dto'
import { User } from '../domain/user.entity'

@Controller('users')
export class UsersController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.createUserUseCase.execute(dto, currentUser.id)
  }
}
```

## ¿Qué pasa cuando falla?

### Caso 1: Email duplicado

```typescript
// Request
POST /users
{
  "email": "existing@example.com", // Email que ya existe
  "username": "john",
  "password": "password123",
  "roleIds": ["role-1"]
}

// Respuesta
409 Conflict
{
  "statusCode": 409,
  "message": "El email ya está registrado"
}

// Estado de BD: Sin cambios (no se creó nada)
```

### Caso 2: Rol inválido

```typescript
// Request
POST /users
{
  "email": "new@example.com",
  "username": "john",
  "password": "password123",
  "roleIds": ["invalid-role-id"] // Rol que no existe
}

// Se ejecuta:
// 1. ✅ Validación de email (pasa)
// 2. ❌ Validación de roles (falla)

// Respuesta
409 Conflict
{
  "statusCode": 409,
  "message": "Algunos roles no existen"
}

// Estado de BD: Sin cambios (rollback automático)
```

### Caso 3: Error en auditoría

```typescript
// Suponiendo que la tabla de auditoría tiene un problema
// Request
POST /users
{
  "email": "new@example.com",
  "username": "john",
  "password": "password123",
  "roleIds": ["role-1"]
}

// Se ejecuta:
// 1. ✅ Validación de email (pasa)
// 2. ✅ Validación de roles (pasa)
// 3. ✅ Creación de usuario (pasa)
// 4. ❌ Log de auditoría (falla - constraint violation)

// Respuesta
500 Internal Server Error
{
  "statusCode": 500,
  "message": "Error interno del servidor"
}

// Estado de BD: Sin cambios
// ⚠️ IMPORTANTE: El usuario NO se creó gracias a la transacción
// Todo se revirtió automáticamente
```

## Ejemplo Avanzado: Transacciones Anidadas

```typescript
@Injectable()
export class UpdateUserRolesUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly transactionContext: TransactionContext,
  ) {}

  @Transactional()
  async execute(userId: string, newRoleIds: string[], updatedBy: string): Promise<User> {
    // Esta es una transacción de nivel superior

    const user = await this.userRepository.findByIdOrFail(userId)
    const newRoles = await this.roleRepository.findByIds(newRoleIds)

    // Actualizar roles
    user.updateRoles(newRoles)
    const updatedUser = await this.userRepository.update(user)

    // Registrar en auditoría
    await this.auditLogRepository.log({
      action: 'USER_ROLES_UPDATED',
      userId: user.id,
      performedBy: updatedBy,
      metadata: {
        oldRoleIds: user.roles.map(r => r.id),
        newRoleIds,
      },
    })

    return updatedUser
  }
}

@Injectable()
export class BulkUpdateUserRolesUseCase {
  constructor(
    private readonly updateUserRolesUseCase: UpdateUserRolesUseCase,
    private readonly transactionContext: TransactionContext,
  ) {}

  @Transactional()
  async execute(updates: Array<{ userId: string; roleIds: string[] }>, updatedBy: string): Promise<void> {
    // Esta transacción envuelve múltiples llamadas a updateUserRolesUseCase

    for (const update of updates) {
      // Aunque UpdateUserRolesUseCase tiene @Transactional,
      // usa la misma transacción del contexto actual
      await this.updateUserRolesUseCase.execute(
        update.userId,
        update.roleIds,
        updatedBy,
      )
    }

    // Si alguna actualización falla, TODAS se revierten
  }
}
```

## Logs de Debug

Para ver las transacciones en acción:

```typescript
@Transactional()
async execute(dto: CreateUserDto, createdBy: string): Promise<User> {
  console.log('🔵 Iniciando transacción...')
  console.log('🔍 En transacción:', this.transactionContext.isInTransaction())

  const user = await this.userRepository.create(User.create(dto))
  console.log('✅ Usuario creado:', user.id)

  await this.auditLogRepository.log({
    action: 'USER_CREATED',
    userId: user.id,
    performedBy: createdBy,
  })
  console.log('✅ Auditoría registrada')

  console.log('🟢 Transacción completada con éxito')
  return user
}
```

Output en consola:
```
🔵 Iniciando transacción...
🔍 En transacción: true
✅ Usuario creado: 123e4567-e89b-12d3-a456-426614174000
✅ Auditoría registrada
🟢 Transacción completada con éxito
```

## Preguntas Frecuentes

**P: ¿Qué pasa si olvido inyectar TransactionContext?**

R: El decorador `@Transactional()` lanzará un error en runtime indicando qué clase necesita la inyección.

**P: ¿Puedo mezclar operaciones transaccionales y no transaccionales?**

R: Sí, los repositorios que extienden BaseRepository funcionan tanto dentro como fuera de transacciones.

**P: ¿Las transacciones afectan el performance?**

R: El overhead de AsyncLocalStorage es mínimo (<1%). Las transacciones de BD tienen más impacto, pero son necesarias para consistencia.

**P: ¿Puedo usar esto con otros ORMs?**

R: El patrón de AsyncLocalStorage funciona con cualquier ORM. Solo necesitas adaptar BaseRepository.
