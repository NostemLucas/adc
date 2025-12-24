import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import type { IUserRepository } from 'src/core/users/domain/repositories'
import { USER_REPOSITORY } from 'src/core/users/domain/repositories'
import { SessionRepository } from 'src/core/sessions/infrastructure/session.repository'
import { OtpRepository } from '../infrastructure/otp.repository'
import { User } from 'src/core/users/domain/user.entity'
import { Session } from 'src/core/sessions/domain/session.entity'
import { Otp } from '../domain/otp.entity'
import {
  JwtPayload,
  TokenPair,
  LoginResponse,
} from '../interfaces/jwt-payload.interface'
import { EmailService } from '@shared/email'

/**
 * AuthService refactored to use Prisma repositories
 * Clean separation: Service uses domain entities, repositories handle persistence
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly otpRepository: OtpRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
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
        throw new UnauthorizedException(
          'Cuenta inactiva. Contacta al administrador.',
        )
      }
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password.getValue(),
    )

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
        username: user.username.getValue(),
        email: user.email.getValue(),
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
      const session =
        await this.sessionRepository.findByRefreshToken(refreshToken)

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
    const session =
      await this.sessionRepository.findByRefreshToken(refreshToken)

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
      username: user.username.getValue(),
      email: user.email.getValue(),
      roles: user.roles.map((role) => role.name),
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET') || 'default-secret',
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get('JWT_REFRESH_SECRET') ||
          'default-refresh-secret',
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ])

    return { accessToken, refreshToken }
  }

  /**
   * Obtiene el tiempo de expiración del refresh token en milisegundos
   */
  private getRefreshTokenExpirationMs(): number {
    const expiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    )
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

  /**
   * Inicia el proceso de recuperación de contraseña
   * Envía un email con un link de reset
   */
  async forgotPassword(email: string): Promise<void> {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(email)

    // Por seguridad, no revelar si el email existe
    if (!user) {
      return
    }

    // Invalidar tokens de reset previos
    await this.otpRepository.invalidateAllByUserAndType(
      user.id,
      'PASSWORD_RESET',
    )

    // Generar token único y seguro
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Crear OTP con expiración de 30 minutos
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    const otp = Otp.create({
      userId: user.id,
      code: resetToken,
      type: 'PASSWORD_RESET',
      expiresAt,
    })

    await this.otpRepository.create(otp)

    // Crear link de reset
    const frontendUrl = this.configService.get<string>('FRONTEND_URL')
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`

    // Enviar email
    await this.emailService.sendResetPasswordEmail({
      to: user.email.getValue(),
      userName: user.fullName,
      resetLink,
      expiresInMinutes: 30,
    })
  }

  /**
   * Verifica el token de reset y cambia la contraseña
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Buscar token en BD
    const otp = await this.otpRepository.findByCodeAndType(
      token,
      'PASSWORD_RESET',
    )

    if (!otp || !otp.isValid) {
      throw new UnauthorizedException('Token inválido o expirado')
    }

    // Obtener usuario
    const user = await this.userRepository.findByIdOrFail(otp.userId)

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar contraseña del usuario
    user.updatePassword(hashedPassword)
    await this.userRepository.save(user)

    // Marcar token como usado
    otp.markAsUsed()
    await this.otpRepository.save(otp)

    // Invalidar todas las sesiones del usuario por seguridad
    await this.sessionRepository.invalidateAllByUserId(user.id)
  }

  /**
   * Envía código de 2FA por email
   */
  async sendTwoFactorCode(userId: string): Promise<void> {
    // Obtener usuario
    const user = await this.userRepository.findByIdOrFail(userId)

    // Invalidar códigos 2FA previos
    await this.otpRepository.invalidateAllByUserAndType(user.id, 'TWO_FACTOR')

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Crear OTP con expiración de 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const otp = Otp.create({
      userId: user.id,
      code,
      type: 'TWO_FACTOR',
      expiresAt,
    })

    await this.otpRepository.create(otp)

    // Enviar email
    await this.emailService.sendTwoFactorCode({
      to: user.email.getValue(),
      userName: user.fullName,
      code,
      expiresInMinutes: 10,
    })
  }

  /**
   * Verifica un código de 2FA
   */
  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findByCodeAndType(code, 'TWO_FACTOR')

    if (!otp || otp.userId !== userId) {
      return false
    }

    if (!otp.isValid) {
      return false
    }

    // Verificar número máximo de intentos
    if (otp.hasExceededMaxAttempts()) {
      return false
    }

    // Marcar como usado
    otp.markAsUsed()
    await this.otpRepository.save(otp)

    return true
  }
}
