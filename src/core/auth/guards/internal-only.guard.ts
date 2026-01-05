import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { INTERNAL_ONLY_KEY } from '../decorators/internal-only.decorator'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

/**
 * Guard para verificar que solo usuarios INTERNOS puedan acceder.
 *
 * Un usuario es considerado INTERNO si tiene el campo 'roles' en su JWT payload.
 * Un usuario es considerado EXTERNO/CLIENTE si tiene 'organizationId' en su JWT payload.
 *
 * Uso:
 * 1. Agregar el guard globalmente en main.ts o module
 * 2. Usar @InternalOnly() en controladores o métodos específicos
 */
@Injectable()
export class InternalOnlyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si el endpoint está marcado como InternalOnly
    const isInternalOnly = this.reflector.getAllAndOverride<boolean>(
      INTERNAL_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    )

    // Si no está marcado, permitir acceso
    if (!isInternalOnly) {
      return true
    }

    // Obtener el usuario del request (viene del JwtAuthGuard)
    const request = context.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    if (!user) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      )
    }

    // Un usuario INTERNO tiene el campo 'roles' en su payload
    // Un usuario EXTERNO tiene el campo 'organizationId'
    const isInternalUser = !!user.roles && user.roles.length > 0

    if (!isInternalUser) {
      throw new ForbiddenException(
        'Este recurso solo está disponible para usuarios internos del sistema',
      )
    }

    return true
  }
}
