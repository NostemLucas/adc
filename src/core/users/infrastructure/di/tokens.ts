/**
 * Dependency Injection Tokens
 *
 * These tokens are used for injecting repository implementations.
 * Located in infrastructure layer because DI tokens are framework-specific
 * implementation details (NestJS), not part of the domain.
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
