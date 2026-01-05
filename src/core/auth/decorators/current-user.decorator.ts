import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

/**
 * CurrentUser Decorator
 *
 * Extracts the authenticated user's JWT payload from the request.
 * The payload contains different fields depending on user type:
 *
 * - Internal users: sub, username, email, profileId, roles, currentRole, sessionId
 * - External users: sub, username, email, profileId, organizationId, sessionId
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: JwtPayload) {
 *   // Access user.sub, user.roles, user.organizationId, etc.
 * }
 *
 * // Get specific field
 * @Get('username')
 * async getUsername(@CurrentUser('username') username: string) {
 *   return { username }
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    return data ? user?.[data] : user
  },
)
