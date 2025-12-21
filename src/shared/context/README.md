# Request Context - Auditoría Automática

Sistema de contexto de request basado en AsyncLocalStorage para capturar automáticamente el usuario autenticado y habilitar auditoría automática.

## 🎯 Características

- **Captura automática del usuario autenticado** desde la request
- **Auditoría automática** con `createdBy`, `updatedBy`, `deletedBy`
- **Request ID** para trazabilidad
- **IP y User Agent** del cliente
- **Thread-safe** usando AsyncLocalStorage (CLS)

## 📦 Instalación

### 1. Importar el módulo en `app.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ContextModule, RequestContextInterceptor } from '@shared/context'

@Module({
  imports: [
    ContextModule, // 👈 Importa el módulo global
    // ... otros módulos
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor, // 👈 Registra el interceptor globalmente
    },
    // ... otros providers
  ],
})
export class AppModule {}
```

### 2. Agregar campos de auditoría a tu schema de Prisma (opcional):

```prisma
model User {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // 👇 Campos de auditoría opcionales
  createdBy String? // ID del usuario que creó este registro
  updatedBy String? // ID del usuario que actualizó este registro
  deletedBy String? // ID del usuario que eliminó este registro

  // ... otros campos
}
```

Luego ejecuta:
```bash
npx prisma generate
npx prisma db push
```

## 🚀 Uso en Repositorios

### Opción 1: Usar helpers del BaseRepository (Recomendado)

```typescript
import { Injectable } from '@nestjs/common'
import { BaseRepository, TransactionContext } from '@shared/database'
import { RequestContext } from '@shared/context'

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(
    transactionContext: TransactionContext,
    requestContext: RequestContext, // 👈 Inyecta RequestContext
  ) {
    super(transactionContext, requestContext)
  }

  async create(userData: CreateUserData): Promise<User> {
    const prismaUser = await this.prisma.user.create({
      data: this.withAuditCreate(userData) // 👈 Agrega createdBy automáticamente
    })
    return this.toDomain(prismaUser)
  }

  async update(id: string, userData: UpdateUserData): Promise<User> {
    const prismaUser = await this.prisma.user.update({
      where: { id },
      data: this.withAuditUpdate(userData) // 👈 Agrega updatedBy automáticamente
    })
    return this.toDomain(prismaUser)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: this.withAuditDelete() // 👈 Agrega deletedBy y deletedAt automáticamente
    })
  }
}
```

### Opción 2: Acceso directo al RequestContext

```typescript
@Injectable()
export class AuditService {
  constructor(private readonly requestContext: RequestContext) {}

  async logAction(action: string): Promise<void> {
    const userId = this.requestContext.getCurrentUserId()
    const ip = this.requestContext.getCurrentIp()
    const requestId = this.requestContext.getCurrentRequestId()

    console.log({
      userId,
      ip,
      requestId,
      action,
    })
  }
}
```

## 📋 API

### RequestContext

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getCurrentUserId()` | ID del usuario autenticado | `string \| undefined` |
| `getCurrentIp()` | IP del cliente | `string \| undefined` |
| `getCurrentUserAgent()` | User Agent del cliente | `string \| undefined` |
| `getCurrentRequestId()` | Request ID único | `string \| undefined` |
| `getContext()` | Contexto completo | `RequestContextData \| undefined` |
| `isActive()` | Verifica si hay contexto activo | `boolean` |

### BaseRepository Helpers

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `withAuditCreate(data)` | Agrega `createdBy` | `data & { createdBy?: string }` |
| `withAuditUpdate(data)` | Agrega `updatedBy` | `data & { updatedBy?: string }` |
| `withAuditDelete()` | Agrega `deletedBy` y `deletedAt` | `{ deletedBy?: string, deletedAt: Date }` |
| `getCurrentUserId()` | Obtiene el usuario actual | `string \| undefined` |

## ⚠️ Notas Importantes

1. **El interceptor debe estar antes que otros interceptors** que necesiten acceso al contexto
2. **Los campos de auditoría en Prisma deben ser opcionales** (`String?`) para evitar errores
3. **Funciona solo en contexto de HTTP requests** - No funciona en:
   - Cron jobs
   - Background workers
   - Comandos de CLI
4. **Request ID** se genera automáticamente con `crypto.randomUUID()` si no se provee

## 🔒 Seguridad

- El usuario se extrae de `request.user` (debe ser seteado por un AuthGuard)
- El contexto es aislado por request (thread-safe)
- No hay riesgo de data leaks entre requests concurrentes

## 🧪 Testing

En tests, puedes mockear el RequestContext:

```typescript
const mockRequestContext = {
  getCurrentUserId: jest.fn().mockReturnValue('test-user-id'),
} as any

const repository = new UserRepository(transactionContext, mockRequestContext)
```
