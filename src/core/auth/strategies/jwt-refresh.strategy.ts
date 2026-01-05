import { Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import type { IUserRepository } from 'src/core/users/domain'
import { USER_REPOSITORY } from 'src/core/users/infrastructure'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

/**
 * JWT Refresh Strategy
 *
 * Validates JWT refresh tokens and returns the JWT payload.
 * Used for refreshing access tokens.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
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
    return payload
  }
}
