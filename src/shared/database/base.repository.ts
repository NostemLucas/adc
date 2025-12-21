import { Injectable, Inject, Optional } from '@nestjs/common'
import { TransactionContext } from './transaction-context.service'
import { RequestContext } from '../context/request-context.service'
import type { PrismaClientType } from './types'

/**
 * Repositorio base que provee acceso automático al contexto de transacciones y auditoría.
 *
 * Todos los repositorios deben extender esta clase para obtener:
 * - Soporte automático de transacciones mediante el contexto CLS
 * - Helpers de auditoría automática (createdBy, updatedBy, etc.)
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserRepository extends BaseRepository {
 *   constructor(
 *     transactionContext: TransactionContext,
 *     requestContext: RequestContext,
 *   ) {
 *     super(transactionContext, requestContext)
 *   }
 *
 *   async create(data: CreateUserData): Promise<User> {
 *     const prismaUser = await this.prisma.user.create({
 *       data: this.withAuditCreate(data)
 *     })
 *     return User.fromPersistence(prismaUser)
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BaseRepository {
  constructor(
    protected readonly transactionContext: TransactionContext,
    @Optional() protected readonly requestContext?: RequestContext,
  ) {}

  /**
   * Obtiene el cliente Prisma del contexto actual.
   *
   * Si hay una transacción activa, usa el cliente transaccional.
   * Si no, usa el cliente Prisma normal.
   *
   * Los repositorios deben usar `this.prisma` para todas las operaciones
   * de base de datos para garantizar que participen en transacciones activas.
   */
  protected get prisma(): PrismaClientType {
    return this.transactionContext.getClient()
  }

  /**
   * Verifica si actualmente hay una transacción activa.
   *
   * Útil para logs o lógica condicional basada en el contexto transaccional.
   */
  protected get isInTransaction(): boolean {
    return this.transactionContext.isInTransaction()
  }

  // ===== HELPERS DE AUDITORÍA =====

  /**
   * Obtiene el ID del usuario autenticado actual desde el RequestContext.
   *
   * @returns ID del usuario o undefined si no hay usuario autenticado
   */
  protected getCurrentUserId(): string | undefined {
    return this.requestContext?.getCurrentUserId()
  }

  /**
   * Agrega campos de auditoría de creación a los datos.
   *
   * Agrega automáticamente:
   * - createdBy: ID del usuario actual (si está autenticado y el campo existe)
   * - createdAt: timestamp actual (opcional, Prisma lo maneja automáticamente)
   *
   * @param data Datos base a los que agregar auditoría
   * @returns Datos con campos de auditoría agregados
   *
   * @example
   * ```typescript
   * const prismaUser = await this.prisma.user.create({
   *   data: this.withAuditCreate({
   *     name: 'John',
   *     email: 'john@example.com'
   *   })
   * })
   * // Si hay usuario autenticado, agregará: { ...data, createdBy: 'user-id' }
   * ```
   */
  protected withAuditCreate<T extends Record<string, any>>(data: T): T {
    const userId = this.getCurrentUserId()

    // Solo agrega createdBy si hay usuario autenticado
    // Nota: createdAt lo maneja Prisma automáticamente con @default(now())
    if (userId) {
      return {
        ...data,
        createdBy: userId,
      } as T
    }

    return data
  }

  /**
   * Agrega campos de auditoría de actualización a los datos.
   *
   * Agrega automáticamente:
   * - updatedBy: ID del usuario actual (si está autenticado y el campo existe)
   * - updatedAt: timestamp actual (opcional, Prisma lo maneja automáticamente)
   *
   * @param data Datos base a los que agregar auditoría
   * @returns Datos con campos de auditoría agregados
   *
   * @example
   * ```typescript
   * const prismaUser = await this.prisma.user.update({
   *   where: { id },
   *   data: this.withAuditUpdate({
   *     name: 'Jane'
   *   })
   * })
   * // Si hay usuario autenticado, agregará: { ...data, updatedBy: 'user-id' }
   * ```
   */
  protected withAuditUpdate<T extends Record<string, any>>(data: T): T {
    const userId = this.getCurrentUserId()

    // Solo agrega updatedBy si hay usuario autenticado
    // Nota: updatedAt lo maneja Prisma automáticamente con @updatedAt
    if (userId) {
      return {
        ...data,
        updatedBy: userId,
      } as T
    }

    return data
  }

  /**
   * Agrega campos de auditoría de eliminación (soft delete).
   *
   * Agrega automáticamente:
   * - deletedBy: ID del usuario actual (si está autenticado)
   * - deletedAt: timestamp actual
   *
   * @returns Objeto con campos de eliminación
   *
   * @example
   * ```typescript
   * await this.prisma.user.update({
   *   where: { id },
   *   data: this.withAuditDelete()
   * })
   * // Resultado: { deletedBy: 'user-id', deletedAt: new Date() }
   * ```
   */
  protected withAuditDelete(): { deletedBy?: string; deletedAt: Date } {
    const userId = this.getCurrentUserId()

    return {
      deletedAt: new Date(),
      ...(userId && { deletedBy: userId }),
    }
  }
}
