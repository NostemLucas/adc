import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './services/auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { User } from '../users/domain/user'
import { Role } from './domain/authorization'
import { UserStatus } from '@prisma/client'
import type { Request } from 'express'

describe('AuthController', () => {
  let controller: AuthController
  let authService: jest.Mocked<AuthService>

  const VALID_BCRYPT_HASH =
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

  const mockUser: User = {
    id: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    names: 'Juan',
    lastNames: 'Pérez',
    email: 'juan@example.com',
    phone: '12345678',
    username: 'juanp',
    password: VALID_BCRYPT_HASH,
    ci: '12345678',
    status: UserStatus.ACTIVE,
    failedLoginAttempts: 0,
    lockUntil: null,
    roles: [Role.ADMINISTRADOR],
    get fullName() {
      return `${this.names} ${this.lastNames}`
    },
    get isLocked() {
      return this.lockUntil ? new Date() < this.lockUntil : false
    },
    get isActive() {
      return this.status === UserStatus.ACTIVE && !this.isLocked
    },
    canAttemptLogin: jest.fn().mockReturnValue(true),
    incrementFailedAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
  }

  const mockLoginResponse = {
    user: {
      id: 'user-1',
      username: 'juanp',
      email: 'juan@example.com',
      fullName: 'Juan Pérez',
      roles: ['ADMINISTRADOR'],
    },
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  }

  const mockTokens = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  }

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('debe hacer login exitosamente con credenciales válidas', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'juanp',
        password: 'password123',
      }
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      } as Request
      const ip = '192.168.1.1'

      authService.login.mockResolvedValue(mockLoginResponse as any)

      // Act
      const result = await controller.login(loginDto, mockRequest, ip)

      // Assert
      expect(authService.login).toHaveBeenCalledWith(
        'juanp',
        'password123',
        '192.168.1.1',
        'Mozilla/5.0',
        undefined,
      )
      expect(result).toEqual(mockLoginResponse)
    })

    it('debe extraer user-agent del request correctamente', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'juanp',
        password: 'password123',
      }
      const mockRequest = {
        headers: {
          'user-agent': 'Chrome/91.0',
        },
      } as Request
      const ip = '10.0.0.1'

      authService.login.mockResolvedValue(mockLoginResponse as any)

      // Act
      await controller.login(loginDto, mockRequest, ip)

      // Assert
      expect(authService.login).toHaveBeenCalledWith(
        'juanp',
        'password123',
        '10.0.0.1',
        'Chrome/91.0',
        undefined,
      )
    })

    it('debe manejar login sin user-agent', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'juanp',
        password: 'password123',
      }
      const mockRequest = {
        headers: {},
      } as Request
      const ip = '192.168.1.1'

      authService.login.mockResolvedValue(mockLoginResponse as any)

      // Act
      await controller.login(loginDto, mockRequest, ip)

      // Assert
      expect(authService.login).toHaveBeenCalledWith(
        'juanp',
        'password123',
        '192.168.1.1',
        undefined,
        undefined,
      )
    })

    it('debe retornar tokens y datos del usuario', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'juanp',
        password: 'password123',
      }
      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0' },
      } as Request

      authService.login.mockResolvedValue(mockLoginResponse as any)

      // Act
      const result = await controller.login(
        loginDto,
        mockRequest,
        '192.168.1.1',
      )

      // Assert
      expect(result.user.id).toBe('user-1')
      expect(result.user.username).toBe('juanp')
      expect(result.user.roles).toEqual(['ADMINISTRADOR'])
      expect(result.tokens.accessToken).toBe('mock-access-token')
      expect(result.tokens.refreshToken).toBe('mock-refresh-token')
    })
  })

  describe('refresh', () => {
    it('debe refrescar tokens exitosamente', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'old-refresh-token',
      }
      authService.refreshTokens.mockResolvedValue(mockTokens)

      // Act
      const result = await controller.refresh(refreshTokenDto)

      // Assert
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'old-refresh-token',
      )
      expect(result).toEqual(mockTokens)
    })

    it('debe retornar nuevos tokens de acceso y actualización', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      }
      authService.refreshTokens.mockResolvedValue(mockTokens)

      // Act
      const result = await controller.refresh(refreshTokenDto)

      // Assert
      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
    })

    it('debe propagar errores del servicio de autenticación', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid-token',
      }
      authService.refreshTokens.mockRejectedValue(
        new Error('Invalid refresh token'),
      )

      // Act & Assert
      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        'Invalid refresh token',
      )
    })
  })

  describe('logout', () => {
    it('debe cerrar sesión exitosamente', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'refresh-token',
      }
      authService.logout.mockResolvedValue()

      // Act
      const result = await controller.logout(mockUser, refreshTokenDto)

      // Assert
      expect(authService.logout).toHaveBeenCalledWith('user-1', 'refresh-token')
      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' })
    })

    it('debe usar el ID del usuario autenticado', async () => {
      // Arrange
      const anotherUser = { ...mockUser, id: 'user-999' }
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'refresh-token',
      }
      authService.logout.mockResolvedValue()

      // Act
      await controller.logout(anotherUser as any, refreshTokenDto)

      // Assert
      expect(authService.logout).toHaveBeenCalledWith(
        'user-999',
        'refresh-token',
      )
    })

    it('debe retornar mensaje de confirmación', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'refresh-token',
      }
      authService.logout.mockResolvedValue()

      // Act
      const result = await controller.logout(mockUser, refreshTokenDto)

      // Assert
      expect(result.message).toBe('Sesión cerrada exitosamente')
    })
  })

  describe('logoutAll', () => {
    it('debe cerrar todas las sesiones exitosamente', async () => {
      // Arrange
      authService.logoutAll.mockResolvedValue()

      // Act
      const result = await controller.logoutAll(mockUser)

      // Assert
      expect(authService.logoutAll).toHaveBeenCalledWith('user-1')
      expect(result).toEqual({
        message: 'Todas las sesiones han sido cerradas',
      })
    })

    it('debe usar el ID del usuario autenticado', async () => {
      // Arrange
      const anotherUser = { ...mockUser, id: 'user-999' }
      authService.logoutAll.mockResolvedValue()

      // Act
      await controller.logoutAll(anotherUser as any)

      // Assert
      expect(authService.logoutAll).toHaveBeenCalledWith('user-999')
    })

    it('debe retornar mensaje de confirmación', async () => {
      // Arrange
      authService.logoutAll.mockResolvedValue()

      // Act
      const result = await controller.logoutAll(mockUser)

      // Assert
      expect(result.message).toBe('Todas las sesiones han sido cerradas')
    })
  })

  describe('getProfile', () => {
    it('debe retornar el perfil del usuario autenticado', async () => {
      // Act
      const result = await controller.getProfile(mockUser, Role.ADMINISTRADOR)

      // Assert
      expect(result).toEqual({
        id: 'user-1',
        username: 'juanp',
        email: 'juan@example.com',
        fullName: 'Juan Pérez',
        roles: [Role.ADMINISTRADOR],
        currentRole: Role.ADMINISTRADOR,
      })
    })

    it('debe mapear correctamente los roles del usuario', async () => {
      // Arrange
      const userWithMultipleRoles = {
        ...mockUser,
        roles: [Role.ADMINISTRADOR, Role.GERENTE, Role.AUDITOR],
      }

      // Act
      const result = await controller.getProfile(userWithMultipleRoles as any, Role.ADMINISTRADOR)

      // Assert
      expect(result.roles).toEqual([Role.ADMINISTRADOR, Role.GERENTE, Role.AUDITOR])
      expect(result.currentRole).toBe(Role.ADMINISTRADOR)
    })

    it('debe usar el fullName computado de la entidad User', async () => {
      // Arrange
      const userWithDifferentName = {
        ...mockUser,
        names: 'María',
        lastNames: 'García',
        get fullName() {
          return `${this.names} ${this.lastNames}`
        },
      }

      // Act
      const result = await controller.getProfile(userWithDifferentName as any, Role.ADMINISTRADOR)

      // Assert
      expect(result.fullName).toBe('María García')
    })

    it('debe incluir todos los campos requeridos del perfil', async () => {
      // Act
      const result = await controller.getProfile(mockUser)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('username')
      expect(result).toHaveProperty('email')
      expect(result).toHaveProperty('fullName')
      expect(result).toHaveProperty('roles')
    })
  })
})
