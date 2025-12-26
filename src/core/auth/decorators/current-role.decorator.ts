import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

/**
 * Extrae el currentRole del JWT token
 */
export const CurrentRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no encontrado')
    }

    const token = authHeader.substring(7)
    const jwtService = new JwtService()

    try {
      // Decodificar sin verificar (ya fue verificado por el guard)
      const payload = jwtService.decode(token) as any

      if (!payload || !payload.currentRole) {
        throw new UnauthorizedException('CurrentRole no encontrado en el token')
      }

      return payload.currentRole
    } catch (error) {
      throw new UnauthorizedException('Token inválido')
    }
  },
)
