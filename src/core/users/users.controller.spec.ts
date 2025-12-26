import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { CreateUserUseCase } from './application/commands/create-user/create-user.use-case'
import { UpdateUserUseCase } from './application/commands/update-user/update-user.use-case'
import { DeleteUserUseCase } from './application/commands/delete-user/delete-user.use-case'
import { GetUserUseCase } from './application/queries/get-user/get-user.use-case'
import { ListUsersUseCase } from './application/queries/list-users/list-users.use-case'
import { CreateUserDto } from './application/commands/create-user/create-user.dto'
import { UpdateUserDto } from './application/commands/update-user/update-user.dto'
import { User } from './domain/user'
import { Role } from '../auth/domain/authorization'
import { UserStatus } from '@prisma/client'

describe('UsersController', () => {
  let controller: UsersController
  let createUserUseCase: jest.Mocked<CreateUserUseCase>
  let updateUserUseCase: jest.Mocked<UpdateUserUseCase>
  let getUserUseCase: jest.Mocked<GetUserUseCase>
  let listUsersUseCase: jest.Mocked<ListUsersUseCase>
  let deleteUserUseCase: jest.Mocked<DeleteUserUseCase>

  const VALID_BCRYPT_HASH =
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

  const mockRole: Role = {
    id: 'role-1',
    name: 'ADMINISTRADOR',
    description: 'Administrador del sistema',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  }

  const mockUser: User = {
    id: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    names: 'Juan',
    lastNames: 'Pérez',
    email: 'juan@example.com',
    phone: '12345678',
    username: 'juanp',
    password: VALID_BCRYPT_HASH,
    ci: '12345678',
    address: 'Calle 123',
    image: 'avatar.jpg',
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
    const mockCreateUserUseCase = {
      execute: jest.fn(),
    }

    const mockUpdateUserUseCase = {
      execute: jest.fn(),
    }

    const mockGetUserUseCase = {
      execute: jest.fn(),
    }

    const mockListUsersUseCase = {
      execute: jest.fn(),
    }

    const mockDeleteUserUseCase = {
      execute: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        {
          provide: UpdateUserUseCase,
          useValue: mockUpdateUserUseCase,
        },
        {
          provide: GetUserUseCase,
          useValue: mockGetUserUseCase,
        },
        {
          provide: ListUsersUseCase,
          useValue: mockListUsersUseCase,
        },
        {
          provide: DeleteUserUseCase,
          useValue: mockDeleteUserUseCase,
        },
      ],
    }).compile()

    controller = module.get<UsersController>(UsersController)
    createUserUseCase = module.get(CreateUserUseCase)
    updateUserUseCase = module.get(UpdateUserUseCase)
    getUserUseCase = module.get(GetUserUseCase)
    listUsersUseCase = module.get(ListUsersUseCase)
    deleteUserUseCase = module.get(DeleteUserUseCase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('debe crear un usuario exitosamente', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        names: 'Juan',
        lastNames: 'Pérez',
        email: 'juan@example.com',
        username: 'juanp',
        password: 'password123',
        ci: '12345678',
        phone: '12345678',
        roleIds: ['role-1'],
      }
      createUserUseCase.execute.mockResolvedValue(mockUser)

      // Act
      const result = await controller.create(createUserDto)

      // Assert
      expect(createUserUseCase.execute).toHaveBeenCalledWith(createUserDto)
      expect(result).toEqual({
        id: 'user-1',
        names: 'Juan',
        lastNames: 'Pérez',
        fullName: 'Juan Pérez',
        email: 'juan@example.com',
        username: 'juanp',
        ci: '12345678',
        phone: '12345678',
        address: 'Calle 123',
        image: 'avatar.jpg',
        status: UserStatus.ACTIVE,
        roles: ['ADMINISTRADOR'],
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      })
    })

    it('debe mapear correctamente los roles del usuario', async () => {
      // Arrange
      const userWithMultipleRoles = {
        ...mockUser,
        roles: [mockRole, { ...mockRole, id: 'role-2', name: 'GERENTE' }],
      }
      const createUserDto: CreateUserDto = {
        names: 'Juan',
        lastNames: 'Pérez',
        email: 'juan@example.com',
        username: 'juanp',
        password: 'password123',
        ci: '12345678',
        roleIds: ['role-1', 'role-2'],
      }
      createUserUseCase.execute.mockResolvedValue(userWithMultipleRoles as any)

      // Act
      const result = await controller.create(createUserDto)

      // Assert
      expect(result.roles).toEqual(['ADMINISTRADOR', 'GERENTE'])
    })
  })

  describe('list', () => {
    it('debe listar todos los usuarios activos', async () => {
      // Arrange
      const mockUser2 = {
        ...mockUser,
        id: 'user-2',
        names: 'María',
        email: 'maria@example.com',
        username: 'mariag',
      }
      listUsersUseCase.execute.mockResolvedValue([mockUser, mockUser2 as any])

      // Act
      const result = await controller.list()

      // Assert
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('user-1')
      expect(result[1].id).toBe('user-2')
    })

    it('debe retornar un array vacío si no hay usuarios', async () => {
      // Arrange
      listUsersUseCase.execute.mockResolvedValue([])

      // Act
      const result = await controller.list()

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('debe mapear correctamente todos los campos de los usuarios', async () => {
      // Arrange
      listUsersUseCase.execute.mockResolvedValue([mockUser])

      // Act
      const result = await controller.list()

      // Assert
      expect(result[0]).toEqual({
        id: 'user-1',
        names: 'Juan',
        lastNames: 'Pérez',
        fullName: 'Juan Pérez',
        email: 'juan@example.com',
        username: 'juanp',
        ci: '12345678',
        phone: '12345678',
        address: 'Calle 123',
        image: 'avatar.jpg',
        status: UserStatus.ACTIVE,
        roles: ['ADMINISTRADOR'],
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      })
    })
  })

  describe('getById', () => {
    it('debe obtener un usuario por ID', async () => {
      // Arrange
      getUserUseCase.execute.mockResolvedValue(mockUser)

      // Act
      const result = await controller.getById('user-1')

      // Assert
      expect(getUserUseCase.execute).toHaveBeenCalledWith('user-1')
      expect(result.id).toBe('user-1')
      expect(result.email).toBe('juan@example.com')
    })

    it('debe mapear correctamente los datos del usuario', async () => {
      // Arrange
      getUserUseCase.execute.mockResolvedValue(mockUser)

      // Act
      const result = await controller.getById('user-1')

      // Assert
      expect(result).toEqual({
        id: 'user-1',
        names: 'Juan',
        lastNames: 'Pérez',
        fullName: 'Juan Pérez',
        email: 'juan@example.com',
        username: 'juanp',
        ci: '12345678',
        phone: '12345678',
        address: 'Calle 123',
        image: 'avatar.jpg',
        status: UserStatus.ACTIVE,
        roles: ['ADMINISTRADOR'],
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      })
    })
  })

  describe('update', () => {
    it('debe actualizar un usuario exitosamente', async () => {
      // Arrange
      const updateUserDto: UpdateUserDto = {
        names: 'Juan Carlos',
        email: 'juancarlos@example.com',
      }
      const updatedUser = {
        ...mockUser,
        names: 'Juan Carlos',
        email: 'juancarlos@example.com',
      }
      updateUserUseCase.execute.mockResolvedValue(updatedUser as any)

      // Act
      const result = await controller.update('user-1', updateUserDto)

      // Assert
      expect(updateUserUseCase.execute).toHaveBeenCalledWith(
        'user-1',
        updateUserDto,
      )
      expect(result.names).toBe('Juan Carlos')
      expect(result.email).toBe('juancarlos@example.com')
    })

    it('debe mapear correctamente el usuario actualizado', async () => {
      // Arrange
      const updateUserDto: UpdateUserDto = {
        phone: '99999999',
        address: 'Nueva dirección',
      }
      const updatedUser = {
        ...mockUser,
        phone: '99999999',
        address: 'Nueva dirección',
      }
      updateUserUseCase.execute.mockResolvedValue(updatedUser as any)

      // Act
      const result = await controller.update('user-1', updateUserDto)

      // Assert
      expect(result.phone).toBe('99999999')
      expect(result.address).toBe('Nueva dirección')
    })
  })

  describe('delete', () => {
    it('debe eliminar un usuario exitosamente', async () => {
      // Arrange
      deleteUserUseCase.execute.mockResolvedValue()

      // Act
      await controller.delete('user-1')

      // Assert
      expect(deleteUserUseCase.execute).toHaveBeenCalledWith('user-1')
    })

    it('no debe retornar ningún valor', async () => {
      // Arrange
      deleteUserUseCase.execute.mockResolvedValue()

      // Act
      const result = await controller.delete('user-1')

      // Assert
      expect(result).toBeUndefined()
    })
  })
})
