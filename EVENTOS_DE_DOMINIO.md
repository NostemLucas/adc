# Eventos de Dominio - Guía de Implementación

Esta guía explica cómo funcionan los eventos de dominio implementados en el módulo de usuarios.

## ¿Qué son los Eventos de Dominio?

Los eventos de dominio son parte del patrón **Domain-Driven Design (DDD)**. Representan **hechos que ya ocurrieron** en el dominio y que pueden desencadenar acciones adicionales en el sistema.

### Beneficios:

- **Desacoplamiento**: Las acciones secundarias (enviar emails, logs, etc.) no están en la lógica principal
- **Auditoría**: Registro automático de todos los cambios importantes
- **Extensibilidad**: Fácil agregar nueva funcionalidad sin modificar código existente
- **Arquitectura limpia**: Separa las responsabilidades del negocio

---

## Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                      FLUJO DE EVENTOS                        │
└─────────────────────────────────────────────────────────────┘

1. COMANDO                    CreateUserCommand
   ↓
2. COMMAND HANDLER           CreateUserHandler.execute()
   ↓
3. ENTIDAD DE DOMINIO        User.create() → user instance
   ↓
4. PERSISTENCIA              userRepository.save(user)
   ↓
5. EMISIÓN DE EVENTO         user.markAsCreated()
   ↓                         → Añade UserCreatedEvent a la cola
6. PUBLICACIÓN               eventBus.publish(event)
   ↓
7. EVENT HANDLERS            UserCreatedHandler.handle()
   ↓                         → Envía email, registra log, etc.
8. LIMPIAR EVENTOS           user.clearDomainEvents()
```

---

## Estructura de Archivos

```
src/
├── shared/
│   └── domain/
│       └── aggregate-root.base.ts          # Clase base para agregados
│
└── core/
    └── users/
        ├── domain/
        │   ├── events/                      # 📢 EVENTOS DE DOMINIO
        │   │   ├── user-created.event.ts
        │   │   ├── user-updated.event.ts
        │   │   ├── user-deleted.event.ts
        │   │   └── index.ts
        │   └── user.entity.ts               # Extiende AggregateRoot
        │
        └── application/
            ├── commands/
            │   ├── create-user/
            │   │   └── create-user.handler.ts  # Publica eventos
            │   ├── update-user/
            │   │   └── update-user.handler.ts  # Publica eventos
            │   └── delete-user/
            │       └── delete-user.handler.ts  # Publica eventos
            │
            └── event-handlers/              # 🎯 MANEJADORES DE EVENTOS
                ├── user-created.handler.ts
                ├── user-updated.handler.ts
                ├── user-deleted.handler.ts
                └── index.ts
```

---

## 1. Clase Base: AggregateRoot

**Ubicación**: `src/shared/domain/aggregate-root.base.ts`

```typescript
export abstract class AggregateRoot {
  private _domainEvents: IEvent[] = []

  // Obtener eventos pendientes
  get domainEvents(): IEvent[] {
    return this._domainEvents
  }

  // Añadir un evento a la cola
  protected addDomainEvent(event: IEvent): void {
    this._domainEvents.push(event)
  }

  // Limpiar eventos después de publicarlos
  clearDomainEvents(): void {
    this._domainEvents = []
  }
}
```

**Responsabilidades**:
- Mantener una cola de eventos de dominio no publicados
- Proporcionar métodos para añadir y limpiar eventos

---

## 2. Eventos de Dominio

**Ubicación**: `src/core/users/domain/events/`

### UserCreatedEvent

```typescript
export class UserCreatedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly fullName: string,
    public readonly roles: string[],
    public readonly createdAt: Date,
  ) {}
}
```

**Características**:
- ✅ Inmutable (todos los campos son `readonly`)
- ✅ Nombre en pasado (`UserCreated`, no `CreateUser`)
- ✅ Contiene toda la información relevante del evento
- ✅ Implementa `IEvent` de `@nestjs/cqrs`

---

## 3. Entidad User (Aggregate Root)

**Ubicación**: `src/core/users/domain/user.entity.ts`

```typescript
export class User extends AggregateRoot {
  // ... propiedades ...

  // Método para marcar como creado y emitir evento
  markAsCreated(): void {
    this.addDomainEvent(
      new UserCreatedEvent(
        this.id,
        this.email.getValue(),
        this.username,
        this.fullName,
        this.roles.map((r) => r.name),
        this.createdAt,
      ),
    )
  }

  // El método update() automáticamente emite UserUpdatedEvent
  update(data: { ... }): void {
    // ... lógica de actualización ...

    this.addDomainEvent(
      new UserUpdatedEvent(
        this.id,
        this.email.getValue(),
        this.username,
        this.fullName,
        Object.keys(data),
        new Date(),
      ),
    )
  }

