import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

/**
 * Decorator para obtener el organizationId del usuario externo (cliente)
 *
 * Solo está disponible para usuarios externos/clientes.
 * Para usuarios internos, retorna undefined.
 *
 * @example
 * @Get('my-reports')
 * async getMyReports(@OrganizationId() organizationId: string) {
 *   // organizationId solo existe para clientes
 *   return this.reportsService.findByOrganization(organizationId)
 * }
 */
export const OrganizationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    return user?.organizationId
  },
)
