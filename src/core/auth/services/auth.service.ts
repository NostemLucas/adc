import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { UserRepository } from 'src/core/users/infrastructure/user.repository'
import { SessionRepository } from 'src/core/sessions/infrastructure/session.repository'
import { User } from 'src/core/users/domain/user.entity'
import { Session } from 'src/core/sessions/domain/session.entity'
import { JwtPayload, TokenPair, LoginResponse } from '../interfaces/jwt-payload.interface'

/**
 * AuthService refactored to use Prisma repositories
 * Clean separation: Service uses domain entities, repositories handle persistence
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Login con validación de intentos y bloqueo temporal
   */
  async login(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    // Buscar usuario por username o email
    const user = await this.userRepository.findByUsernameOrEmail(username)

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    // Verificar si el usuario puede intentar login
    if (!user.canAttemptLogin()) {
      if (user.isLocked) {
        const lockMinutes = Math.ceil(
          (user.lockUntil!.getTime() - Date.now()) / (1000 * 60),
        )
        throw new UnauthorizedException(
          `Cuenta bloqueada temporalmente. Intenta de nuevo en ${lockMinutes} minutos.`,
        )
      }
      if (!user.isActive) {
        throw new UnauthorizedException('Cuenta inactiva. Contacta al administrador.')
      }
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      user.incrementFailedAttempts()
      await this.userRepository.save(user)

      const remainingAttempts = 3 - user.failedLoginAttempts
      if (remainingAttempts > 0) {
        throw new UnauthorizedException(
          `Credenciales inválidas. Intentos restantes: ${remainingAttempts}`,
        )
      } else {
        throw new UnauthorizedException(
          'Cuenta bloqueada por 30 minutos debido a múltiples intentos fallidos.',
        )
      }
    }

    // Login exitoso: resetear intentos fallidos
    user.resetLoginAttempts()
    await this.userRepository.save(user)

    // Generar tokens
    const tokens = await this.generateTokenPair(user)

    // Crear sesión usando el factory method de Session
    const session = Session.create({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + this.getRefreshTokenExpirationMs()),
      ipAddress,
      userAgent,
    })
    await this.sessionRepository.save(session)

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles.map((role) => role.name),
      },
      tokens,
    }
  }

  /**
   * Refresh token para obtener nuevos access y refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verificar el refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      })

      // Buscar la sesión
      const session = await this.sessionRepository.findByRefreshToken(refreshToken)

      if (!session || !session.isValid) {
        throw new UnauthorizedException('Sesión inválida o expirada')
      }

      // Buscar el usuario
      const user = await this.userRepository.findByIdOrFail(session.userId)

      // Verificar que el usuario sigue activo
      if (!user.canAttemptLogin()) {
        await this.sessionRepository.invalidateSession(session.id)
        throw new UnauthorizedException('Usuario no autorizado')
      }

      // Generar nuevos tokens
      const tokens = await this.generateTokenPair(user)

      // Actualizar la sesión con el nuevo refresh token
      session.refreshToken = tokens.refreshToken
      session.expiresAt = new Date(
        Date.now() + this.getRefreshTokenExpirationMs(),
      )
      session.updateLastUsed()
      await this.sessionRepository.save(session)

      return tokens
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado')
    }
  }

  /**
   * Logout: invalida la sesión actual
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    const session = await this.sessionRepository.findByRefreshToken(refreshToken)

    if (session && session.userId === userId && session.isActive) {
      session.invalidate()
      await this.sessionRepository.save(session)
    }
  }

  /**
   * Logout de todas las sesiones del usuario
   */
  async logoutAll(userId: string): Promise<void> {
    await this.sessionRepository.invalidateAllByUserId(userId)
  }

  /**
   * Valida un access token y retorna el payload
   */
  async validateAccessToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      })
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado')
    }
  }

  /**
   * Genera un par de tokens (access y refresh)
   */
  private async generateTokenPair(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET') || 'default-secret',
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ])

    return { accessToken, refreshToken }
  }

  /**
   * Obtiene el tiempo de expiración del refresh token en milisegundos
   */
  private getRefreshTokenExpirationMs(): number {
    const expiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d')
    // Convertir '7d' a milisegundos (7 * 24 * 60 * 60 * 1000)
    const days = parseInt(expiration.replace('d', ''))
    return days * 24 * 60 * 60 * 1000
  }

  /**
   * Limpia sesiones expiradas (puede ejecutarse como cron job)
   */
  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionRepository.deleteExpiredSessions()
  }
}
