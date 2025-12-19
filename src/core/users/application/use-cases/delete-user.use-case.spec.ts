import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { DeleteUserUseCase } from './delete-user.use-case'
import { UserRepository } from '../../infrastructure/user.repository'
import { User } from '../../domain/user.entity'
import { Role } from '../../../roles/domain/role.entity'
import { UserStatus } from '@prisma/client'

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase
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
      findByIdOrFail: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUserUseCase,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile()

    useCase = module.get<DeleteUserUseCase>(DeleteUserUseCase)
    userRepository = module.get(UserRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('debe eliminar un usuario exitosamente', async () => {
      // Arrange
      userRepository.findByIdOrFail.mockResolvedValue(mockUser)
      userRepository.delete.mockResolvedValue()

      // Act
      await useCase.execute('user-1')

      // Assert
      expect(userRepository.findByIdOrFail).toHaveBeenCalledWith('user-1')
      expect(userRepository.delete).toHaveBeenCalledWith('user-1')
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange
      userRepository.findByIdOrFail.mockRejectedValue(
        new NotFoundException('Usuario con ID user-999 no encontrado')
      )

      // Act & Assert
      await expect(useCase.execute('user-999')).rejects.toThrow(NotFoundException)
      expect(userRepository.findByIdOrFail).toHaveBeenCalledWith('user-999')
      expect(userRepository.delete).not.toHaveBeenCalled()
    })

    it('debe verificar existencia antes de eliminar', async () => {
      // Arrange
      userRepository.findByIdOrFail.mockResolvedValue(mockUser)
      userRepository.delete.mockResolvedValue()

      // Act
      await useCase.execute('user-1')

      // Assert
      const findCallOrder = userRepository.findByIdOrFail.mock.invocationCallOrder[0]
      const deleteCallOrder = userRepository.delete.mock.invocationCallOrder[0]
      expect(findCallOrder).toBeLessThan(deleteCallOrder)
    })

    it('debe propagar errores del repositorio', async () => {
      // Arrange
      userRepository.findByIdOrFail.mockResolvedValue(mockUser)
      userRepository.delete.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(useCase.execute('user-1')).rejects.toThrow('Database error')
    })
  })
})
