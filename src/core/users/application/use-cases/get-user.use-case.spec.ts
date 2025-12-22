import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { GetUserUseCase } from './get-user.use-case'
import { UserRepository } from '../../infrastructure/user.repository'
import { User } from '../../domain/user.entity'
import { Role } from '../../../roles/domain/role.entity'
import { UserStatus } from '@prisma/client'

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase
  let userRepository: jest.Mocked<UserRepository>

  const VALID_BCRYPT_HASH =
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

  const mockRole: Role = {
    id: 'role-1',
    name: 'ADMINISTRADOR',
    description: 'Administrador del sistema',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

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
    roles: [mockRole],
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

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserUseCase,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile()

    useCase = module.get<GetUserUseCase>(GetUserUseCase)
    userRepository = module.get(UserRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('debe obtener un usuario exitosamente', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser)

      // Act
      const result = await useCase.execute('user-1')

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1')
      expect(result).toEqual(mockUser)
      expect(result.id).toBe('user-1')
      expect(result.email).toBe('juan@example.com')
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute('user-999')).rejects.toThrow(
        NotFoundException,
      )
      await expect(useCase.execute('user-999')).rejects.toThrow(
        'Usuario con ID user-999 no encontrado',
      )
      expect(userRepository.findById).toHaveBeenCalledWith('user-999')
    })

    it('debe retornar el usuario con sus roles cargados', async () => {
      // Arrange
      const userWithRoles = {
        ...mockUser,
        roles: [mockRole, { ...mockRole, id: 'role-2', name: 'GERENTE' }],
      }
      userRepository.findById.mockResolvedValue(userWithRoles as any)

      // Act
      const result = await useCase.execute('user-1')

      // Assert
      expect(result.roles).toHaveLength(2)
      expect(result.roles[0].name).toBe('ADMINISTRADOR')
      expect(result.roles[1].name).toBe('GERENTE')
    })

    it('debe propagar errores del repositorio', async () => {
      // Arrange
      userRepository.findById.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(useCase.execute('user-1')).rejects.toThrow('Database error')
    })
  })
})
