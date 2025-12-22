import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { UserRepository } from '../../users/infrastructure/user.repository'
import { SessionRepository } from '../../sessions/infrastructure/session.repository'
import { Session } from '../../sessions/domain/session.entity'
import { OtpRepository } from '../infrastructure/otp.repository'
import { EmailService } from '@shared/email'
import {
  createMockUser,
  VALID_BCRYPT_HASH,
} from '../../users/test-helpers'
import * as bcrypt from 'bcrypt'

jest.mock('bcrypt')

describe('AuthService', () => {
  let service: AuthService
  let userRepository: jest.Mocked<UserRepository>
  let sessionRepository: jest.Mocked<SessionRepository>
  let otpRepository: jest.Mocked<OtpRepository>
  let jwtService: jest.Mocked<JwtService>
  let configService: jest.Mocked<ConfigService>
  let emailService: jest.Mocked<EmailService>

  const mockUser = createMockUser()

  const mockSession: Session = {
    id: 'session-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    userId: 'user-1',
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    isActive: true,
    lastUsedAt: new Date(),
    get isValid() {
      return this.isActive && new Date() < this.expiresAt
    },
    get isExpired() {
      return new Date() >= this.expiresAt
    },
    invalidate: jest.fn(),
    updateLastUsed: jest.fn(),
  }

  beforeEach(async () => {
    const mockUserRepository = {
      findByUsernameOrEmail: jest.fn(),
      findById: jest.fn(),
      findByIdOrFail: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    }

    const mockSessionRepository = {
      save: jest.fn(),
      findByRefreshToken: jest.fn(),
      invalidateSession: jest.fn(),
      invalidateAllByUserId: jest.fn(),
      deleteExpiredSessions: jest.fn(),
    }

    const mockOtpRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findByCodeAndType: jest.fn(),
      invalidateAllByUserAndType: jest.fn(),
    }

    const mockJwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    }

    const mockConfigService = {
      get: jest.fn(),
    }

    const mockEmailService = {
      sendResetPasswordEmail: jest.fn(),
      sendTwoFactorCode: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
        {
          provide: OtpRepository,
          useValue: mockOtpRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    userRepository = module.get(UserRepository)
    sessionRepository = module.get(SessionRepository)
    otpRepository = module.get(OtpRepository)
    jwtService = module.get(JwtService)
    configService = module.get(ConfigService)
    emailService = module.get(EmailService)

    // Mock de ConfigService
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRATION: '7d',
      }
      return config[key] || defaultValue
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('debe hacer login exitosamente con credenciales válidas', async () => {
      // Arrange
      userRepository.findByUsernameOrEmail.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      jwtService.signAsync.mockResolvedValueOnce('access-token')
      jwtService.signAsync.mockResolvedValueOnce('refresh-token')
      sessionRepository.save.mockResolvedValue(mockSession)
      userRepository.save.mockResolvedValue(mockUser)

      // Act
      const result = await service.login(
        'juanp',
        'password123',
        '192.168.1.1',
        'Mozilla/5.0',
      )

      // Assert
      expect(userRepository.findByUsernameOrEmail).toHaveBeenCalledWith('juanp')
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        VALID_BCRYPT_HASH,
      )
      expect(mockUser.resetLoginAttempts).toHaveBeenCalled()
      expect(result.user.id).toBe('user-1')
      expect(result.tokens.accessToken).toBe('access-token')
      expect(result.tokens.refreshToken).toBe('refresh-token')
    })

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      // Arrange
      userRepository.findByUsernameOrEmail.mockResolvedValue(null)

      // Act & Assert
      await expect(service.login('noexiste', 'password123')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('debe incrementar intentos fallidos con contraseña incorrecta', async () => {
      // Arrange
      userRepository.findByUsernameOrEmail.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
      userRepository.save.mockResolvedValue(mockUser)

      // Act & Assert
      await expect(service.login('juanp', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      )
      expect(mockUser.incrementFailedAttempts).toHaveBeenCalled()
      expect(userRepository.save).toHaveBeenCalled()
    })

    it('debe lanzar UnauthorizedException si el usuario está bloqueado', async () => {
      // Arrange
      const lockedUser = {
        ...mockUser,
        lockUntil: new Date(Date.now() + 30 * 60 * 1000), // Bloqueado por 30 min
        canAttemptLogin: jest.fn().mockReturnValue(false),
        get isLocked() {
          return true
        },
      }
      userRepository.findByUsernameOrEmail.mockResolvedValue(lockedUser as any)

      // Act & Assert
      await expect(service.login('juanp', 'password123')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('debe crear una sesión después de login exitoso', async () => {
      // Arrange
      userRepository.findByUsernameOrEmail.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      jwtService.signAsync.mockResolvedValueOnce('access-token')
      jwtService.signAsync.mockResolvedValueOnce('refresh-token')
      sessionRepository.save.mockResolvedValue(mockSession)
      userRepository.save.mockResolvedValue(mockUser)

      // Act
      await service.login('juanp', 'password123', '192.168.1.1', 'Mozilla/5.0')

      // Assert
      expect(sessionRepository.save).toHaveBeenCalled()
    })
  })

  describe('refreshTokens', () => {
    it('debe generar nuevos tokens con refresh token válido', async () => {
      // Arrange
      const payload = {
        sub: 'user-1',
        username: 'juanp',
        email: 'juan@example.com',
        roles: ['ADMINISTRADOR'],
      }
      jwtService.verify.mockReturnValue(payload)
      sessionRepository.findByRefreshToken.mockResolvedValue(mockSession)
      userRepository.findByIdOrFail.mockResolvedValue(mockUser)
      jwtService.signAsync.mockResolvedValueOnce('new-access-token')
      jwtService.signAsync.mockResolvedValueOnce('new-refresh-token')
      sessionRepository.save.mockResolvedValue(mockSession)

      // Act
      const result = await service.refreshTokens('old-refresh-token')

      // Assert
      expect(jwtService.verify).toHaveBeenCalled()
      expect(sessionRepository.findByRefreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
      )
      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
    })

    it('debe lanzar UnauthorizedException si el refresh token es inválido', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      // Act & Assert
      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('debe lanzar UnauthorizedException si la sesión no existe', async () => {
      // Arrange
      const payload = { sub: 'user-1' }
      jwtService.verify.mockReturnValue(payload)
      sessionRepository.findByRefreshToken.mockResolvedValue(null)

      // Act & Assert
      await expect(service.refreshTokens('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('debe invalidar sesión si el usuario está inactivo', async () => {
      // Arrange
      const inactiveUser = {
        ...mockUser,
        status: UserStatus.INACTIVE,
        canAttemptLogin: jest.fn().mockReturnValue(false),
      }
      const payload = { sub: 'user-1' }
      jwtService.verify.mockReturnValue(payload)
      sessionRepository.findByRefreshToken.mockResolvedValue(mockSession)
      userRepository.findByIdOrFail.mockResolvedValue(inactiveUser as any)
      sessionRepository.invalidateSession.mockResolvedValue()

      // Act & Assert
      await expect(service.refreshTokens('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      )
      expect(sessionRepository.invalidateSession).toHaveBeenCalledWith(
        'session-1',
      )
    })
  })

  describe('logout', () => {
    it('debe invalidar la sesión actual', async () => {
      // Arrange
      sessionRepository.findByRefreshToken.mockResolvedValue(mockSession)
      sessionRepository.save.mockResolvedValue(mockSession)

      // Act
      await service.logout('user-1', 'refresh-token')

      // Assert
      expect(sessionRepository.findByRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      )
      expect(mockSession.invalidate).toHaveBeenCalled()
      expect(sessionRepository.save).toHaveBeenCalled()
    })

    it('no debe fallar si la sesión no existe', async () => {
      // Arrange
      sessionRepository.findByRefreshToken.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.logout('user-1', 'refresh-token'),
      ).resolves.not.toThrow()
    })
  })

  describe('logoutAll', () => {
    it('debe invalidar todas las sesiones del usuario', async () => {
      // Arrange
      sessionRepository.invalidateAllByUserId.mockResolvedValue()

      // Act
      await service.logoutAll('user-1')

      // Assert
      expect(sessionRepository.invalidateAllByUserId).toHaveBeenCalledWith(
        'user-1',
      )
    })
  })
})
