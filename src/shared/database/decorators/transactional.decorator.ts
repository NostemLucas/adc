import { TransactionContext } from '../transaction-context.service'

/**
 * Tipo para métodos asíncronos
 */
type AsyncMethod = (...args: never[]) => Promise<unknown>

/**
 * Decorador que ejecuta un método dentro de una transacción Prisma.
 *
 * El método decorado debe pertenecer a una clase que tenga una instancia
 * de TransactionContext inyectada (típicamente en use cases o servicios).
 *
 * IMPORTANTE: La clase debe tener una propiedad `transactionContext` de tipo TransactionContext.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class CreateUserUseCase {
 *   constructor(
 *     private readonly userRepository: UserRepository,
 *     private readonly roleRepository: RoleRepository,
 *     private readonly transactionContext: TransactionContext,
 *   ) {}
 *
 *   @Transactional()
 *   async execute(dto: CreateUserDto): Promise<User> {
 *     // Todo dentro de este método se ejecuta en una transacción
 *     const user = await this.userRepository.create(dto)
 *     await this.roleRepository.assignToUser(dto.roleIds, user.id)
 *     return user
 *   }
 * }
 * ```
 */
export function Transactional() {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor | void {
    const originalMethod = descriptor.value as AsyncMethod

    if (typeof originalMethod !== 'function') {
      throw new Error(
        `@Transactional can only be applied to methods, not properties`,
      )
    }

    descriptor.value = async function (
      this: {
        transactionContext?: TransactionContext
        constructor: { name: string }
      },
      ...args: never[]
    ): Promise<unknown> {
      if (!this.transactionContext) {
        const className = this.constructor?.name || 'Unknown'
        throw new Error(
          `@Transactional decorator requires a 'transactionContext' property on the class. ` +
            `Make sure to inject TransactionContext in ${className}.`,
        )
      }

      const transactionContext = this.transactionContext

      // Si ya estamos en una transacción, simplemente ejecuta el método
      if (transactionContext.isInTransaction()) {
        return originalMethod.apply(this, args) as Promise<unknown>
      }

      // Si no, crea una nueva transacción
      return transactionContext.runInTransaction(async () => {
        return originalMethod.apply(this, args) as Promise<unknown>
      })
    }

    return descriptor
  }
}
