import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { User } from 'src/core/users/domain/user'

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly jwtService = new JwtService()

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
    const user = request.user as User

    if (!user) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      )
    }

    // Extraer currentRole del JWT token
    const token = this.extractTokenFromHeader(request)
    if (!token) {
      throw new ForbiddenException('Token no encontrado')
    }

    const currentRole = this.extractCurrentRoleFromToken(token)
    if (!currentRole) {
      throw new ForbiddenException('Rol activo no encontrado')
    }

    const hasRole = requiredRoles.includes(currentRole)

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      )
    }

    return true
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }

  private extractCurrentRoleFromToken(token: string): string | null {
    try {
      const payload = this.jwtService.decode(token) as any
      return payload?.currentRole || null
    } catch {
      return null
    }
  }
}
