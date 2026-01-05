import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

/**
 * SessionId Decorator
 *
 * Extracts the sessionId from the authenticated user's JWT payload.
 * Every authenticated user (internal or external) has a sessionId.
 *
 * @example
 * ```typescript
 * @Put('switch-role')
 * async switchRole(
 *   @SessionId() sessionId: string,
 *   @Body() dto: SwitchRoleDto
 * ) {
 *   return this.authService.switchRole(sessionId, dto.newRole)
 * }
 * ```
 *
 * @returns The session ID from the JWT payload
 */
export const SessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    return user?.sessionId
  },
)
