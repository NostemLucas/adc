import { Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import type { IUserRepository } from 'src/core/users/domain'
import { USER_REPOSITORY } from 'src/core/users/infrastructure'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

/**
 * JWT Strategy
 *
 * Validates JWT access tokens and returns the JWT payload.
 * The payload is stored in request.user and contains:
 * - For internal users: roles, currentRole
 * - For external users: organizationId
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'default-secret',
    })
  }

  /**
   * Validates the JWT payload and checks if the user is still active.
   * Returns the full JWT payload which will be stored in request.user
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verify that the user still exists and is active
    const user = await this.userRepository.findById(payload.sub)

    if (!user || !user.canAttemptLogin()) {
      throw new UnauthorizedException('Usuario no autorizado')
    }

    // Return the full payload (not the User entity)
    // This allows guards and decorators to access roles, organizationId, etc.
    return payload
  }
}