  // Método para marcar como eliminado y emitir evento
  markAsDeleted(): void {
    this.deactivate()
    this.deletedAt = new Date()

    this.addDomainEvent(
      new UserDeletedEvent(
        this.id,
        this.email.getValue(),
        this.username,
        this.deletedAt,
      ),
    )
  }
}
```

---

## 4. Command Handler (Publicador de Eventos)

**Ubicación**: `src/core/users/application/commands/create-user/create-user.handler.ts`

```typescript
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
    private readonly eventBus: EventBus,  // 👈 Inyectar EventBus
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // ... lógica de negocio ...

    // 1. Crear entidad
    const user = User.create({ ... })

    // 2. Persistir
    const savedUser = await this.userRepository.save(user)

    // 3. Marcar como creado (añade evento a la cola)
    savedUser.markAsCreated()

    // 4. Publicar eventos
    savedUser.domainEvents.forEach((event) => this.eventBus.publish(event))

    // 5. Limpiar eventos
    savedUser.clearDomainEvents()

    return savedUser
  }
}
```

**Flujo**:
1. Crear y persistir la entidad
2. Llamar a `markAsCreated()` para emitir el evento
3. Publicar todos los eventos usando `EventBus`
4. Limpiar los eventos de la entidad

---

## 5. Event Handlers (Consumidores de Eventos)

**Ubicación**: `src/core/users/application/event-handlers/user-created.handler.ts`

```typescript
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(UserCreatedHandler.name)

  async handle(event: UserCreatedEvent): Promise<void> {
    this.logger.log(
      `[DOMAIN EVENT] Usuario creado: ${event.fullName} (${event.email})`,
    )

    // Aquí puedes ejecutar acciones secundarias:

    // ✅ Enviar email de bienvenida
    // await this.emailService.sendWelcomeEmail(event.email, event.fullName)

    // ✅ Registrar en auditoría
    // await this.auditRepository.logUserCreation({ ... })

    // ✅ Notificar a administradores
    // await this.notificationService.notifyAdmins(...)

    // ✅ Crear registros relacionados
    // await this.profileService.createDefaultProfile(event.userId)
  }
}
```

**Características**:
- ✅ Decorador `@EventsHandler(UserCreatedEvent)`
- ✅ Implementa `IEventHandler<UserCreatedEvent>`
- ✅ Método `handle()` asíncrono
- ✅ Puede realizar múltiples acciones sin afectar la lógica principal

---

## 6. Registro en el Módulo

**Ubicación**: `src/core/users/users.module.ts`

```typescript
// Event Handlers
import {
  UserCreatedHandler,
  UserUpdatedHandler,
  UserDeletedHandler,
} from './application/event-handlers'

const EventHandlers = [
  UserCreatedHandler,
  UserUpdatedHandler,
  UserDeletedHandler,
]

@Module({
  imports: [CqrsModule],  // 👈 Importante: CqrsModule
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,  // 👈 Registrar event handlers
  ],
})
export class UsersModule {}
```

---

## Casos de Uso Prácticos

### 1. Enviar Email de Bienvenida

```typescript
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    await this.emailService.send({
      to: event.email,
      subject: 'Bienvenido a la plataforma',
      template: 'welcome',
      data: {
        fullName: event.fullName,
        username: event.username,
      },
    })
  }
}
```

### 2. Registrar en Auditoría

```typescript
@EventsHandler(UserUpdatedEvent)
export class UserUpdatedHandler implements IEventHandler<UserUpdatedEvent> {
  constructor(private readonly auditService: AuditService) {}

  async handle(event: UserUpdatedEvent): Promise<void> {
    await this.auditService.log({
      action: 'USER_UPDATED',
      userId: event.userId,
      timestamp: event.updatedAt,
      changes: event.updatedFields,
    })
  }
}
```

### 3. Invalidar Cache

```typescript
@EventsHandler(UserUpdatedEvent)
export class UserUpdatedHandler implements IEventHandler<UserUpdatedEvent> {
  constructor(private readonly cacheManager: Cache) {}

  async handle(event: UserUpdatedEvent): Promise<void> {
    await this.cacheManager.del(`user:${event.userId}`)
    this.logger.log(`Cache invalidado para usuario ${event.userId}`)
  }
}
```

### 4. Revocar Tokens al Eliminar

```typescript
@EventsHandler(UserDeletedEvent)
export class UserDeletedHandler implements IEventHandler<UserDeletedEvent> {
  constructor(private readonly authService: AuthService) {}

