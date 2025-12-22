import { Test, TestingModule } from '@nestjs/testing'
import { UpdateUserUseCase } from './update-user.use-case'
import { UserRepository } from '../../infrastructure/user.repository'
import { RoleRepository } from '../../../roles/infrastructure/role.repository'
import { UpdateUserDto } from '../dto/update-user.dto'
import { User } from '../../domain/user.entity'
import { Role } from '../../../roles/domain/role.entity'
import { UserStatus } from '@prisma/client'
import { NotFoundException } from '@nestjs/common'

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase
  let userRepository: jest.Mocked<UserRepository>
  let roleRepository: jest.Mocked<RoleRepository>

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
    password: 'hashed-password',
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
    update: jest.fn(),
  }

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
      findByIdOrFail: jest.fn(),
      update: jest.fn(),
    }

    const mockRoleRepository = {
      findByIds: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserUseCase,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: RoleRepository,
          useValue: mockRoleRepository,
        },
      ],
    }).compile()

    useCase = module.get<UpdateUserUseCase>(UpdateUserUseCase)
    userRepository = module.get(UserRepository)
    roleRepository = module.get(RoleRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    const updateUserDto: UpdateUserDto = {
      names: 'Juan Actualizado',
      email: 'juan.nuevo@example.com',
    }

    it('debe actualizar un usuario exitosamente', async () => {
      // Arrange
      userRepository.findByIdOrFail.mockResolvedValue(mockUser)
      userRepository.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      })

      // Act
      const result = await useCase.execute('user-1', updateUserDto)

      // Assert
      expect(userRepository.findByIdOrFail).toHaveBeenCalledWith('user-1')
      expect(userRepository.update).toHaveBeenCalled()
      expect(result.names).toBe('Juan Actualizado')
      expect(result.email).toBe('juan.nuevo@example.com')
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange
      userRepository.findByIdOrFail.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      )

      // Act & Assert
      await expect(useCase.execute('user-999', updateUserDto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('debe actualizar roles si se proporcionan roleIds', async () => {
      // Arrange
      const newRole: Role = {
        id: 'role-2',
        name: 'GERENTE',
        description: 'Gerente',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }
      const dtoWithRoles: UpdateUserDto = {
        ...updateUserDto,
        roleIds: ['role-2'],
      }

      userRepository.findByIdOrFail.mockResolvedValue(mockUser)
      roleRepository.findByIds.mockResolvedValue([newRole])
      userRepository.update.mockResolvedValue({
        ...mockUser,
        ...dtoWithRoles,
        roles: [newRole],
      })

      // Act
      await useCase.execute('user-1', dtoWithRoles)

      // Assert
      expect(roleRepository.findByIds).toHaveBeenCalledWith(['role-2'])
      expect(userRepository.update).toHaveBeenCalled()
    })

    it('no debe llamar roleRepository si no se proporcionan roleIds', async () => {
      // Arrange
      userRepository.findByIdOrFail.mockResolvedValue(mockUser)
      userRepository.update.mockResolvedValue(mockUser)

      // Act
      await useCase.execute('user-1', updateUserDto)

      // Assert
      expect(roleRepository.findByIds).not.toHaveBeenCalled()
    })
  })
})
