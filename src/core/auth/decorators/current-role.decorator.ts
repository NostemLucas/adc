import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

/**
 * CurrentRole Decorator
 *
 * Extracts the currentRole from the authenticated user's JWT payload.
 * Only available for internal users (external users don't have currentRole).
 *
 * @example
 * ```typescript
 * @Get('dashboard')
 * async getDashboard(@CurrentRole() currentRole?: string) {
 *   // currentRole only exists for internal users
 *   if (currentRole) {
 *     return this.dashboardService.getByRole(currentRole)
 *   }
 *   // External user, return client dashboard
 *   return this.dashboardService.getClientDashboard()
 * }
 * ```
 *
 * @returns The current active role for internal users, undefined for external users
 */
export const CurrentRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    return user?.currentRole
  },
)
