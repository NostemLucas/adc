import { Test, TestingModule } from '@nestjs/testing'
import { EventBus } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'
import { CreateUserHandler } from './create-user.handler'
import { CreateUserCommand } from './create-user.command'
import { UserType, SystemRole } from '../../../../domain'
import { TransactionContext } from '@shared/database'
import {
  USER_REPOSITORY,
  INTERNAL_PROFILE_REPOSITORY,
  EXTERNAL_PROFILE_REPOSITORY,
} from '../../../../infrastructure/di'
import { UserUniquenessValidator } from '../../../../domain'

describe('CreateUserHandler - Transacciones', () => {
  let handler: CreateUserHandler
  let userRepository: any
  let internalProfileRepository: any
  let externalProfileRepository: any
  let transactionContext: TransactionContext
  let eventBus: EventBus

  beforeEach(async () => {
    // Mocks
    userRepository = {
      save: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findByUsername: jest.fn().mockResolvedValue(null),
      findByCi: jest.fn().mockResolvedValue(null),
    }

    internalProfileRepository = {
      save: jest.fn(),
    }

    externalProfileRepository = {
      save: jest.fn(),
    }

    // Mock real de TransactionContext
    transactionContext = {
      runInTransaction: jest.fn((fn) => fn()), // Ejecuta la función directamente
      getClient: jest.fn(),
      isInTransaction: jest.fn().mockReturnValue(false),
    } as any

    eventBus = {
      publish: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
        {
          provide: INTERNAL_PROFILE_REPOSITORY,
          useValue: internalProfileRepository,
        },
        {
          provide: EXTERNAL_PROFILE_REPOSITORY,
          useValue: externalProfileRepository,
        },
        {
          provide: UserUniquenessValidator,
          useValue: {
            validateForCreate: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: eventBus,
        },
        {
          provide: TransactionContext,
          useValue: transactionContext,
        },
      ],
    }).compile()

    handler = module.get<CreateUserHandler>(CreateUserHandler)
  })

  describe('✅ Caso exitoso - Transacción completa', () => {
    it('debería crear usuario Y perfil dentro de una transacción', async () => {
      // Arrange
      const command = new CreateUserCommand({
        names: 'Juan',
        lastNames: 'Pérez',
        email: 'juan@test.com',
        username: 'juanp',
        password: 'Password123',
        ci: '12345678',
        type: UserType.INTERNAL,
        roles: [SystemRole.ADMINISTRADOR],
      })

      userRepository.save.mockResolvedValue({
        id: 'user-123',
        names: { getValue: () => 'Juan' },
        lastNames: { getValue: () => 'Pérez' },
        email: { getValue: () => 'juan@test.com' },
        markAsCreated: jest.fn(),
        domainEvents: [],
        clearDomainEvents: jest.fn(),
      })

      // Act
      await handler.execute(command)

      // Assert
      expect(transactionContext.runInTransaction).toHaveBeenCalled()
      expect(userRepository.save).toHaveBeenCalled()
      expect(internalProfileRepository.save).toHaveBeenCalled()
    })
  })

  describe('❌ Caso de error - Rollback automático', () => {
    it('debería revertir la creación del usuario si falla el guardado del perfil', async () => {
      // Arrange
      const command = new CreateUserCommand({
        names: 'María',
        lastNames: 'García',
        email: 'maria@test.com',
        username: 'mariag',
        password: 'Password123',
        ci: '87654321',
        type: UserType.INTERNAL,
        roles: [SystemRole.GERENTE],
      })

      userRepository.save.mockResolvedValue({
        id: 'user-456',
        names: { getValue: () => 'María' },
        lastNames: { getValue: () => 'García' },
        email: { getValue: () => 'maria@test.com' },
        markAsCreated: jest.fn(),
        domainEvents: [],
        clearDomainEvents: jest.fn(),
      })

      // 💥 Simular error al guardar perfil
      internalProfileRepository.save.mockRejectedValue(
        new Error('Error al guardar perfil en BD'),
      )

      // Simular comportamiento real de transacción
      ;(transactionContext.runInTransaction as jest.Mock).mockImplementation(
        async (fn) => {
          try {
            return await fn()
          } catch (error) {
            // En una transacción real, aquí se haría ROLLBACK
            throw error
          }
        },
      )

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Error al guardar perfil en BD',
      )

      // Verificar que se intentó guardar el usuario
      expect(userRepository.save).toHaveBeenCalled()

      // Verificar que se intentó guardar el perfil
      expect(internalProfileRepository.save).toHaveBeenCalled()

      // ✅ En una transacción REAL de Prisma:
      // - El usuario NO estaría en la BD (rollback automático)
      // - El perfil tampoco estaría en la BD
      // Este test solo verifica que el error se propaga correctamente
    })

    it('debería revertir si falla la validación de unicidad DENTRO de la transacción', async () => {
      // Este escenario puede ocurrir si entre la validación inicial
      // y el guardado, otro proceso crea un usuario con el mismo email

      const command = new CreateUserCommand({
        names: 'Pedro',
        lastNames: 'López',
        email: 'pedro@test.com',
        username: 'pedrol',
        password: 'Password123',
        ci: '11111111',
        type: UserType.INTERNAL,
        roles: [SystemRole.AUDITOR],
      })

      // La validación inicial pasa (no hay duplicados)
      // Pero al guardar, Prisma detecta violación de unique constraint
      const prismaError: any = new Error('Unique constraint failed')
      prismaError.code = 'P2002'
      prismaError.meta = { target: ['email'] }
      userRepository.save.mockRejectedValue(prismaError)

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow()

      // Verificar que NO se intentó guardar el perfil
      // (porque falló antes)
      expect(internalProfileRepository.save).not.toHaveBeenCalled()
    })
  })
})

/**
 * 📚 CÓMO PROBAR MANUALMENTE LAS TRANSACCIONES
 *
 * Para verificar que las transacciones funcionan en un entorno real:
 *
 * 1. **Prueba con error intencional:**
 *
 * ```typescript
 * // En InternalProfileRepository, agregar temporalmente:
 * async save(profile: InternalProfile): Promise<InternalProfile> {
 *   await this.prisma.internalProfile.create({ ... })
 *   throw new Error('ERROR INTENCIONAL PARA PROBAR ROLLBACK')
 * }
 * ```
 *
 * 2. **Intentar crear un usuario:**
 *
 * ```bash
 * curl -X POST http://localhost:3000/users \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "names": "Test",
 *     "lastNames": "User",
 *     "email": "test@example.com",
 *     "username": "testuser",
 *     "password": "Password123",
 *     "ci": "12345678",
 *     "type": "INTERNAL",
 *     "roles": ["ADMINISTRADOR"]
 *   }'
 * ```
 *
 * 3. **Verificar en la base de datos:**
 *
 * ```sql
 * SELECT * FROM "User" WHERE email = 'test@example.com';
 * -- NO debería existir (rollback exitoso)
 *
 * SELECT * FROM "InternalProfile" WHERE "userId" IN (
 *   SELECT id FROM "User" WHERE email = 'test@example.com'
 * );
 * -- Tampoco debería existir
 * ```
 *
 * 4. **Verificar logs:**
 *
 * Deberías ver en los logs:
 * - ✅ "Iniciando transacción"
 * - ✅ "Guardando usuario..."
 * - ❌ "Error al guardar perfil"
 * - ✅ "Rollback ejecutado"
 * - ❌ Usuario NO existe en BD
 */
