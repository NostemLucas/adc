import { Test, TestingModule } from '@nestjs/testing'
import { CreateUserUseCase } from './create-user.use-case'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories'
import { RoleRepository } from '../../../roles/infrastructure/role.repository'
import { CreateUserDto } from '../dto/create-user.dto'
import { User } from '../../domain/user.entity'
import { Role } from '../../../roles/domain/role.entity'
import { UserStatus } from '@prisma/client'
import { UserUniquenessValidator } from '../../domain/services'
import * as bcrypt from 'bcrypt'

jest.mock('bcrypt')

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let userRepository: jest.Mocked<IUserRepository>
  let roleRepository: jest.Mocked<RoleRepository>
  let uniquenessValidator: jest.Mocked<UserUniquenessValidator>

  // Hash bcrypt válido para testing (password123)
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
    // Mock repository using interface (easy to test!)
    const mockUserRepository: Partial<IUserRepository> = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findByCi: jest.fn(),
      existsByEmail: jest.fn(),
      existsByUsername: jest.fn(),
      existsByCi: jest.fn(),
    }

    const mockRoleRepository = {
      findByIds: jest.fn(),
    }

    const mockUniquenessValidator = {
      validateForCreate: jest.fn(),
      validateForUpdate: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: USER_REPOSITORY, // Using injection token!
          useValue: mockUserRepository,
        },
        {
          provide: RoleRepository,
          useValue: mockRoleRepository,
        },
        {
          provide: UserUniquenessValidator,
          useValue: mockUniquenessValidator,
        },
      ],
    }).compile()

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase)
    userRepository = module.get(USER_REPOSITORY)
    roleRepository = module.get(RoleRepository)
    uniquenessValidator = module.get(UserUniquenessValidator)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    const createUserDto: CreateUserDto = {
      names: 'Juan',
      lastNames: 'Pérez',
      email: 'juan@example.com',
      phone: '12345678',
      username: 'juanp',
      password: 'password123',
      ci: '12345678',
      roleIds: ['role-1'],
    }

    it('debe crear un usuario exitosamente', async () => {
      // Arrange
      uniquenessValidator.validateForCreate.mockResolvedValue(undefined)
      roleRepository.findByIds.mockResolvedValue([mockRole])
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(VALID_BCRYPT_HASH)
      userRepository.save.mockResolvedValue(mockUser)

      // Act
      const result = await useCase.execute(createUserDto)

      // Assert
      expect(uniquenessValidator.validateForCreate).toHaveBeenCalledWith(
        'juan@example.com',
        'juanp',
        '12345678',
      )
      expect(roleRepository.findByIds).toHaveBeenCalledWith(['role-1'])
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(userRepository.save).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('debe hashear la contraseña antes de crear el usuario', async () => {
      // Arrange
      uniquenessValidator.validateForCreate.mockResolvedValue(undefined)
      roleRepository.findByIds.mockResolvedValue([mockRole])
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(VALID_BCRYPT_HASH)
      userRepository.save.mockResolvedValue(mockUser)

      // Act
      await useCase.execute(createUserDto)

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      const saveCallArg = userRepository.save.mock.calls[0][0]
      expect(saveCallArg.password).toBe(VALID_BCRYPT_HASH)
    })

    it('debe asignar los roles encontrados al usuario', async () => {
      // Arrange
      const roles = [mockRole]
      uniquenessValidator.validateForCreate.mockResolvedValue(undefined)
      roleRepository.findByIds.mockResolvedValue(roles)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(VALID_BCRYPT_HASH)
      userRepository.save.mockResolvedValue(mockUser)

      // Act
      await useCase.execute(createUserDto)

      // Assert
      const saveCallArg = userRepository.save.mock.calls[0][0]
      expect(saveCallArg.roles).toEqual(roles)
    })

    it('debe fallar si no encuentra roles', async () => {
      // Arrange
      roleRepository.findByIds.mockResolvedValue([])
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(VALID_BCRYPT_HASH)

      // Act & Assert
      await expect(useCase.execute(createUserDto)).rejects.toThrow()
    })

    it('debe propagar errores del repositorio', async () => {
      // Arrange
      uniquenessValidator.validateForCreate.mockResolvedValue(undefined)
      roleRepository.findByIds.mockResolvedValue([mockRole])
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(VALID_BCRYPT_HASH)
      userRepository.save.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(useCase.execute(createUserDto)).rejects.toThrow(
        'Database error',
      )
    })
  })
})
