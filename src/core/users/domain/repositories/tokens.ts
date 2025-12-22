/**
 * Dependency Injection Tokens
 *
 * These tokens are used for injecting repository implementations
 * into use cases. This follows the Dependency Inversion Principle
 * where high-level modules (use cases) don't depend on low-level
 * modules (repositories), but both depend on abstractions (interfaces).
 *
 * Usage in use cases:
 * ```typescript
 * constructor(
 *   @Inject(USER_REPOSITORY)
 *   private readonly userRepository: IUserRepository
 * ) {}
 * ```
 *
 * Usage in modules:
 * ```typescript
 * {
 *   provide: USER_REPOSITORY,
 *   useClass: UserRepository
 * }
 * ```
 */

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')
