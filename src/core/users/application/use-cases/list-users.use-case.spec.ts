import { Test, TestingModule } from '@nestjs/testing'
import { ListUsersUseCase } from './list-users.use-case'
import { UserRepository } from '../../infrastructure/user.repository'
import { User } from '../../domain/user.entity'
import { Role } from '../../../roles/domain/role.entity'
import { UserStatus } from '@prisma/client'

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase
  let userRepository: jest.Mocked<UserRepository>

  const VALID_BCRYPT_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

  const mockRole: Role = {
    id: 'role-1',
    name: 'ADMINISTRADOR',
    description: 'Administrador del sistema',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  const mockUser1: User = {
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

  const mockUser2: User = {
    id: 'user-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    names: 'María',
    lastNames: 'García',
    email: 'maria@example.com',
    phone: '87654321',
    username: 'mariag',
    password: VALID_BCRYPT_HASH,
    ci: '87654321',
    status: UserStatus.ACTIVE,
    failedLoginAttempts: 0,
    lockUntil: null,
    roles: [{ ...mockRole, id: 'role-2', name: 'GERENTE' }],
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
      findActiveUsers: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListUsersUseCase,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile()

    useCase = module.get<ListUsersUseCase>(ListUsersUseCase)
    userRepository = module.get(UserRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('debe listar usuarios activos exitosamente', async () => {
      // Arrange
      const mockUsers = [mockUser1, mockUser2]
      userRepository.findActiveUsers.mockResolvedValue(mockUsers)

      // Act
      const result = await useCase.execute()

      // Assert
      expect(userRepository.findActiveUsers).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockUsers)
      expect(result).toHaveLength(2)
    })

    it('debe retornar un array vacío si no hay usuarios activos', async () => {
      // Arrange
      userRepository.findActiveUsers.mockResolvedValue([])

      // Act
      const result = await useCase.execute()

      // Assert
      expect(userRepository.findActiveUsers).toHaveBeenCalledTimes(1)
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('debe retornar usuarios con sus roles cargados', async () => {
      // Arrange
      const mockUsers = [mockUser1, mockUser2]
      userRepository.findActiveUsers.mockResolvedValue(mockUsers)

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result[0].roles).toBeDefined()
      expect(result[0].roles[0].name).toBe('ADMINISTRADOR')
      expect(result[1].roles).toBeDefined()
      expect(result[1].roles[0].name).toBe('GERENTE')
    })

    it('debe propagar errores del repositorio', async () => {
      // Arrange
      userRepository.findActiveUsers.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Database error')
    })

    it('debe retornar solo usuarios con estado ACTIVE', async () => {
      // Arrange
      const activeUsers = [mockUser1, mockUser2]
      userRepository.findActiveUsers.mockResolvedValue(activeUsers)

      // Act
      const result = await useCase.execute()

      // Assert
      result.forEach((user) => {
        expect(user.status).toBe(UserStatus.ACTIVE)
      })
    })
  })
})
