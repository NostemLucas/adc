import { Test, TestingModule } from '@nestjs/testing'
import { InvalidateSessionUseCase } from './invalidate-session.use-case'
import { SessionRepository } from '../../infrastructure/session.repository'

describe('InvalidateSessionUseCase', () => {
  let useCase: InvalidateSessionUseCase
  let sessionRepository: jest.Mocked<SessionRepository>

  beforeEach(async () => {
    const mockSessionRepository = {
      invalidateSession: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvalidateSessionUseCase,
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
      ],
    }).compile()

    useCase = module.get<InvalidateSessionUseCase>(InvalidateSessionUseCase)
    sessionRepository = module.get(SessionRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('debe invalidar una sesión exitosamente', async () => {
      // Arrange
      const sessionId = 'session-123'
      sessionRepository.invalidateSession.mockResolvedValue()

      // Act
      await useCase.execute(sessionId)

      // Assert
      expect(sessionRepository.invalidateSession).toHaveBeenCalledWith('session-123')
      expect(sessionRepository.invalidateSession).toHaveBeenCalledTimes(1)
    })

    it('debe llamar al repositorio con el ID correcto', async () => {
      // Arrange
      const sessionId = 'different-session-id'
      sessionRepository.invalidateSession.mockResolvedValue()

      // Act
      await useCase.execute(sessionId)

      // Assert
      expect(sessionRepository.invalidateSession).toHaveBeenCalledWith('different-session-id')
    })

    it('no debe retornar ningún valor', async () => {
      // Arrange
      const sessionId = 'session-123'
      sessionRepository.invalidateSession.mockResolvedValue()

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result).toBeUndefined()
    })

    it('debe propagar errores del repositorio', async () => {
      // Arrange
      const sessionId = 'session-123'
      sessionRepository.invalidateSession.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(useCase.execute(sessionId)).rejects.toThrow('Database error')
    })

    it('debe manejar errores de sesión no encontrada', async () => {
      // Arrange
      const sessionId = 'non-existent-session'
      sessionRepository.invalidateSession.mockRejectedValue(
        new Error('Session not found'),
      )

      // Act & Assert
      await expect(useCase.execute(sessionId)).rejects.toThrow('Session not found')
    })
  })
})
