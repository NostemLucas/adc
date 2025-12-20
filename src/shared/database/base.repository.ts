import { Injectable } from '@nestjs/common'
import { TransactionContext } from './transaction-context.service'
import type { PrismaClientType } from './types'

/**
 * Repositorio base que provee acceso automático al contexto de transacciones.
 *
 * Todos los repositorios deben extender esta clase para obtener soporte
 * automático de transacciones mediante el contexto CLS.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserRepository extends BaseRepository {
 *   constructor(transactionContext: TransactionContext) {
 *     super(transactionContext)
 *   }
 *
 *   async create(data: CreateUserData): Promise<User> {
 *     // this.prisma usa automáticamente la transacción del contexto si existe
 *     const prismaUser = await this.prisma.user.create({ data })
 *     return User.fromPersistence(prismaUser)
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BaseRepository {
  constructor(protected readonly transactionContext: TransactionContext) {}

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
}
