import { BadRequestException } from '@nestjs/common'

/**
 * Base exception for all domain exceptions.
 *
 * Use this as the base class for all business logic exceptions
 * in your domain layer.
 *
 * @example
 * ```typescript
 * export class UserNotFoundException extends DomainException {
 *   constructor(userId: string) {
 *     super(`User with ID ${userId} not found`, 'USER_NOT_FOUND')
 *   }
 * }
 * ```
 */
export class DomainException extends BadRequestException {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super({
      message,
      error: code,
    })
  }
}
