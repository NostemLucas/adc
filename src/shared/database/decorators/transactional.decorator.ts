import { TransactionContext } from '../transaction-context.service'

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
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = this as any

      if (!instance.transactionContext) {
        const className =
          typeof target === 'object' && target !== null && 'constructor' in target
            ? (target.constructor as { name: string }).name
            : 'Unknown'
        throw new Error(
          `@Transactional decorator requires a 'transactionContext' property on the class. ` +
            `Make sure to inject TransactionContext in ${className}.`,
        )
      }

      const transactionContext = instance.transactionContext as TransactionContext

      // Si ya estamos en una transacción, simplemente ejecuta el método
      if (transactionContext.isInTransaction()) {
        return originalMethod.apply(this, args)
      }

      // Si no, crea una nueva transacción
      return transactionContext.runInTransaction(async () => {
        return originalMethod.apply(this, args)
      })
    }

    return descriptor
  }
}