  async handle(event: UserDeletedEvent): Promise<void> {
    // Revocar todos los tokens del usuario
    await this.authService.revokeAllTokens(event.userId)

    // Cerrar sesiones activas
    await this.authService.closeActiveSessions(event.userId)
  }
}
```

---

## Ejemplo Completo: Crear Usuario

### 1. Cliente hace la petición

```typescript
POST /users
{
  "names": "Juan",
  "lastNames": "Pérez",
  "email": "juan@example.com",
  "username": "juanperez",
  "password": "secreto123",
  "ci": "12345678",
  "roleIds": ["admin-role-id"]
}
```

### 2. Controller recibe y ejecuta comando

```typescript
@Post()
async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
  const command = new CreateUserCommand(dto)
  const user = await this.commandBus.execute<CreateUserCommand, User>(command)
  // ...
}
```

### 3. CreateUserHandler ejecuta lógica de negocio

```typescript
async execute(command: CreateUserCommand): Promise<User> {
  // Validar unicidad
  await this.uniquenessValidator.validateForCreate(...)

  // Crear entidad
  const user = User.create({ ... })

  // Persistir
  const savedUser = await this.userRepository.save(user)

  // ⭐ Emitir evento
  savedUser.markAsCreated()

  // ⭐ Publicar evento
  savedUser.domainEvents.forEach(event => this.eventBus.publish(event))
  savedUser.clearDomainEvents()

  return savedUser
}
```

### 4. UserCreatedHandler reacciona al evento

```typescript
async handle(event: UserCreatedEvent): Promise<void> {
  // Log
  this.logger.log(`Usuario creado: ${event.fullName}`)

  // Email de bienvenida
  await this.emailService.sendWelcomeEmail(event.email, event.fullName)

  // Auditoría
  await this.auditService.log('USER_CREATED', event.userId)
}
```

### 5. Salida en logs

```
[CreateUserHandler] Creando usuario: juan@example.com
[UserRepository] Usuario guardado con ID: abc-123
[DOMAIN EVENT] Usuario creado: Juan Pérez (juan@example.com)
[UserCreatedHandler] Enviando email de bienvenida a juan@example.com
[UserCreatedHandler] Registro de auditoría creado
```

---

## Mejores Prácticas

### ✅ DO

1. **Eventos en pasado**: `UserCreatedEvent`, no `CreateUserEvent`
2. **Eventos inmutables**: Todos los campos `readonly`
3. **Información completa**: El evento debe contener toda la info necesaria
4. **Publicar después de persistir**: Asegurar que los cambios se guardaron
5. **Limpiar eventos**: Siempre llamar `clearDomainEvents()`
6. **Handlers idempotentes**: Manejar duplicados si es necesario

### ❌ DON'T

1. **No modificar estado en eventos**: Los eventos son informativos, no comandos
2. **No lanzar excepciones en handlers**: Los errores no deben romper el flujo principal
3. **No crear dependencias cíclicas**: Un evento no debe disparar otro que vuelva al mismo agregado
4. **No abusar de eventos**: Solo para hechos importantes del dominio

---

## Testing

### Test de la Entidad

```typescript
describe('User Entity', () => {
  it('should emit UserCreatedEvent when marked as created', () => {
    const user = User.create({ ... })
    user.id = '123'
    user.createdAt = new Date()

    user.markAsCreated()

    expect(user.domainEvents).toHaveLength(1)
    expect(user.domainEvents[0]).toBeInstanceOf(UserCreatedEvent)
    expect(user.domainEvents[0].userId).toBe('123')
  })
})
```

### Test del Handler

```typescript
describe('CreateUserHandler', () => {
  it('should publish UserCreatedEvent after creating user', async () => {
    const eventBus = { publish: jest.fn() }
    const handler = new CreateUserHandler(
      userRepository,
      roleRepository,
      validator,
      eventBus as any,
    )

    await handler.execute(command)

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(UserCreatedEvent)
    )
  })
})
```

---

## Próximos Pasos

1. **Agregar más eventos según necesidad**:
   - `UserPasswordChangedEvent`
   - `UserLockedEvent`
   - `UserRoleChangedEvent`

2. **Implementar Event Sourcing** (opcional):
   - Guardar todos los eventos en una tabla de eventos
   - Reconstruir el estado desde eventos

3. **Integrar con mensajería** (opcional):
   - Publicar eventos a RabbitMQ / Kafka
   - Comunicación entre microservicios

4. **Dashboard de eventos**:
   - Visualizar eventos en tiempo real
   - Auditoría completa del sistema

---

## Recursos Adicionales

- [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs)
- [Domain Events - Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html)
- [DDD Aggregate Pattern](https://martinfowler.com/bliki/DDD_Aggregate.html)

---

**Autor**: Claude
**Fecha**: 2025-12-22
**Versión**: 1.0
