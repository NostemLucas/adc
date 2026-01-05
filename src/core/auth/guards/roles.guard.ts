import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

/**
 * Roles Guard
 *
 * Protects routes based on required roles (for internal users only).
 * Works in conjunction with @Roles() decorator.
 *
 * The guard checks if the authenticated user's currentRole matches
 * one of the required roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    if (!user) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      )
    }

    // Get current active role from JWT payload
    const currentRole = user.currentRole

    if (!currentRole) {
      throw new ForbiddenException(
        'Rol activo no encontrado. Este endpoint es solo para usuarios internos.',
      )
    }

    const hasRole = requiredRoles.includes(currentRole)

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      )
    }

    return true
  }
}
